import { Lesson } from "@/types/aurion";
import { PreparedLesson, HomeUpcoming } from "@/types/home";
import {
    addDays,
    format,
    isAfter,
    isSameDay,
    isWithinInterval,
} from "date-fns";

// Some planning timestamps end with offsets like "+0200" (no colon).
// Normalize to ISO8601 offset "+02:00" so Date parsing is reliable.
const normalizeOffset = (iso: string) =>
    iso.replace(/([+-]\d{2})(\d{2})$/, "$1:$2");

const toDate = (s: string) => new Date(normalizeOffset(s));

export const parseFromTitle = (lesson: Lesson) => {
    const lines = lesson.title
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

    const location = lines[0] ?? "";
    const courseTitle = lines[1] ?? lines[0] ?? lesson.title;
    const inferredType = lines[2] ?? lesson.className ?? "";
    const teacher = lines[3] ?? "";

    return { courseTitle, location, type: inferredType, teacher };
};

export const getHomeUpcoming = ({
    lessons,
}: {
    lessons: Lesson[];
}): HomeUpcoming => {
    const now = new Date();

    const enriched = lessons
        .map((l) => ({ lesson: l, start: toDate(l.start), end: toDate(l.end) }))
        .filter(
            ({ start }) =>
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

    const toCourse = ({
        lesson,
        start,
        end,
    }: {
        lesson: Lesson;
        start: Date;
        end: Date;
    }): PreparedLesson => {
        const { courseTitle, location, type, teacher } = parseFromTitle(lesson);
        const time = `${format(start, "HH:mm")} - ${format(end, "HH:mm")}`;
        return { courseTitle, time, location, type, details: lesson, teacher };
    };

    return {
        current: current ? toCourse(current) : null,
        today: todaysUpcoming.map(toCourse),
        tomorrow: tomorrows.map(toCourse),
    };
};

export const formatLessonType = (lessonType: string) => {
    if (lessonType === "COURS_TD") return "Cours"
    if (lessonType === "DS_SURV") return "DS"
} 
