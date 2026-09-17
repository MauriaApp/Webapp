import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import FullCalendar from "@fullcalendar/react";
import FrLocale from "@fullcalendar/core/locales/fr";
import EsLocale from "@fullcalendar/core/locales/es";
import { ArrowLeft, Search } from "lucide-react";
import { fetchGrades, fetchPlanning, getSession } from "@/lib/api/aurion";
import { useQuery } from "@tanstack/react-query";
import { fadeIn, staggerGroup } from "@/lib/motion";
import "./planning.css";

import { PullToRefresh } from "@/components/pull-to-refresh";
import { PlanningCalendar } from "@/components/planning-calendar";
import { Grade, Lesson } from "@/types/aurion";
import { parseFromTitle } from "@/lib/utils/home";
import { detectStudentClass } from "@/lib/utils/grades";
import { DrawerEventTask } from "@/components/drawer-event-task";
import { getUserEventsFromLocalStorage } from "@/lib/utils/planning";
import { getColleLessons } from "@/lib/utils/colles";
import { PreparedLesson } from "@/types/home";
import { DrawerPlanningContent } from "@/components/drawer-planning-content";
import { FreeRoomsView } from "./free-rooms-view";
import { format } from "date-fns";
import { getDateLocale } from "@/lib/utils/translations";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { exportCalendar } from "@/lib/utils/exportCalendar";

export function PlanningPage() {
    const calendarRef = useRef<FullCalendar>(null);
    const { t, i18n } = useTranslation();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [eventInfo, setEventInfo] = useState<PreparedLesson | null>(null);
    const [userEvents, setUserEvents] = useState<Lesson[]>(
        getUserEventsFromLocalStorage()
    );
    const [view, setView] = useState<"calendar" | "freeRooms">("calendar");

    // Whether the student is CPG1/CPG2 is only known for sure from their
    // Aurion grade codes (detectStudentClass) — this same query backs the
    // grades page, so it's usually already cached. It gates how loosely the
    // server is allowed to match khôlles by name (see getColleLessons).
    const { data: grades = [] } = useQuery<Grade[]>({
        queryKey: ["grades"],
        queryFn: async () => {
            const res = await fetchGrades();
            if (!res?.success) throw new Error("Failed to fetch grades");
            return res.data ?? [];
        },
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 60 * 24,
    });
    const confirmedCpg = detectStudentClass(grades) !== null;

    // Classes whose colles schedule is known (MP2I, MPSI, PSI and MPI) get
    // theirs laid over the Aurion planning. The class/group lookup is a
    // server call (API-v2 resolves it from the email, roster stays there).
    const { data: colles = [] } = useQuery<Lesson[]>({
        queryKey: ["colles", getSession()?.email, i18n.language, confirmedCpg],
        queryFn: () => getColleLessons(getSession()?.email, confirmedCpg),
        staleTime: 1000 * 60 * 60 * 24, // a student's class doesn't change daily
        gcTime: 1000 * 60 * 60 * 24,
    });

    useEffect(() => {
        const handler = (lng: string) => {
            const fcLocale =
                lng === "fr" ? FrLocale : lng === "es" ? EsLocale : undefined;
            calendarRef.current?.getApi().setOption("locale", fcLocale);
        };
        i18n.on("languageChanged", handler);
        return () => {
            i18n.off("languageChanged", handler);
        };
    }, [i18n]);

    const {
        data: lessons = [],
        refetch,
        isLoading,
        isFetching,
        dataUpdatedAt,
    } = useQuery<Lesson[], Error>({
        queryKey: ["planning"],
        queryFn: async (): Promise<Lesson[]> => {
            const res = await fetchPlanning();
            // Throw (don't return []) on failure so React Query keeps the
            // cached data instead of wiping it — e.g. a failed
            // refetch-on-focus after the app was backgrounded.
            if (!res?.success) {
                throw new Error("Failed to fetch planning");
            }
            return res.data ?? [];
        },
        staleTime: 1000 * 60 * 5, // 5 min frais
        gcTime: 1000 * 60 * 60 * 24, // 24h cache
        refetchOnWindowFocus: true, // refresh background si focus fenêtre
        placeholderData: (previousData) => previousData,
    });

    const isBusy = isLoading || isFetching;

    const handleRefresh = () => {
        void refetch();
    };

    const handleExport = () => {
        void exportCalendar(lessons);
    };

    return (
        <PullToRefresh
            onRefresh={handleRefresh}
            isPullable={view === "calendar" && !isBusy}
            pullingText={t("common.pullToRefresh")}
            refreshingText={t("common.refreshing")}
        >
            <motion.div variants={staggerGroup} initial="hidden" animate="show">
                <motion.div
                    variants={fadeIn}
                    className="flex items-center justify-between gap-2 mt-4 mb-6"
                >
                    <h2 className="text-3xl font-bold text-mauria-purple dark:text-white">
                        {t(
                            view === "calendar"
                                ? "schedulePage.title"
                                : "schedulePage.freeRooms.title"
                        )}
                    </h2>
                    {view === "calendar" ? (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setView("freeRooms")}
                        >
                            <Search className="h-4 w-4" />
                            {t("schedulePage.freeRooms.button")}
                        </Button>
                    ) : (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setView("calendar")}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            {t("schedulePage.freeRooms.back")}
                        </Button>
                    )}
                </motion.div>

                {view === "calendar" ? (
                    <motion.section
                        variants={fadeIn}
                        className="rounded-lg overflow-hidden shadow-lg"
                    >
                        <PlanningCalendar
                            ref={calendarRef}
                            eventSources={[lessons, userEvents, colles]}
                            onEventClick={(info) => {
                                const event = info.event.toJSON();

                                const {
                                    courseTitle,
                                    location,
                                    type,
                                    teacher,
                                } = parseFromTitle(event as Lesson);
                                const mixedEvent = {
                                    courseTitle,
                                    location,
                                    type,
                                    teacher,
                                    details: event,
                                } as unknown as PreparedLesson;

                                setEventInfo(mixedEvent);
                                setDrawerOpen(true);
                            }}
                        />
                        <div className="text-sm font-semibold mt-2 ml-2 text-mauria-purple dark:text-gray-300">
                            {t("schedulePage.lastUpdate")}{" "}
                            {format(
                                new Date(dataUpdatedAt),
                                "EEEE d MMM HH'h'mm",
                                {
                                    locale: getDateLocale(i18n.language),
                                }
                            )}
                        </div>
                        <Button
                            className="mt-2"
                            onClick={handleExport}
                            disabled={lessons.length === 0 || isBusy}
                        >
                            {t("schedulePage.exportSchedule")}
                        </Button>
                        <p className="mt-2 italic">
                            {t("schedulePage.warnExport")}
                        </p>
                    </motion.section>
                ) : (
                    <FreeRoomsView />
                )}
            </motion.div>
            <DrawerPlanningContent
                drawerOpen={drawerOpen}
                setDrawerOpen={setDrawerOpen}
                eventInfo={eventInfo}
            />
            <DrawerEventTask
                type="event"
                onClose={() => {
                    setUserEvents(getUserEventsFromLocalStorage());
                }}
            />
        </PullToRefresh>
    );
}
