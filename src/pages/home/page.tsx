import { useState, useEffect } from "react";

import { getHomeUpcoming } from "@/lib/utils/home";
import { getFirstName } from "@/lib/api/helper";
import { fetchImportantMessage } from "@/lib/api/supa";
import { useQuery } from "@tanstack/react-query";
import { fetchPlanning } from "@/lib/api/aurion";
import ReactPullToRefresh from "react-simple-pull-to-refresh";
import { Lesson } from "@/types/aurion";
import {
    EmptyState,
    ImportantMessage,
    LessonsSection,
    WelcomeHeader,
} from "./sections";
import { DrawerPlanningContent } from "@/components/drawer-planning-content";
import { PreparedLesson } from "@/types/home";

export function HomePage() {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [currentLesson, setCurrentLesson] = useState<PreparedLesson | null>(
        null
    );

    const {
        data: lessons = [],
        refetch,
        isLoading,
    } = useQuery<Lesson[], Error>({
        queryKey: ["planning"],
        queryFn: () => fetchPlanning().then((res) => res?.data || []),
        staleTime: 1000 * 60 * 5, // 5 min frais
        gcTime: 1000 * 60 * 60 * 24, // 24h cache
        refetchIntervalInBackground: true,
        refetchInterval: 1000 * 60 * 5, // 5 min
    });

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
    const [firstName, setFirstName] = useState<string>(
        "et bienvenue sur Mauria"
    );

    useEffect(() => {
        const loadFirstName = async () => {
            try {
                const name = await getFirstName();
                setFirstName(name || "et bienvenue sur Mauria");
            } catch {
                setFirstName("et bienvenue sur Mauria");
            }
        };
        loadFirstName();
    }, []);

    return (
        <ReactPullToRefresh
            onRefresh={handleRefresh}
            isPullable={!isLoading}
            className="min-h-[80vh]"
        >
            <WelcomeHeader firstName={firstName} />
            <ImportantMessage message={importantMessage} />

            {current && (
                <LessonsSection
                    title="En cours"
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
                    title="Aujourd'hui"
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
                    title="Demain"
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
        </ReactPullToRefresh>
    );
}
