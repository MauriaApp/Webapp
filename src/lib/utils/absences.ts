import { Absence } from "@/types/aurion";
import { SemesterId, parseFrDate, semesterIdFromDate } from "./semesters";

export { getCurrentSemesterKey } from "./semesters";

export function getAbsenceSemester(absence: Absence): SemesterId | null {
    const d = parseFrDate(absence.date);
    if (!d) return null;
    return semesterIdFromDate(d);
}

/** Distinct semesters present in the absences, chronological order (oldest first). */
export function getAbsenceSemesters(absences: Absence[]): SemesterId[] {
    const map = new Map<string, SemesterId>();
    for (const absence of absences) {
        const s = getAbsenceSemester(absence);
        if (s) map.set(s.key, s);
    }
    return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
}

export function getAbsences({
    semesterKey,
    absences,
}: {
    semesterKey?: string | null;
    absences: Absence[];
}): Absence[] {
    return (absences || []).filter((absence) => {
        if (semesterKey) {
            return getAbsenceSemester(absence)?.key === semesterKey;
        }
        return true;
    });
}

export function isAbsenceJustified(absence: Absence): boolean {
    return !absence.type.toLowerCase().includes("non");
}

export const getAbsencesDurations = (absences: Absence[]) => {
    let totalMinutes = 0;
    let justifiedMinutes = 0;
    let unjustifiedMinutes = 0;

    absences.forEach((absence) => {
        const [hours, minutes] = absence.duration.split(":").map(Number);
        const durationInMinutes = hours * 60 + minutes;

        totalMinutes += durationInMinutes;

        if (isAbsenceJustified(absence)) {
            justifiedMinutes += durationInMinutes;
        } else {
            unjustifiedMinutes += durationInMinutes;
        }
    });

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h${remainingMinutes.toString().padStart(2, "0")}`;
    };

    return {
        total: formatDuration(totalMinutes),
        justified: formatDuration(justifiedMinutes),
        unjustified: formatDuration(unjustifiedMinutes),
    };
};
