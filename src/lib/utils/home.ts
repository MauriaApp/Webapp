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

export const toDate = (s: string) => new Date(normalizeOffset(s));

// Promotion-wide plannings squeeze a time range between the type and the
// teacher, where the personal planning goes straight to the teacher.
const timeRange = /^\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}$/;

// Aurion ne remplit pas toujours la ligne du nom de la matiere : le titre se
// reduit alors au code de type ("DS selon planning\nDS_SURV"). On le passe par
// le meme dictionnaire que le badge plutot que d'afficher le code brut.
const TYPE_CODE = /^[A-Z0-9]+(?:_[A-Z0-9]+)+$/;

/**
 * Aurion titles are fixed fields joined by newlines — room, free-text note,
 * course, type, (time range), teacher — and any of them can be blank. The
 * note is free text, so it carries newlines of its own and the fields that
 * follow it slide down: only the type, sitting right before the time range,
 * is a reliable anchor. Positions are therefore counted from that anchor
 * rather than from the top, which also keeps colles and the personal
 * planning — same fields, no time range — on the same code path.
 */
export const parseFromTitle = (lesson: Lesson) => {
    const lines = lesson.title.split("\n").map((l) => l.trim());
    const timeIndex = lines.findIndex((line) => timeRange.test(line));
    const typeIndex = timeIndex === -1 ? lines.length - 2 : timeIndex - 1;

    // Not enough lines to hold the fields: a lesson the user created himself.
    if (typeIndex < 2) {
        const filled = lines.filter(Boolean);
        return {
            courseTitle: filled[1] ?? filled[0] ?? lesson.title,
            location: filled[0] ?? "",
            type: filled[2] ?? lesson.className ?? "",
            teacher: filled[3] ?? "",
        };
    }

    const course = lines[typeIndex - 1] ?? "";
    const note = lines.slice(1, typeIndex - 1).filter(Boolean);
    const teacher = lines
        .slice(typeIndex + 1)
        .find((line) => line && !timeRange.test(line));

    return {
        // No course and no note happens (a workshop, a meeting); the caller
        // falls back to the type rather than on the raw multi-line title.
        // A lone type code means Aurion left the course name blank: show it
        // through the type dictionary rather than the raw code.
        courseTitle: course
            ? TYPE_CODE.test(course)
                ? formatLessonType(course)
                : course
            : note.join(" "),
        location: lines[0] ?? "",
        type: lines[typeIndex] || lesson.className || "",
        teacher: teacher ?? "",
    };
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

/**
 * The lesson happening now or, failing that, one that ended less than
 * `graceMinutes` ago (a task is often noted right after class), and the next
 * lesson of the same course. Null when there's no such lesson or no later
 * one of that course.
 */
export const findNextLessonOfCurrentCourse = (
    lessons: Lesson[],
    now = new Date(),
    graceMinutes = 10
): { course: string; start: Date } | null => {
    const timed = lessons.map((lesson) => ({
        lesson,
        start: toDate(lesson.start),
        end: toDate(lesson.end),
    }));
    const graceStart = new Date(now.getTime() - graceMinutes * 60 * 1000);

    const reference =
        timed.find(({ start, end }) => start <= now && now < end) ??
        timed
            .filter(({ end }) => graceStart <= end && end <= now)
            .sort((a, b) => b.end.getTime() - a.end.getTime())[0];
    if (!reference) return null;

    const courseOf = (lesson: Lesson) =>
        formatLessonCourse(parseFromTitle(lesson).courseTitle);
    const course = courseOf(reference.lesson);
    if (!course) return null;
    const key = course.toLowerCase();

    const next = timed
        .filter(
            ({ lesson, start }) =>
                start >= reference.end &&
                courseOf(lesson).toLowerCase() === key
        )
        .sort((a, b) => a.start.getTime() - b.start.getTime())[0];

    return next ? { course, start: next.start } : null;
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

// The type codes met across Junia's plannings — every filière, not just the
// prépa. Aurion is free to invent more, so an unknown code is shown as is.
const lessonTypes = new Set([
    "COURS_TD",
    "CI",
    "CM",
    "TD",
    "TP",
    "PROJET",
    "PROJET_AUTO_GERE",
    "TD_AUTO_GERE_PLANIFIE",
    "TP_AUTO_GERE_PLANIFIE",
    "CM_AUTO_GERE_PLANIFIE",
    "AUTO_GERE",
    "AUTO_APPR",
    "COURS_TD_DIST",
    "CM_DIST",
    "TP_DIST",
    "E_LEARNING",
    "REUNION",
    "PROMO",
    "ATELIER",
    "DS_SURV",
    "EXAM",
    "EXAM_SURV",
    "SOUTENANCE",
    "VISITE",
    "CONF",
    "ASSOCIATIF",
    "ENTRETIEN",
    "SEMINAIRE",
    "DS",
]);

export const formatLessonType = (lessonType: string) => {
    const code = lessonType.toUpperCase();
    return lessonTypes.has(code)
        ? i18n.t(`homePage.lessonTypes.${code}`)
        : lessonType;
};

// Aurion spells civilities out in full ("Monsieur DUPONT"); neither the cards
// nor the drawer have room for it.
export const formatLessonTeacher = (teacher: string) =>
    teacher.replace(/\bMonsieur\b/gi, "M.").replace(/\bMadame\b/gi, "Mme");

export const formatLessonLocation = (location: string) => {
    return location.split(" - ")[0].trim();
};

// Aurion spells course names out in full ("MATHEMATIQUES", "PHYSIQUE-CHIMIE"),
// which never fits a planning card. Accents are matched explicitly rather than
// normalized away, so the rest of the title keeps its own.
const subjectAbbreviations: Array<{ match: RegExp; key: string }> = [
    {
        match: /sciences?\s+industrielles?(?:\s+(?:pour|de)\s+l['’]ing[ée]nieurs?)?/gi,
        key: "sii",
    },
    {
        match: /formations?\s+humaines?\s+(?:et|&)\s+sociales?/gi,
        key: "fhs",
    },
    {
        match: /projets?\s+professionnels?\s+(?:et|&)\s+personnels?/gi,
        key: "ppp",
    },
    {
        match: /communications?\s+(?:et|&)\s+cultures?\s+g[ée]n[ée]rales?/gi,
        key: "generalCulture",
    },
    { match: /g[ée]opolitique\s+du\s+monde\s+actuel/gi, key: "geopolitics" },
    { match: /business\s+intelligence/gi, key: "businessIntelligence" },
    { match: /intelligences?\s+artificielles?/gi, key: "ai" },
    { match: /bases?\s+de\s+donn[ée]es/gi, key: "database" },
    { match: /math[ée]matiques?/gi, key: "maths" },
    // Plurals matter: "Sciences Physiques" must not end up "Sciences Phys.s".
    { match: /sciences?\s+physiques?/gi, key: "physics" },
    { match: /physiques?(?:[\s-]+chimies?)?/gi, key: "physics" },
    { match: /informatiques?/gi, key: "computerScience" },
    { match: /anglais/gi, key: "english" },
    { match: /espagnol/gi, key: "spanish" },
    { match: /allemand/gi, key: "german" },
    { match: /statistiques?/gi, key: "stats" },
    { match: /[ée]lectroniques?/gi, key: "electronics" },
    { match: /d[ée]veloppement/gi, key: "development" },
    { match: /programmation/gi, key: "programming" },
    { match: /technologies?/gi, key: "technologies" },
    { match: /introductions?/gi, key: "intro" },
];

// Each pattern is anchored on a word start, so a subject that happens to be
// spelled inside a longer word is left alone ("Microélectronique" must not
// turn into "MicroÉlec."). \b is ASCII-only and would not do here.
const anchoredAbbreviations = subjectAbbreviations.map(({ match, key }) => ({
    match: new RegExp(`(^|[^\\p{L}])(?:${match.source})`, "giu"),
    key,
}));

/** Shorten the subject words of a course title, for phone-sized cards. */
export const abbreviateSubjects = (title: string) =>
    anchoredAbbreviations.reduce(
        (text, { match, key }) =>
            text.replace(
                match,
                (_full, before: string) =>
                    `${before}${i18n.t(`schedulePage.subjectsShort.${key}`)}`
            ),
        title
    );

// Aurion course titles trail the term they belong to ("MATHEMATIQUES - 1er
// semestre"), which no card has room for. Only that qualifier is dropped:
// other titles carry a meaningful second half ("Mechanics 1 - Statics").
const termSuffix = /\s+-\s+\d*\s*(?:er|ère|e|ème|nd|nde)?\s*semestre\s*\d*$/i;

/**
 * The course label as shown on a planning card. Only the term qualifier is
 * dropped — the card shows this in full and keeps `abbreviateSubjects` for
 * phone-sized cells.
 */
export const formatLessonCourse = (courseTitle: string) =>
    courseTitle.replace(termSuffix, "").trim();

/** Compact elapsed time since an ISO date: "<1 min", "25 min", "5 h 10 min", "30 h". */
export function formatElapsed(since: string, now = Date.now()): string {
    const minutes = Math.max(
        0,
        Math.floor((now - new Date(since).getTime()) / 60_000)
    );
    if (minutes < 1) return "<1 min";
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours >= 24) return `${hours} h`;
    return minutes % 60 === 0 ? `${hours} h` : `${hours} h ${minutes % 60} min`;
}
