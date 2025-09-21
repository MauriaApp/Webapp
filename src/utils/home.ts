import { getPlanning, Lesson } from "@/utils/planning";
import { addDays, format, isAfter, isSameDay, isWithinInterval } from "date-fns";

export type UpcomingCourse = {
    title: string;
    time: string;
    location: string;
    type: string;
};

export type HomeUpcoming = {
    current: UpcomingCourse | null;
    today: UpcomingCourse[];
    tomorrow: UpcomingCourse[];
};

// Some planning timestamps end with offsets like "+0200" (no colon).
// Normalize to ISO8601 offset "+02:00" so Date parsing is reliable.
const normalizeOffset = (iso: string) =>
    iso.replace(/([+-]\d{2})(\d{2})$/, "$1:$2");

const toDate = (s: string) => new Date(normalizeOffset(s));

const parseFromTitle = (lesson: Lesson) => {
    const lines = lesson.title
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

    const location = lines[0] ?? "";
    const courseTitle = lines[1] ?? lines[0] ?? lesson.title;
    const inferredType =
        lines[2] ?? lesson.className ?? ""; // often like "COURS_TD"

    return { courseTitle, location, type: inferredType };
};

export const getUpcomingCourses = (
    useMockData = true
): UpcomingCourse[] => {
    const lessons = getPlanning(useMockData);

    const now = new Date();

    const enriched = lessons
        .map((l) => ({
            lesson: l,
            start: toDate(l.start),
            end: toDate(l.end),
        }))
        // keep only events from today or tomorrow
        .filter(({ start }) =>
            isSameDay(start, now) || isSameDay(start, addDays(now, 1))
        );

    // Current event (if any)
    const current = enriched.find(({ start, end }) =>
        isWithinInterval(now, { start, end })
    );

    // Remaining events today (strictly after now)
    const todaysUpcoming = enriched
        .filter(
            ({ start }) => isSameDay(start, now) && isAfter(start, now)
        )
        .sort((a, b) => a.start.getTime() - b.start.getTime());

    // All events tomorrow
    const tomorrows = enriched
        .filter(({ start }) => isSameDay(start, addDays(now, 1)))
        .sort((a, b) => a.start.getTime() - b.start.getTime());

    const formatCourse = ({ lesson, start, end }: { lesson: Lesson; start: Date; end: Date; }): UpcomingCourse => {
        const { courseTitle, location, type } = parseFromTitle(lesson);
        const time = `${format(start, "HH:mm")} - ${format(end, "HH:mm")}`;
        return { title: courseTitle, time, location, type };
    };

    const result: UpcomingCourse[] = [];
    if (current) result.push(formatCourse(current));
    result.push(...todaysUpcoming.map(formatCourse));
    result.push(...tomorrows.map(formatCourse));

    return result;
};

export default getUpcomingCourses;

export const getHomeUpcoming = (
    useMockData = true
): HomeUpcoming => {
    const lessons = getPlanning(useMockData);
    const now = new Date();

    const enriched = lessons
        .map((l) => ({ lesson: l, start: toDate(l.start), end: toDate(l.end) }))
        .filter(({ start }) =>
            isSameDay(start, now) || isSameDay(start, addDays(now, 1))
        );

    const current = enriched.find(({ start, end }) =>
        isWithinInterval(now, { start, end })
    );

    const todaysUpcoming = enriched
        .filter(({ start }) => isSameDay(start, now) && isAfter(start, now))
        .sort((a, b) => a.start.getTime() - b.start.getTime());

    const tomorrows = enriched
        .filter(({ start }) => isSameDay(start, addDays(now, 1)))
        .sort((a, b) => a.start.getTime() - b.start.getTime());

    const toCourse = ({ lesson, start, end }: { lesson: Lesson; start: Date; end: Date; }): UpcomingCourse => {
        const { courseTitle, location, type } = parseFromTitle(lesson);
        const time = `${format(start, "HH:mm")} - ${format(end, "HH:mm")}`;
        return { title: courseTitle, time, location, type };
    };

    return {
        current: current ? toCourse(current) : null,
        today: todaysUpcoming.map(toCourse),
        tomorrow: tomorrows.map(toCourse),
    };
};
