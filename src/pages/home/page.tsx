import { useState, useEffect } from "react";
import { motion } from "framer-motion";

import { getHomeUpcoming } from "@/lib/utils/home";
import { staggerGroup } from "@/lib/motion";
import { getFirstName } from "@/lib/api/helper";
import { fetchImportantMessage } from "@/lib/api/supa";
import { useQuery } from "@tanstack/react-query";
import { fetchPlanning } from "@/lib/api/aurion";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { Lesson } from "@/types/aurion";
import {
    EmptyState,
    ImportantMessage,
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

    const {
        data: lessons = [],
        refetch,
        isLoading,
        isFetching,
    } = useQuery<Lesson[], Error>({
        queryKey: ["planning"],
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

    const isBusy = isLoading || isFetching;

    const handleRefresh = () => {
        void refetch();
    };

    const { data: importantMessage } = useQuery({
        queryKey: ["importantMessage"],
        queryFn: fetchImportantMessage,
        staleTime: 1000 * 60 * 5, // 5 min
        gcTime: 1000 * 60 * 5, // 5 min
        refetchOnMount: true,
        refetchOnWindowFocus: true,
        refetchIntervalInBackground: true,
        refetchInterval: 1000 * 60 * 5, // 5 min
    });

    const { current, today, tomorrow } = getHomeUpcoming({ lessons });
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
                <ImportantMessage message={importantMessage} />
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
