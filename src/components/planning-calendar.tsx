import { forwardRef, memo, useEffect, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import { addDays, isSunday } from "date-fns";
import {
    DateSelectArg,
    EventClickArg,
    EventContentArg,
    EventSourceInput,
} from "@fullcalendar/core";
import interactionPlugin from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import FrLocale from "@fullcalendar/core/locales/fr";
import EsLocale from "@fullcalendar/core/locales/es";
import { useTranslation } from "react-i18next";
import "@/pages/planning/planning.css";

import { Lesson } from "@/types/aurion";
import {
    abbreviateSubjects,
    formatLessonCourse,
    formatLessonLocation,
    formatLessonTeacher,
    formatLessonType,
    parseFromTitle,
} from "@/lib/utils/home";

const Calendar = memo(FullCalendar);

// How far a finger may drift during the long press before it reads as a
// scroll rather than the start of a selection.
const LONG_PRESS_TOLERANCE_PX = 10;
const SELECT_LONG_PRESS_MS = 400;

// Shared by the real planning page and the dev-only fixture preview: same
// three-line card rendering (parseFromTitle-driven), so a fix to one always
// shows up in the other.
export const PlanningCalendar = forwardRef<
    FullCalendar,
    {
        eventSources: EventSourceInput[];
        onEventClick?: (info: EventClickArg) => void;
        /** Extra classNames per event, e.g. to theme the lesson happening now. */
        eventClassNames?: (arg: EventContentArg) => string[];
        /** Makes empty slots selectable (long press on touch screens). */
        onSelect?: (info: DateSelectArg) => void;
    }
>(function PlanningCalendar(
    { eventSources, onEventClick, eventClassNames, onSelect },
    ref
) {
    const { t, i18n } = useTranslation();
    const wrapperRef = useRef<HTMLDivElement>(null);
    const ghostRef = useRef<HTMLDivElement>(null);
    const selectable = Boolean(onSelect);

    // Selecting a time range drags the pointer down the grid, which the
    // page's pull-to-refresh (listening on an ancestor) would also read as a
    // pull. Mouse: a press on the grid is always a selection, so the pull
    // never starts there. Touch: a press only becomes a selection after the
    // long press, so the pull is only cut off once the selection shows up.
    useEffect(() => {
        const el = wrapperRef.current;
        if (!selectable || !el) return;

        const onMouseDown = (e: MouseEvent) => {
            if ((e.target as Element).closest(".fc-view-harness")) {
                e.stopPropagation();
            }
        };
        // FullCalendar starts the selection once the long press delay ends,
        // even if the finger moved meanwhile: a slow scroll over empty slots
        // would turn into a selection. Any move past a few pixels before the
        // selection shows up gives up on the long press instead.
        let pending: { target: EventTarget; x: number; y: number } | null =
            null;

        // While the finger holds still, a faint preview of the slot fills in
        // over the long press delay, hinting that holding on creates an
        // event. FullCalendar's own mirror takes over once the delay ends.
        let ghostTimer: ReturnType<typeof setTimeout> | undefined;
        const hideGhost = () => {
            clearTimeout(ghostTimer);
            ghostRef.current?.classList.remove("is-pressing");
        };
        const showGhost = (x: number, y: number) => {
            const ghost = ghostRef.current;
            const contains = (node: Element, onX: boolean) => {
                const r = node.getBoundingClientRect();
                return onX
                    ? x >= r.left && x < r.right
                    : y >= r.top && y < r.bottom;
            };
            const col = [
                ...el.querySelectorAll(".fc-timegrid-col[data-date]"),
            ].find((node) => contains(node, true));
            const slot = [
                ...el.querySelectorAll(".fc-timegrid-slot-lane[data-time]"),
            ].find((node) => contains(node, false));
            if (!ghost || !col || !slot) return;

            const origin = el.getBoundingClientRect();
            const colRect = col.getBoundingClientRect();
            const slotRect = slot.getBoundingClientRect();
            Object.assign(ghost.style, {
                left: `${colRect.left - origin.left}px`,
                top: `${slotRect.top - origin.top}px`,
                width: `${colRect.width}px`,
                height: `${slotRect.height}px`,
                transitionDuration: `${SELECT_LONG_PRESS_MS}ms`,
            });
            ghost.classList.add("is-pressing");
            // The mirror renders right as the delay ends.
            ghostTimer = setTimeout(
                () => requestAnimationFrame(hideGhost),
                SELECT_LONG_PRESS_MS
            );
        };

        const onTouchStart = (e: TouchEvent) => {
            const touch = e.touches[0];
            const target = e.target as Element;
            hideGhost();
            pending =
                touch &&
                e.touches.length === 1 &&
                target.closest(".fc-view-harness") &&
                !target.closest(".fc-event")
                    ? { target, x: touch.clientX, y: touch.clientY }
                    : null;
            if (pending && target.closest(".fc-timegrid-body")) {
                showGhost(pending.x, pending.y);
            }
        };
        const onTouchEnd = () => {
            pending = null;
            hideGhost();
        };
        const onTouchMove = (e: TouchEvent) => {
            const isSelecting = el.querySelector(
                ".fc-event-mirror, .fc-highlight"
            );
            if (!isSelecting) {
                const touch = e.touches[0];
                if (
                    pending &&
                    touch &&
                    Math.hypot(
                        touch.clientX - pending.x,
                        touch.clientY - pending.y
                    ) > LONG_PRESS_TOLERANCE_PX
                ) {
                    // FullCalendar listens for the cancel on the touched
                    // element itself and drops its pending long press.
                    pending.target.dispatchEvent(new Event("touchcancel"));
                    pending = null;
                    hideGhost();
                }
                return;
            }
            pending = null;
            e.stopPropagation();
            // FullCalendar blocks page scrolling while selecting from a
            // window listener, which no longer hears the event.
            if (e.cancelable) e.preventDefault();
        };

        el.addEventListener("mousedown", onMouseDown);
        el.addEventListener("touchstart", onTouchStart, { passive: true });
        el.addEventListener("touchmove", onTouchMove, { passive: false });
        el.addEventListener("touchend", onTouchEnd);
        el.addEventListener("touchcancel", onTouchEnd);
        return () => {
            el.removeEventListener("mousedown", onMouseDown);
            el.removeEventListener("touchstart", onTouchStart);
            el.removeEventListener("touchmove", onTouchMove);
            el.removeEventListener("touchend", onTouchEnd);
            el.removeEventListener("touchcancel", onTouchEnd);
            hideGhost();
        };
    }, [selectable]);

    return (
        <div ref={wrapperRef} className="relative">
            <div ref={ghostRef} className="planning-press-ghost" />
            <Calendar
                datesSet={() => {
                    if (ref && typeof ref !== "function") {
                        ref.current?.getApi().updateSize();
                    }
                }}
                ref={ref}
                locale={
                    i18n.language === "fr"
                        ? FrLocale
                        : i18n.language === "es"
                          ? EsLocale
                          : undefined
                }
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="timeGridWeek"
                // Sunday is hidden from the grid and its week is already
                // over: open on the week that's coming instead.
                initialDate={
                    isSunday(new Date()) ? addDays(new Date(), 1) : undefined
                }
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
                slotEventOverlap={false}
                titleFormat={{ month: "short", day: "numeric" }}
                allDaySlot={false}
                firstDay={1}
                hiddenDays={[0]}
                eventSources={eventSources}
                eventClassNames={eventClassNames}
                eventColor="var(--planning-event-default-solid)"
                eventContent={(arg) => {
                    // Same reading as the drawer and the home cards:
                    // Aurion's fields shift down whenever a lesson
                    // carries a multi-line note, so they can't be read
                    // by position from the top of the title.
                    const { courseTitle, location, type, teacher } =
                        parseFromTitle({
                            title: arg.event.title,
                            className: arg.event.classNames[0] ?? "",
                        } as Lesson);

                    // Aurion rooms read "A812 - Salle … - Campus …";
                    // only the room itself fits in a cell, the drawer
                    // still shows the full label.
                    const place = formatLessonLocation(location);
                    const course = formatLessonCourse(courseTitle);

                    const userEvent = arg.event.extendedProps as {
                        location?: string;
                        notes?: string;
                    };
                    const isColle = arg.event.classNames.includes("est-colle");
                    const lessonType = formatLessonType(type);
                    const lessonTeacher = formatLessonTeacher(teacher);

                    // Colles: the course line reads "Khôlle {subject}". Strip
                    // the "Khôlle" type label so only the subject stays in bold;
                    // "Khôlle" then shows as the type (not bold) before the
                    // teacher, like Aurion lesson types.
                    const colleSubject = isColle
                        ? course.replace(/khôlle\s*(?:de\s+)?/gi, "").trim() ||
                          course
                        : course;
                    // Phone cells only fit the abbreviated subject.
                    const shortCourse = abbreviateSubjects(colleSubject);

                    // Some lessons have no course label at all (a
                    // workshop, a meeting): their type becomes the
                    // title rather than leaving the line blank.
                    const heading = colleSubject || lessonType;
                    const shortHeading = shortCourse || lessonType;
                    const detail = colleSubject ? lessonType : "";

                    return (
                        <div className="fc-event-main-frame">
                            <div className="fc-event-title-container">
                                <div className="fc-event-title fc-sticky">
                                    {arg.event.classNames.includes(
                                        "est-perso"
                                    ) ? (
                                        // Laid out like a lesson: the
                                        // place on top, the notes where
                                        // the teacher would be.
                                        <>
                                            {userEvent.location && (
                                                <div>{userEvent.location}</div>
                                            )}
                                            <div>
                                                <strong>
                                                    {arg.event.title}
                                                </strong>
                                            </div>
                                            {userEvent.notes && (
                                                <div>{userEvent.notes}</div>
                                            )}
                                        </>
                                    ) : !arg.event.title.includes("\n") ? (
                                        // Free-form personal events are
                                        // a single line, kept as typed.
                                        arg.event.title
                                    ) : (
                                        <>
                                            {place && <div>{place}</div>}
                                            <div>
                                                <strong>
                                                    <span className="sm:hidden">
                                                        {shortHeading}
                                                    </span>
                                                    <span className="hidden sm:inline">
                                                        {heading}
                                                    </span>
                                                </strong>
                                            </div>
                                            {(detail || lessonTeacher) && (
                                                <div>
                                                    {detail || lessonTeacher}
                                                    {/* Phones only have room for the type. */}
                                                    {detail &&
                                                        lessonTeacher && (
                                                            <span className="hidden sm:inline">
                                                                {" "}
                                                                {lessonTeacher}
                                                            </span>
                                                        )}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                }}
                contentHeight="auto"
                nowIndicator={true}
                stickyHeaderDates={false}
                editable={false}
                eventAllow={() => false}
                droppable={false}
                eventStartEditable={false}
                eventDurationEditable={false}
                eventResizableFromStart={false}
                eventClick={onEventClick}
                selectable={selectable}
                selectMirror={true}
                selectLongPressDelay={SELECT_LONG_PRESS_MS}
                select={onSelect}
            />
        </div>
    );
});
