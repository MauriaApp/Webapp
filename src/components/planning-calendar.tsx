import { forwardRef, memo } from "react";
import FullCalendar from "@fullcalendar/react";
import { EventClickArg, EventSourceInput } from "@fullcalendar/core";
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

// Shared by the real planning page and the dev-only fixture preview: same
// three-line card rendering (parseFromTitle-driven), so a fix to one always
// shows up in the other.
export const PlanningCalendar = forwardRef<
    FullCalendar,
    {
        eventSources: EventSourceInput[];
        onEventClick?: (info: EventClickArg) => void;
    }
>(function PlanningCalendar({ eventSources, onEventClick }, ref) {
    const { t, i18n } = useTranslation();

    return (
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
            eventSources={eventSources}
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
                // Phone cells only fit the abbreviated subject.
                const shortCourse = abbreviateSubjects(course);

                const isColle = arg.event.classNames.includes("est-colle");
                // Colles carry "Khôlle" as their type, which the
                // subject line already says; Aurion lessons keep
                // their type next to the teacher.
                const lessonType = isColle ? "" : formatLessonType(type);
                const lessonTeacher = formatLessonTeacher(teacher);

                // Some lessons have no course label at all (a
                // workshop, a meeting): their type becomes the
                // title rather than leaving the line blank.
                const heading = course || lessonType;
                const shortHeading = shortCourse || lessonType;
                const detail = course ? lessonType : "";

                return (
                    <div className="fc-event-main-frame">
                        <div className="fc-event-title-container">
                            <div className="fc-event-title fc-sticky">
                                {!arg.event.title.includes("\n") ? (
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
                                                {detail && lessonTeacher && (
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
        />
    );
});
