import { mockNotes } from "@/pages/mock";
import type { NotesEntry } from "@/utils/api";

type RawApiNote = NotesEntry["data"][number];

type UiNote = {
    code: string;
    date: string;
    course: string;
    grade: string;
    coef: string;
};

type UiStats = {
    moyenne?: string;
    min?: string;
    mediane?: string;
    ecartType?: string;
    commentaire?: string;
    code?: string;
};

type MergedNote = { note: UiNote; stats?: UiStats };

function formatDateFR(iso: string): string {
    const [y, m, d] = iso.split("-");
    if (!y || !m || !d) return iso;
    return `${d}/${m}/${y}`;
}

function parseLocalNotes(): RawApiNote[] {
    try {
        const raw = localStorage.getItem("notes");
        if (!raw) return [];
        const parsed = JSON.parse(raw) as RawApiNote[];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export const getCurrentYearMergedNotesData = (
    mergedNotesData: MergedNote[],
    currentYear: number
): MergedNote[] => {
    return mergedNotesData.filter(({ note }) => {
        const yearPrefix = Number(note.code?.split("_")?.[0]);
        return yearPrefix === currentYear;
    });
};

export const mergeNotesData = (
    getThisYearNotes: boolean,
    currentYear: number
): MergedNote[] => {
    // const rawNotes = parseLocalNotes()
    const rawNotes = mockNotes.data;
    if (rawNotes.length === 0) return [];

    const byCode = new Map<string, RawApiNote>();
    for (const n of rawNotes) {
        if (!n?.code) continue;
        byCode.set(n.code, n);
    }

    const merged: MergedNote[] = [];
    for (const n of byCode.values()) {
        const note: UiNote = {
            code: n.code,
            date: formatDateFR(n.date),
            course: n.epreuve,
            grade: n.note,
            coef: n.coefficient,
        };

        const hasAnyStat =
            n.moyenne !== undefined ||
            n.min !== undefined ||
            n.mediane !== undefined ||
            n.ecartType !== undefined ||
            n.commentaire !== undefined;

        const stats: UiStats | undefined = hasAnyStat
            ? {
                  moyenne: n.moyenne,
                  min: n.min,
                  mediane: n.mediane,
                  ecartType: n.ecartType,
                  commentaire: n.commentaire,
                  code: n.code,
              }
            : undefined;

        merged.push({ note, stats });
    }

    return getThisYearNotes
        ? getCurrentYearMergedNotesData(merged, currentYear)
        : merged;
};
