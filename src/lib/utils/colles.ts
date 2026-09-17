import { addDays, addMinutes, format, parseISO } from "date-fns";
import i18n from "@/i18n";
import { fetchColleGroup } from "@/lib/api/colles";
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
 * Build the calendar events for the colles of the student behind `email`.
 * The class/group lookup happens server-side (API-v2 routes/supa-data/colles.ts) —
 * the student roster never ships in this bundle. Returns an empty list when
 * the student isn't part of a known roster.
 *
 * `confirmedCpg` should come from `detectStudentClass` on the student's
 * Aurion grades: it tells the server it can use its looser (prefix) name
 * matching instead of requiring an exact full-name match. Without it, a
 * student from another filière whose name merely resembles a CPG student's
 * could get matched to someone else's khôlles.
 */
export async function getColleLessons(
    email: string | null | undefined,
    confirmedCpg: boolean
): Promise<Lesson[]> {
    if (!email) return [];

    const match = await fetchColleGroup(email, confirmedCpg);
    if (!match?.class || !match.group) return [];

    const collesClass = COLLES_CLASSES.find((c) => c.label === match.class);
    if (!collesClass) return [];

    return buildColleLessons(collesClass, match.group);
}
