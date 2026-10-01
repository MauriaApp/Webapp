import { format, parse } from "date-fns";
import { DS_BY_CLASS } from "@/lib/data/ds";
import { toDate } from "@/lib/utils/home";
import { Lesson } from "@/types/aurion";

// What Aurion shows on every DS day until the real subject is published.
const PLACEHOLDER = /DS selon planning/i;

const DATE_FORMAT = "yyyy-MM-dd";
const DATETIME_FORMAT = "yyyy-MM-dd'T'HH:mm:ss";

/**
 * Swap the generic "DS selon planning" lessons of a CPG2 MPI/PSI planning for
 * the real DS of that day (subject, hours, room) from the hardcoded schedule.
 * Only days Aurion already flags with the placeholder are touched, so a DS
 * Aurion publishes itself is never duplicated. Any other class, or a
 * placeholder on a day the schedule doesn't know, is left as is.
 */
export function resolveDsLessons(
    lessons: Lesson[],
    className: string | null | undefined
): Lesson[] {
    const schedule = className ? DS_BY_CLASS[className] : undefined;
    if (!schedule) return lessons;

    const replaced = new Set<string>();
    const kept = lessons.filter((lesson) => {
        if (!PLACEHOLDER.test(lesson.title)) return true;
        const day = format(toDate(lesson.start), DATE_FORMAT);
        if (!schedule.exams.some((exam) => exam.date === day)) return true;
        replaced.add(day);
        return false;
    });
    if (replaced.size === 0) return lessons;

    const type = "DS_SURV";
    const exams = schedule.exams
        .filter((exam) => replaced.has(exam.date))
        .map<Lesson>((exam) => {
            const start = parse(
                `${exam.date} ${exam.start}`,
                `${DATE_FORMAT} HH:mm`,
                new Date()
            );
            const end = parse(
                `${exam.date} ${exam.end}`,
                `${DATE_FORMAT} HH:mm`,
                new Date()
            );
            return {
                id: `ds-${className}-${exam.date}-${exam.start}`,
                // Same newline layout as Aurion lessons, so that
                // parseFromTitle reads it.
                title: [schedule.room, exam.subject, type, ""].join("\n"),
                start: format(start, DATETIME_FORMAT),
                end: format(end, DATETIME_FORMAT),
                allDay: false,
                editable: false,
                className: type,
            };
        });

    return [...kept, ...exams];
}
