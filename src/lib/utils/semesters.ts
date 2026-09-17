export type SemesterId = {
    /** Stable identifier, e.g. "2025-S1". */
    key: string;
    /** Academic year label, e.g. "2025-26". */
    yearLabel: string;
    sem: 1 | 2;
};

/** Academic year starts at the "rentrée" (late August). */
export function academicStartYear(d: Date): number {
    if (d.getMonth() >= 8) return d.getFullYear();
    if (d.getMonth() === 7 && d.getDate() >= 29) return d.getFullYear();
    return d.getFullYear() - 1;
}

/** S1: Aug 29 – Dec 29, S2: Dec 30 – Aug 28. */
export function semesterFromDate(d: Date): 1 | 2 {
    const m = d.getMonth();
    const day = d.getDate();
    if (m === 7 && day >= 29) return 1; // late August = rentrée
    if (m >= 8 && !(m === 11 && day >= 30)) return 1;
    return 2;
}

export function semesterIdFromDate(d: Date): SemesterId {
    const startYear = academicStartYear(d);
    const sem = semesterFromDate(d);
    return {
        key: `${startYear}-S${sem}`,
        yearLabel: `${startYear}-${String(startYear + 1).slice(2)}`,
        sem,
    };
}

export function getCurrentSemesterKey(now = new Date()): string {
    return `${academicStartYear(now)}-S${semesterFromDate(now)}`;
}

/** Parses "DD/MM/YYYY" or "DD/MM/YY" (Aurion mixes both across features). */
export function parseFrDate(date?: string | null): Date | null {
    if (!date) return null;
    const [day, month, yearRaw] = date.split("/");
    if (!day || !month || !yearRaw) return null;
    const year = yearRaw.length === 2 ? String(2000 + Number(yearRaw)) : yearRaw;
    const d = new Date(`${year}-${month}-${day}`);
    return isNaN(d.getTime()) ? null : d;
}
