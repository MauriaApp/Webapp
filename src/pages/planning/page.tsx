import { useRef, useState } from "react";
import { motion } from "framer-motion";
import FullCalendar from "@fullcalendar/react";
import interactionPlugin from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import FrLocale from "@fullcalendar/core/locales/fr";
import { fetchPlanning } from "@/lib/api/aurion";
import { useQuery } from "@tanstack/react-query";
import "./planning.css";

import ReactPullToRefresh from "react-simple-pull-to-refresh";
import { Lesson } from "@/types/aurion";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { UpcomingCourse } from "@/types/home";
import { parseFromTitle } from "@/lib/utils/home";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { DrawerEventTask } from "@/components/drawer-event-task";
import { getUserEventsFromLocalStorage } from "@/lib/utils/planning";

type CalendarEvent = Lesson &
    UpcomingCourse & { courseTitle: string; teacher: string };

export function PlanningPage() {
    const calendarRef = useRef<FullCalendar>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [eventInfo, setEventInfo] = useState<CalendarEvent | null>(null);
    const [userEvents, setUserEvents] = useState<Lesson[]>(
        getUserEventsFromLocalStorage()
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
        refetchOnWindowFocus: true, // refresh background si focus fenêtre
    });

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
                            ...event,
                        } as unknown as CalendarEvent;

                        setEventInfo(mixedEvent);
                        setDrawerOpen(true);
                    }}
                />
                <div className="text-sm font-semibold mt-2 ml-2 text-mauria-light-purple dark:text-gray-300">
                    {/* Dernière actualisation : {dayjs().fromNow()} */}
                    Dernière actualisation : il y a ///// minutes
                </div>
            </motion.section>
            <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                <DrawerContent aria-describedby={undefined}>
                    {eventInfo && (
                        <div className="p-4 mb-4">
                            <DrawerTitle className="text-2xl font-bold mb-4 text-mauria-light-purple dark:text-white">
                                {eventInfo.courseTitle || eventInfo.title}
                            </DrawerTitle>

                            {eventInfo.courseTitle && (
                                <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <p className="mb-2">
                                        <span className="font-semibold">
                                            Cours :
                                        </span>{" "}
                                        {eventInfo.courseTitle}
                                    </p>
                                    {eventInfo.location && (
                                        <p className="mb-2">
                                            <span className="font-semibold">
                                                Lieu :
                                            </span>{" "}
                                            {eventInfo.location}
                                        </p>
                                    )}
                                    {eventInfo.type && (
                                        <p className="mb-2">
                                            <span className="font-semibold">
                                                Type :
                                            </span>{" "}
                                            {eventInfo.type}
                                        </p>
                                    )}
                                    {eventInfo.teacher && (
                                        <p className="mb-2">
                                            <span className="font-semibold">
                                                Enseignant(e) :
                                            </span>{" "}
                                            {eventInfo.teacher}
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="space-y-2">
                                <p>
                                    <span className="font-semibold">
                                        Début :
                                    </span>{" "}
                                    {format(
                                        new Date(eventInfo.start),
                                        "EEEE d MMM HH'h'mm",
                                        { locale: fr }
                                    )}
                                </p>
                                <p>
                                    <span className="font-semibold">Fin :</span>{" "}
                                    {format(
                                        new Date(eventInfo.end),
                                        "EEEE d MMM HH'h'mm",
                                        { locale: fr }
                                    )}
                                </p>
                                <p>
                                    <span className="font-semibold">
                                        Durée :
                                    </span>{" "}
                                    {(() => {
                                        const start = new Date(eventInfo.start);
                                        const end = new Date(eventInfo.end);
                                        const diffMs =
                                            end.getTime() - start.getTime();
                                        const hours = Math.floor(
                                            diffMs / (1000 * 60 * 60)
                                        );
                                        const minutes = Math.floor(
                                            (diffMs % (1000 * 60 * 60)) /
                                                (1000 * 60)
                                        );

                                        if (hours === 0) {
                                            return `${minutes} min`;
                                        } else if (minutes === 0) {
                                            return `${hours}h`;
                                        } else {
                                            return `${hours}h${minutes
                                                .toString()
                                                .padStart(2, "0")}`;
                                        }
                                    })()}
                                </p>
                            </div>

                            <details className="mt-4">
                                <summary className="font-semibold cursor-pointer text-mauria-light-purple dark:text-gray-300">
                                    Détails
                                </summary>
                                <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                    <p>
                                        <span className="font-medium">
                                            ID :
                                        </span>{" "}
                                        {eventInfo.id}
                                    </p>
                                    <p>
                                        <span className="font-medium">
                                            Titre complet :
                                        </span>{" "}
                                        {eventInfo.title}
                                    </p>
                                    <p>
                                        <span className="font-medium">
                                            Toute la journée :
                                        </span>{" "}
                                        {eventInfo.allDay ? "Oui" : "Non"}
                                    </p>
                                </div>
                            </details>
                        </div>
                    )}
                </DrawerContent>
            </Drawer>
            <DrawerEventTask
                type="event"
                onClose={() => {
                    setUserEvents(getUserEventsFromLocalStorage());
                }}
            />
        </ReactPullToRefresh>
    );
}
