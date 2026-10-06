import { addDays, addMinutes, format, parseISO } from "date-fns";
import i18n from "@/i18n";
import { COLLES_CLASSES } from "@/lib/data/colles";
import { Lesson } from "@/types/aurion";
import { CollesClass } from "@/types/colles";

const COLLE_DURATION_MINUTES = 60;

function buildColleLessons(collesClass: CollesClass, group: string): Lesson[] {
    const weeks = collesClass.groups[group] ?? [];
    const type = i18n.t("schedulePage.colles.type");

    const lessons: Lesson[] = [];
    weeks.forEach((codes, weekIndex) => {
        const weekStart = collesClass.weekStarts[weekIndex];
        if (!weekStart) return;

        codes.forEach((code) => {
            const slot = collesClass.slots[code];
            if (!slot) return;

            const [hours = 0, minutes = 0] = slot.start.split(":").map(Number);
            const day = addDays(parseISO(weekStart), slot.weekday - 1);
            const start = new Date(
                day.getFullYear(),
                day.getMonth(),
                day.getDate(),
                hours,
                minutes
            );
            const end = addMinutes(start, COLLE_DURATION_MINUTES);
            const subject = i18n.t(
                `schedulePage.colles.subjects.${slot.subject}`
            );

            lessons.push({
                id: `colle-${collesClass.id}-${group}-${weekIndex + 1}-${code}`,
                // Same newline layout as Aurion lessons, so that
                // parseFromTitle reads it.
                title: [
                    slot.room,
                    i18n.t("schedulePage.colles.event", { subject }),
                    type,
                    slot.teacher,
                ].join("\n"),
                start: format(start, "yyyy-MM-dd'T'HH:mm:ss"),
                end: format(end, "yyyy-MM-dd'T'HH:mm:ss"),
                allDay: false,
                editable: false,
                className: "est-colle",
            });
        });
    });

    return lessons;
}

/**
 * Build the calendar events for a student's khôlles class/group, as resolved
 * server-side by API-v2 (routes/supa-data/colles.ts) — the student roster
 * never ships in this bundle. Returns an empty list when the student isn't
 * part of a known roster.
 */
export function buildCollesLessons(
    className: string | null | undefined,
    group: string | null | undefined
): Lesson[] {
    if (!className || !group) return [];

    const collesClass = COLLES_CLASSES.find((c) => c.label === className);
    if (!collesClass) return [];

    return buildColleLessons(collesClass, group);
}

/* ------------------------------------------------------- Palantir rooms -- */

const normalizeRoom = (value: string) =>
    value
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();

/**
 * Every khôlle of every group, bucketed by room, for Palantir's room
 * plannings — the sheet is public (no roster), so no API call is needed.
 * Built once per language, since the event titles are localized.
 */
let cachedRoomColles: {
    language: string;
    byRoom: Map<string, Lesson[]>;
} | null = null;

function allRoomColles(): Map<string, Lesson[]> {
    if (cachedRoomColles?.language === i18n.language) {
        return cachedRoomColles.byRoom;
    }

    const byRoom = new Map<string, Lesson[]>();
    for (const collesClass of COLLES_CLASSES) {
        for (const group of Object.keys(collesClass.groups)) {
            for (const lesson of buildColleLessons(collesClass, group)) {
                const room = normalizeRoom(lesson.title.split("\n")[0] ?? "");
                const bucket = byRoom.get(room);
                if (bucket) {
                    bucket.push(lesson);
                } else {
                    byRoom.set(room, [lesson]);
                }
            }
        }
    }

    cachedRoomColles = { language: i18n.language, byRoom };
    return byRoom;
}

/**
 * Every khôlle happening in `room` — Palantir room labels ("IC2 C403") match
 * the colles sheet's rooms, and a suffix in the sheet ("IC2 C403 - Labo")
 * still matches the shorter Palantir label.
 */
export function getRoomCollesLessons(room: string): Lesson[] {
    const byRoom = allRoomColles();
    const needle = normalizeRoom(room);
    if (!needle) return [];

    if (byRoom.has(needle)) return byRoom.get(needle) ?? [];

    const lessons: Lesson[] = [];
    for (const [key, bucket] of byRoom) {
        if (key.startsWith(`${needle} -`) || key.startsWith(`${needle} `)) {
            lessons.push(...bucket);
        }
    }
    return lessons;
}

/* -------------------------------------------- Palantir classes, people -- */

const labelTokens = (value: string) =>
    value
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter(Boolean);

/**
 * The colles class behind a Palantir class label. Aurion writes the long
 * promotion label ("2ème année CPGE filière MPI du lycée OZANAM - … -
 * 2026/2027"), the sheet the filière alone ("MPI"): the filière is the
 * only shared token, and an exact one — "MPI" never appears inside
 * "MP2I" or "MPSI".
 */
function matchCollesClass(classLabel: string): CollesClass | undefined {
    const tokens = new Set(labelTokens(classLabel));
    return COLLES_CLASSES.find((c) => tokens.has(c.label.toLowerCase()));
}

/**
 * Every khôlle of the class — all of its groups at once, for Palantir
 * class plannings (a class entity, or a student whose group couldn't be
 * resolved server-side).
 */
export function getClassCollesLessons(classLabel: string): Lesson[] {
    const collesClass = matchCollesClass(classLabel);
    if (!collesClass) return [];

    return Object.keys(collesClass.groups).flatMap((group) =>
        buildColleLessons(collesClass, group)
    );
}

/** One group's khôlles — a Palantir student's own, resolved server-side. */
export function getStudentCollesLessons(
    classLabel: string,
    group: string
): Lesson[] {
    const collesClass = matchCollesClass(classLabel);
    return collesClass ? buildColleLessons(collesClass, group) : [];
}

/** Title words that carry no identity: "M. Humeau" is just "Humeau". */
const TEACHER_TITLE_WORDS = new Set([
    "m",
    "mm",
    "mme",
    "mr",
    "monsieur",
    "madame",
    "dr",
    "pr",
]);

const surnameTokens = (value: string) =>
    labelTokens(value).filter((token) => !TEACHER_TITLE_WORDS.has(token));

let cachedTeacherColles: {
    language: string;
    bySurname: Map<string, Lesson[]>;
} | null = null;

function allTeacherColles(): Map<string, Lesson[]> {
    if (cachedTeacherColles?.language === i18n.language) {
        return cachedTeacherColles.bySurname;
    }

    const bySurname = new Map<string, Lesson[]>();
    for (const collesClass of COLLES_CLASSES) {
        // The same slot can serve two groups the same week; a teacher's
        // planning wants the physical slot once, not once per group.
        const seen = new Set<string>();
        for (const group of Object.keys(collesClass.groups)) {
            for (const lesson of buildColleLessons(collesClass, group)) {
                const dedup = `${lesson.start}|${lesson.title}`;
                if (seen.has(dedup)) continue;
                seen.add(dedup);

                const teacher = lesson.title.split("\n")[3] ?? "";
                for (const token of surnameTokens(teacher)) {
                    const bucket = bySurname.get(token);
                    if (bucket) {
                        bucket.push(lesson);
                    } else {
                        bySurname.set(token, [lesson]);
                    }
                }
            }
        }
    }

    cachedTeacherColles = { language: i18n.language, bySurname };
    return bySurname;
}

/**
 * Every khôlle a teacher gives — Palantir teacher plannings. The sheet
 * writes "M. Humeau", Aurion "Monsieur HUMEAU": surnames are the only
 * reliable bridge, so the match is on any shared name token.
 */
export function getTeacherCollesLessons(teacher: string): Lesson[] {
    const bySurname = allTeacherColles();
    const tokens = surnameTokens(teacher);
    if (!tokens.length) return [];

    const lessons: Lesson[] = [];
    const seen = new Set<string>();
    for (const token of tokens) {
        for (const lesson of bySurname.get(token) ?? []) {
            if (seen.has(lesson.id)) continue;
            seen.add(lesson.id);
            lessons.push(lesson);
        }
    }
    return lessons.sort((a, b) => a.start.localeCompare(b.start));
}
