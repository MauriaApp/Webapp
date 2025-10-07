import { memo, useRef, useState } from "react";
import { motion } from "framer-motion";
import FullCalendar from "@fullcalendar/react";
import interactionPlugin from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import FrLocale from "@fullcalendar/core/locales/fr";
import { fetchPlanning } from "@/lib/api/aurion";
import { useQuery } from "@tanstack/react-query";
import "./planning.css";

import { PullToRefresh } from "@/components/pull-to-refresh";
import { Lesson } from "@/types/aurion";
import { parseFromTitle } from "@/lib/utils/home";
import { DrawerEventTask } from "@/components/drawer-event-task";
import { getUserEventsFromLocalStorage } from "@/lib/utils/planning";
import { PreparedLesson } from "@/types/home";
import { DrawerPlanningContent } from "@/components/drawer-planning-content";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

const Calendar = memo(FullCalendar);

export function PlanningPage() {
    const calendarRef = useRef<FullCalendar>(null);
    const { t, i18n } = useTranslation();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [eventInfo, setEventInfo] = useState<PreparedLesson | null>(null);
    const [userEvents, setUserEvents] = useState<Lesson[]>(
        getUserEventsFromLocalStorage()
    );

    i18n.on("languageChanged", () => {
        calendarRef.current?.getApi().setOption("locale", i18n.language);
    });

    const {
        data: lessons = [],
        refetch,
        isLoading,
        isFetching,
        dataUpdatedAt,
    } = useQuery<Lesson[], Error>({
        queryKey: ["planning"],
        queryFn: () => fetchPlanning().then((res) => res?.data || []),
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
        window.parent.postMessage(
            { type: "EXPORT_CALENDAR", payload: lessons },
            "*"
        );
    };

    return (
        <PullToRefresh
            onRefresh={handleRefresh}
            isPullable={!isBusy}
            pullingText={t("common.pullToRefresh")}
            refreshingText={t("common.refreshing")}
        >
            <motion.h2
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="text-3xl font-bold text-mauria-purple dark:text-white mt-4 mb-6"
            >
                {t("schedulePage.title")}
            </motion.h2>

            <motion.section
                className="rounded-lg overflow-hidden shadow-lg"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    duration: 0.4,
                    ease: [0.16, 1, 0.3, 1],
                    delay: 0.1,
                }}
            >
                <Calendar
                    datesSet={() => {
                        window.dispatchEvent(new Event("resize"));
                    }}
                    ref={calendarRef}
                    locale={FrLocale}
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
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
                    firstDay={0}
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
                        locale: fr,
                    })}
                </div>
                <Button
                    className="mt-2"
                    onClick={handleExport}
                    disabled={lessons.length === 0 || isBusy}
                >
                    {t("schedulePage.exportSchedule")}
                </Button>
            </motion.section>
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
