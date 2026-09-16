import { addDays, addMinutes, format, parseISO } from "date-fns";
import i18n from "@/i18n";
import { COLLES_CLASSES } from "@/lib/data/colles";
import { Lesson } from "@/types/aurion";
import { CollesClass, ColleStudent } from "@/types/colles";

const COLLE_DURATION_MINUTES = 60;
const MIN_PREFIX_LENGTH = 3;

const normalize = (value: string) =>
    value
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z]/g, "");

// Aurion logins look like "prenom.nom@ecole.com". The surname half is
// sometimes shortened, so it is only ever compared as a prefix.
const splitEmail = (email: string) => {
    const local = email.split("@")[0] ?? "";
    const parts = local
        .split(/[._-]+/)
        .map(normalize)
        .filter(Boolean);
    return { firstName: parts[0] ?? "", lastName: parts.slice(1).join("") };
};

const isPrefixOf = (value: string, prefix: string) =>
    prefix.length >= MIN_PREFIX_LENGTH && value.startsWith(prefix);

const matches = (rosterName: string, emailName: string) =>
    rosterName === emailName ||
    isPrefixOf(rosterName, emailName) ||
    isPrefixOf(emailName, rosterName);

// Compound given names ("Mourad Olatodou Kpego Unix") only keep their first
// word in the email address.
const givenName = (student: ColleStudent) =>
    normalize(student.firstName.split(" ")[0] ?? "");

/**
 * Find the logged-in student in the hardcoded rosters, using their given name
 * and, when several classmates share it, the start of their surname.
 */
export function findColleStudent(
    email: string
): { collesClass: CollesClass; student: ColleStudent } | null {
    const { firstName, lastName } = splitEmail(email);
    if (!firstName) return null;
    // Too short to tell anyone apart (e.g. "louis.s2026@…"): given name only.
    const useSurname = lastName.length >= MIN_PREFIX_LENGTH;

    for (const collesClass of COLLES_CLASSES) {
        const candidates = collesClass.students.filter(
            (student) =>
                matches(givenName(student), firstName) &&
                (!useSurname || matches(normalize(student.lastName), lastName))
        );
        if (candidates.length === 1 && candidates[0]) {
            return { collesClass, student: candidates[0] };
        }

        // Still ambiguous: an exact surname beats a mere prefix.
        const exactSurname = candidates.filter(
            (student) => normalize(student.lastName) === lastName
        );
        if (exactSurname.length === 1 && exactSurname[0]) {
            return { collesClass, student: exactSurname[0] };
        }
    }

    return null;
}

/**
 * Build the calendar events for the colles of the student behind `email`.
 * Returns an empty list when the student isn't part of a known roster.
 */
export function getColleLessons(email: string | null | undefined): Lesson[] {
    if (!email) return [];

    const match = findColleStudent(email);
    if (!match) return [];

    const { collesClass, student } = match;
    const weeks = collesClass.groups[student.group] ?? [];
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
                id: `colle-${collesClass.id}-${student.group}-${
                    weekIndex + 1
                }-${code}`,
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
