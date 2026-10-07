import { useState, useEffect } from "react";
import { motion } from "framer-motion";

import { buildWidgetLessons, getHomeUpcoming } from "@/lib/utils/home";
import { hasWidgetPlugin, pushWidgetPlanning } from "@/lib/native/widget";
import { useWidgetGradesSync } from "@/lib/native/use-widget-grades-sync";
import { staggerGroup } from "@/lib/motion";
import { getFirstName } from "@/lib/api/helper";
import { fetchImportantMessage } from "@/lib/api/supa";
import { useJuniaStatus } from "@/lib/hooks/use-junia-status";
import { useAurionWarm } from "@/lib/hooks/use-aurion-warm";
import { useColles, useResolvedPlanning } from "@/lib/hooks/use-colles";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchPlanning } from "@/lib/api/aurion";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { Lesson } from "@/types/aurion";
import {
    EmptyState,
    ImportantMessage,
    JuniaStatusWarning,
    LessonsSection,
    WelcomeHeader,
} from "./sections";
import { RestaurantsSection } from "./restaurants";
import { DrawerPlanningContent } from "@/components/drawer-planning-content";
import { PreparedLesson } from "@/types/home";
import { useTranslation } from "react-i18next";

export function HomePage() {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [currentLesson, setCurrentLesson] = useState<PreparedLesson | null>(
        null
    );
    const { t } = useTranslation();
    const { isWarming } = useAurionWarm();
    const queryClient = useQueryClient();

    const {
        data: lessons = [],
        refetch,
        isLoading,
        isFetching,
    } = useQuery<Lesson[], Error>({
        queryKey: ["planning"],
        enabled: !isWarming,
        queryFn: async (): Promise<Lesson[]> => {
            const res = await fetchPlanning();
            // Throw (don't fall back) on failure so React Query keeps the
            // cached data instead of wiping it — e.g. a failed
            // refetch-on-focus after the app was backgrounded.
            if (!res?.success) {
                throw new Error("Failed to fetch planning");
            }
            return res.data ?? [];
        },
        staleTime: 1000 * 60 * 5, // 5 min frais
        gcTime: 1000 * 60 * 60 * 24, // 24h cache
        refetchIntervalInBackground: true,
        refetchInterval: 1000 * 60 * 5, // 5 min
        placeholderData: (previousData) => previousData,
    });

    const isBusy = isWarming || isLoading || isFetching;

    // Pull-to-refresh refreshes every query the page shows, not just the
    // planning: the RU menu, the important messages and the Junia status
    // have no pull wiring of their own. Unmounted keys (the other campus's
    // RU menu) are a no-op.
    const handleRefresh = () => {
        void refetch();
        void queryClient.refetchQueries({ queryKey: ["importantMessages"] });
        void queryClient.refetchQueries({ queryKey: ["juniaStatus"] });
        void queryClient.refetchQueries({ queryKey: ["dailyMenu"] });
        void queryClient.refetchQueries({ queryKey: ["castelRuMenu"] });
    };

    const { data: importantMessages = [] } = useQuery({
        queryKey: ["importantMessages"],
        queryFn: fetchImportantMessage,
        staleTime: 1000 * 60 * 5, // 5 min
        gcTime: 1000 * 60 * 5, // 5 min
        refetchOnMount: true,
        refetchOnWindowFocus: true,
        refetchIntervalInBackground: true,
        refetchInterval: 1000 * 60 * 5, // 5 min
    });

    const juniaStatus = useJuniaStatus();

    const colles = useColles();
    const resolvedLessons = useResolvedPlanning(lessons);

    const { current, today, tomorrow } = getHomeUpcoming({
        lessons: [...resolvedLessons, ...colles],
    });

    // Pousse le planning au widget Android a chaque fois que les cours ou les
    // khôlles changent. Le planning résolu remplace le DS générique des
    // MPI/PSI par le vrai, et les khôlles suivent le même format de titre
    // qu'Aurion (cf. buildCollesLessons), donc parseFromTitle les lit.
    useEffect(() => {
        if (resolvedLessons.length === 0 || !hasWidgetPlugin()) return;
        void pushWidgetPlanning(
            buildWidgetLessons([...resolvedLessons, ...colles])
        );
    }, [resolvedLessons, colles]);

    // Idem pour le widget de notes, depuis le cache : sinon il ne se
    // rafraichit qu'en ouvrant la page notes.
    useWidgetGradesSync();
    const [firstName, setFirstName] = useState<string>(t("homePage.welcome"));

    useEffect(() => {
        const loadFirstName = async () => {
            try {
                const name = await getFirstName();
                setFirstName(name || t("homePage.welcome"));
            } catch {
                setFirstName(t("homePage.welcome"));
            }
        };
        loadFirstName();
    }, [t]);

    return (
        <PullToRefresh
            onRefresh={handleRefresh}
            isPullable={!isBusy}
            pullingText={t("common.pullToRefresh")}
            refreshingText={t("common.refreshing")}
        >
            <motion.div variants={staggerGroup} initial="hidden" animate="show">
                <WelcomeHeader firstName={firstName} />
                <ImportantMessage messages={importantMessages} />
                <JuniaStatusWarning status={juniaStatus} />
                <RestaurantsSection />

                {current && (
                    <LessonsSection
                        title={t("homePage.current")}
                        lessons={[current]}
                        keyPrefix="current"
                        onClick={(lesson) => () => {
                            setDrawerOpen(true);
                            setCurrentLesson(lesson);
                        }}
                    />
                )}
                {today.length > 0 && (
                    <LessonsSection
                        title={t("homePage.today")}
                        lessons={today}
                        keyPrefix="today"
                        onClick={(lesson) => () => {
                            setDrawerOpen(true);
                            setCurrentLesson(lesson);
                        }}
                    />
                )}
                {!current && today.length === 0 && tomorrow.length > 0 && (
                    <LessonsSection
                        title={t("homePage.tomorrow")}
                        lessons={tomorrow}
                        keyPrefix="tomorrow"
                        onClick={(lesson) => () => {
                            setDrawerOpen(true);
                            setCurrentLesson(lesson);
                        }}
                    />
                )}
                {!current && today.length === 0 && tomorrow.length === 0 && (
                    <EmptyState />
                )}
            </motion.div>
            <DrawerPlanningContent
                drawerOpen={drawerOpen}
                setDrawerOpen={setDrawerOpen}
                eventInfo={currentLesson}
            />
        </PullToRefresh>
    );
}
