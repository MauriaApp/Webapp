import { memo, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import FullCalendar from "@fullcalendar/react";
import interactionPlugin from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import FrLocale from "@fullcalendar/core/locales/fr";
import EsLocale from "@fullcalendar/core/locales/es";
import { fetchPlanning } from "@/lib/api/aurion";
import { useQuery } from "@tanstack/react-query";
import { fadeIn, staggerGroup } from "@/lib/motion";
import "./planning.css";

import { PullToRefresh } from "@/components/pull-to-refresh";
import { Lesson } from "@/types/aurion";
import { parseFromTitle } from "@/lib/utils/home";
import { DrawerEventTask } from "@/components/drawer-event-task";
import { getUserEventsFromLocalStorage } from "@/lib/utils/planning";
import { PreparedLesson } from "@/types/home";
import { DrawerPlanningContent } from "@/components/drawer-planning-content";
import { format } from "date-fns";
import { getDateLocale } from "@/lib/utils/translations";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { exportCalendar } from "@/lib/utils/exportCalendar";

const Calendar = memo(FullCalendar);

export function PlanningPage() {
    const calendarRef = useRef<FullCalendar>(null);
    const { t, i18n } = useTranslation();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [eventInfo, setEventInfo] = useState<PreparedLesson | null>(null);
    const [userEvents, setUserEvents] = useState<Lesson[]>(
        getUserEventsFromLocalStorage()
    );

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
            isPullable={!isBusy}
            pullingText={t("common.pullToRefresh")}
            refreshingText={t("common.refreshing")}
        >
            <motion.div variants={staggerGroup} initial="hidden" animate="show">
                <motion.h2
                    variants={fadeIn}
                    className="text-3xl font-bold text-mauria-purple dark:text-white mt-4 mb-6"
                >
                    {t("schedulePage.title")}
                </motion.h2>

                <motion.section
                    variants={fadeIn}
                    className="rounded-lg overflow-hidden shadow-lg"
                >
                    <Calendar
                        datesSet={() => {
                            calendarRef.current?.getApi().updateSize();
                        }}
                        ref={calendarRef}
                        locale={
                            i18n.language === "fr"
                                ? FrLocale
                                : i18n.language === "es"
                                  ? EsLocale
                                  : undefined
                        }
                        plugins={[
                            dayGridPlugin,
                            timeGridPlugin,
                            interactionPlugin,
                        ]}
                        initialView="timeGridWeek"
                        headerToolbar={{
                            left: "today",
                            center: "timeGridWeek,timeGridDay",
                            right: "prev,next",
                        }}
                        buttonText={{
                            today: t("schedulePage.buttons.today"),
                            timeGridWeek: t("schedulePage.buttons.week"),
                            timeGridDay: t("schedulePage.buttons.day"),
                        }}
                        slotMinTime="07:00:00"
                        slotMaxTime="22:00:00"
                        titleFormat={{ month: "short", day: "numeric" }}
                        allDaySlot={false}
                        firstDay={1}
                        hiddenDays={[0]}
                        eventSources={[lessons, userEvents]}
                        eventColor="var(--planning-event-default-solid)"
                        contentHeight="auto"
                        nowIndicator={true}
                        stickyHeaderDates={false}
                        editable={false}
                        eventAllow={() => false}
                        droppable={false}
                        eventStartEditable={false}
                        eventDurationEditable={false}
                        eventResizableFromStart={false}
                        eventClick={(info) => {
                            const event = info.event.toJSON();

                            const { courseTitle, location, type, teacher } =
                                parseFromTitle(event as Lesson);
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
                        {format(new Date(dataUpdatedAt), "EEEE d MMM HH'h'mm", {
                            locale: getDateLocale(i18n.language),
                        })}
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
