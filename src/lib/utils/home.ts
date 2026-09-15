import { Lesson } from "@/types/aurion";
import { PreparedLesson, HomeUpcoming } from "@/types/home";
import i18n from "@/i18n";
import {
    addDays,
    format,
    isAfter,
    isSameDay,
    isWithinInterval,
    startOfWeek,
} from "date-fns";

// Some planning timestamps end with offsets like "+0200" (no colon).
// Normalize to ISO8601 offset "+02:00" so Date parsing is reliable.
const normalizeOffset = (iso: string) =>
    iso.replace(/([+-]\d{2})(\d{2})$/, "$1:$2");

const toDate = (s: string) => new Date(normalizeOffset(s));

// Aurion ne remplit pas toujours la ligne du nom de la matiere : le titre se
// reduit alors au code de type ("DS selon planning\nDS_SURV"). On le passe par
// le meme dictionnaire que le badge plutot que d'afficher le code brut.
const TYPE_CODE = /^[A-Z0-9]+(?:_[A-Z0-9]+)+$/;

export const parseFromTitle = (lesson: Lesson) => {
    const lines = lesson.title
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

    const location = lines[0] ?? "";
    const rawTitle = lines[1] ?? lines[0] ?? lesson.title;
    const courseTitle = TYPE_CODE.test(rawTitle)
        ? formatLessonType(rawTitle)
        : rawTitle;
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

export type WidgetLesson = {
    title: string;
    type: string;
    location: string;
    time: string;
    startMs: number;
    endMs: number;
};

// Cours parses et tries envoyes au widget natif (MauriaPWA2). Le natif refait
// le tri passe / en cours / a venir selon l'heure.
//
// On remonte jusqu'au lundi de la semaine courante, et pas seulement jusqu'a
// maintenant : le widget "Semaine" dessine la grille complete, jours deja
// passes inclus. Le widget "Prochains cours" ignore ces cours-la de lui-meme.
export const buildWidgetLessons = (lessons: Lesson[]): WidgetLesson[] => {
    const from = startOfWeek(new Date(), { weekStartsOn: 1 }).getTime();
    return lessons
        .map((l) => ({ lesson: l, start: toDate(l.start), end: toDate(l.end) }))
        .filter(({ end }) => end.getTime() >= from)
        .sort((a, b) => a.start.getTime() - b.start.getTime())
        .map(({ lesson, start, end }) => {
            const { courseTitle, location, type } = parseFromTitle(lesson);
            return {
                title: courseTitle,
                type,
                location,
                time: `${format(start, "HH:mm")} - ${format(end, "HH:mm")}`,
                startMs: start.getTime(),
                endMs: end.getTime(),
            };
        });
};

export const formatLessonType = (lessonType: string) => {
    switch (lessonType.toUpperCase()) {
        case "COURS_TD":
            return i18n.t("homePage.lessonTypes.COURS_TD");
        case "DS_SURV":
            return i18n.t("homePage.lessonTypes.DS_SURV");
        case "AUTO_GERE":
            return i18n.t("homePage.lessonTypes.AUTO_GERE");
        default:
            return lessonType;
    }
};

export const formatLessonLocation = (location: string) => {
    return location.split(" - ")[0].trim();
}
