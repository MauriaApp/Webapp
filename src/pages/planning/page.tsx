import { useRef, useState } from "react";
import { motion } from "framer-motion";
import FullCalendar from "@fullcalendar/react";
import interactionPlugin from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import FrLocale from "@fullcalendar/core/locales/fr";
import { fetchPlanning } from "@/lib/api/aurion";
import { useQuery } from "@tanstack/react-query";
import { useLoadingToast } from "@/hooks/useLoadingToast";
import "./planning.css";

import ReactPullToRefresh from "react-simple-pull-to-refresh";
import { Lesson } from "@/types/aurion";
import { parseFromTitle } from "@/lib/utils/home";
import { DrawerEventTask } from "@/components/drawer-event-task";
import { getUserEventsFromLocalStorage } from "@/lib/utils/planning";
import { PreparedLesson } from "@/types/home";
import { DrawerPlanningContent } from "@/components/drawer-planning-content";

export function PlanningPage() {
    const calendarRef = useRef<FullCalendar>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [eventInfo, setEventInfo] = useState<PreparedLesson | null>(null);
    const [userEvents, setUserEvents] = useState<Lesson[]>(
        getUserEventsFromLocalStorage()
    );

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
        refetchOnWindowFocus: true, // refresh background si focus fenêtre
    });

    useLoadingToast(
        isLoading || isFetching,
        "Données du planning en cours de chargement…",
        "planning-loading"
    );

    const handleRefresh = async () => {
        await refetch();
    };

    return (
        <ReactPullToRefresh onRefresh={handleRefresh} isPullable={!isLoading}>
            <motion.h2
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="text-3xl font-bold text-mauria-light-purple dark:text-white mt-4 mb-6"
            >
                Planning
            </motion.h2>

            <motion.section
                className="rounded-lg overflow-hidden shadow-lg "
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    duration: 0.4,
                    ease: [0.16, 1, 0.3, 1],
                    delay: 0.1,
                }}
            >
                <FullCalendar
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
                    slotMinTime="07:00:00"
                    slotMaxTime="22:00:00"
                    titleFormat={{ month: "short", day: "numeric" }}
                    allDaySlot={false}
                    firstDay={0}
                    hiddenDays={[0]}
                    eventSources={[lessons, userEvents]}
                    eventColor="#3f2a56"
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
                <div className="text-sm font-semibold mt-2 ml-2 text-mauria-light-purple dark:text-gray-300">
                    {/* Dernière actualisation : {dayjs().fromNow()} */}
                    Dernière actualisation : il y a ///// minutes
                </div>
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
        </ReactPullToRefresh>
    );
}
