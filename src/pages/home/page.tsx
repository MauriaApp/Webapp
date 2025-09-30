import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { getHomeUpcoming } from "@/lib/utils/home";
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
        queryFn: () => fetchPlanning().then((res) => res?.data || []),
        staleTime: 1000 * 60 * 5, // 5 min frais
        gcTime: 1000 * 60 * 60 * 24, // 24h cache
        refetchIntervalInBackground: true,
        refetchInterval: 1000 * 60 * 5, // 5 min
    });

    const toastTimeoutRef = useRef<number | null>(null);
    const toastShownRef = useRef(false);

    useEffect(() => {
        const TOAST_ID = "planning-loading";

        if (isLoading || isFetching) {
            // Avoid flashing toasts: only show if fetch lasts > 250ms
            if (toastTimeoutRef.current == null) {
                toastTimeoutRef.current = window.setTimeout(() => {
                    console.log("Showing toast");
                    toast.loading(t("homePage.loadingSchedule"), {
                        id: TOAST_ID,
                    });
                    toastShownRef.current = true;
                    toastTimeoutRef.current = null;
                }, 250);
            }
        } else {
            // Clear any pending show and dismiss if visible
            if (toastTimeoutRef.current != null) {
                window.clearTimeout(toastTimeoutRef.current);
                toastTimeoutRef.current = null;
            }
            if (toastShownRef.current) {
                console.log("Hiding toast");
                toast.dismiss(TOAST_ID);
                toastShownRef.current = false;
            }
        }

        return () => {
            if (toastTimeoutRef.current != null) {
                window.clearTimeout(toastTimeoutRef.current);
                toastTimeoutRef.current = null;
            }
            if (toastShownRef.current) {
                toast.dismiss(TOAST_ID);
                toastShownRef.current = false;
            }
        };
    }, [isLoading, isFetching]);

    const handleRefresh = async () => {
        await refetch();
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
            isPullable={!isLoading}
            pullingText={t("common.pullToRefresh")}
            refreshingText={t("common.refreshing")}
        >
            <WelcomeHeader firstName={firstName} />
            <ImportantMessage message={importantMessage} />

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
            <DrawerPlanningContent
                drawerOpen={drawerOpen}
                setDrawerOpen={setDrawerOpen}
                eventInfo={currentLesson}
            />
        </PullToRefresh>
    );
}
