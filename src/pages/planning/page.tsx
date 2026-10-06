import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import FullCalendar from "@fullcalendar/react";
import FrLocale from "@fullcalendar/core/locales/fr";
import EsLocale from "@fullcalendar/core/locales/es";
import { ArrowLeft, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { fetchPlanning } from "@/lib/api/aurion";
import { useQuery } from "@tanstack/react-query";
import { fadeIn, staggerGroup } from "@/lib/motion";
import "./planning.css";

import { PullToRefresh } from "@/components/pull-to-refresh";
import { PlanningCalendar } from "@/components/planning-calendar";
import { Lesson } from "@/types/aurion";
import { parseFromTitle } from "@/lib/utils/home";
import {
    DrawerUserEvent,
    UserEventSlot,
} from "@/components/drawer-user-event";
import {
    getUserEventsFromLocalStorage,
    removeUserEventFromLocalStorage,
    saveUserEventToLocalStorage,
} from "@/lib/utils/planning";
import { UserEvent } from "@/types/data";
import { PreparedLesson } from "@/types/home";
import { DrawerPlanningContent } from "@/components/drawer-planning-content";
import { FreeRoomsView } from "./free-rooms-view";
import { format } from "date-fns";
import { getDateLocale } from "@/lib/utils/translations";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { exportCalendar } from "@/lib/utils/exportCalendar";
import { useAurionWarm } from "@/lib/hooks/use-aurion-warm";
import { useColles, useResolvedPlanning } from "@/lib/hooks/use-colles";
import { FREE_ROOMS_CAMPUSES, useCampus } from "@/lib/utils/campus";

export function PlanningPage() {
    const calendarRef = useRef<FullCalendar>(null);
    const { t, i18n } = useTranslation();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [eventInfo, setEventInfo] = useState<PreparedLesson | null>(null);
    const [userEvents, setUserEvents] = useState<UserEvent[]>(
        getUserEventsFromLocalStorage
    );
    const [formOpen, setFormOpen] = useState(false);
    const [editedEvent, setEditedEvent] = useState<UserEvent | null>(null);
    const [formSlot, setFormSlot] = useState<UserEventSlot | null>(null);
    const editTimeoutRef = useRef<number | null>(null);

    useEffect(
        () => () => {
            if (editTimeoutRef.current !== null) {
                window.clearTimeout(editTimeoutRef.current);
            }
        },
        []
    );
    const [view, setView] = useState<"calendar" | "freeRooms">("calendar");
    const { isWarming } = useAurionWarm();
    // Châteauroux has no findmyroom buildings: hide the free-rooms button.
    const showFreeRooms = FREE_ROOMS_CAMPUSES.includes(useCampus());

    const colles = useColles();

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
        enabled: !isWarming,
        staleTime: 1000 * 60 * 5, // 5 min frais
        gcTime: 1000 * 60 * 60 * 24, // 24h cache
        refetchOnWindowFocus: true, // refresh background si focus fenêtre
        placeholderData: (previousData) => previousData,
    });

    const resolvedLessons = useResolvedPlanning(lessons);

    const isBusy = isWarming || isLoading || isFetching;

    const handleRefresh = () => {
        void refetch();
    };

    const refreshUserEvents = useCallback(() => {
        setUserEvents(getUserEventsFromLocalStorage());
    }, []);

    const openEventForm = (slot: UserEventSlot | null) => {
        setEditedEvent(null);
        setFormSlot(slot);
        setFormOpen(true);
    };

    // Read from the shown event rather than looked up, so the actions stay
    // put while the drawer closes on an event that was just deleted.
    const isUserEventShown = eventInfo?.details.className === "est-perso";
    const selectedUserEvent = eventInfo
        ? userEvents.find((ue) => ue.id === eventInfo.details.id)
        : undefined;

    const handleEditUserEvent = () => {
        if (!selectedUserEvent) return;
        setEditedEvent(selectedUserEvent);
        setFormSlot(null);
        setDrawerOpen(false);
        // Editing swaps the detail drawer for the form: the form only opens
        // once the detail drawer is done closing, two drawers can't overlap.
        // Timed on vaul's own transition, its onAnimationEnd only fires for
        // drags and outside clicks, never for a close driven by `open`.
        editTimeoutRef.current = window.setTimeout(() => {
            editTimeoutRef.current = null;
            setFormOpen(true);
        }, 500);
    };

    const handleDeleteUserEvent = () => {
        if (!selectedUserEvent) return;
        const deleted = selectedUserEvent;
        removeUserEventFromLocalStorage({ userEventId: deleted.id });
        refreshUserEvents();
        setDrawerOpen(false);
        toast.success(t("schedulePage.userEvents.deleted"), {
            duration: 5000,
            action: {
                label: t("schedulePage.userEvents.undo"),
                onClick: () => {
                    saveUserEventToLocalStorage({ userEvent: deleted });
                    refreshUserEvents();
                },
            },
        });
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
                        <div className="flex items-center gap-2">
                            {showFreeRooms && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setView("freeRooms")}
                                >
                                    <Search className="h-4 w-4" />
                                    {t("schedulePage.freeRooms.button")}
                                </Button>
                            )}
                            <Button
                                size="sm"
                                className="w-9 px-0"
                                onClick={() => openEventForm(null)}
                                aria-label={t(
                                    "schedulePage.userEvents.addTitle"
                                )}
                            >
                                <Plus className="h-5 w-5" />
                            </Button>
                        </div>
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
                            eventSources={[resolvedLessons, userEvents, colles]}
                            onSelect={(info) => {
                                info.view.calendar.unselect();
                                // A long press picks a single 30 min slot:
                                // an hour is the likelier intent.
                                const end =
                                    info.end.getTime() - info.start.getTime() <=
                                    30 * 60 * 1000
                                        ? new Date(
                                              info.start.getTime() +
                                                  60 * 60 * 1000
                                          )
                                        : info.end;
                                openEventForm({ start: info.start, end });
                            }}
                            onEventClick={(info) => {
                                const userEvent = userEvents.find(
                                    (ue) => ue.id === info.event.id
                                );
                                if (userEvent) {
                                    setEventInfo({
                                        courseTitle: userEvent.title,
                                        location: userEvent.location ?? "",
                                        type: t(
                                            "schedulePage.userEvents.type"
                                        ),
                                        teacher: "",
                                        notes: userEvent.notes,
                                        time: "",
                                        details: userEvent,
                                    });
                                    setDrawerOpen(true);
                                    return;
                                }

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
                onEdit={isUserEventShown ? handleEditUserEvent : undefined}
                onDelete={isUserEventShown ? handleDeleteUserEvent : undefined}
            />
            <DrawerUserEvent
                open={formOpen}
                onOpenChange={setFormOpen}
                userEvent={editedEvent}
                slot={formSlot}
                onSaved={refreshUserEvents}
            />
        </PullToRefresh>
    );
}
