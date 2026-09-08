import { Grade } from "@/types/aurion";

function isArtifactGrade(grade: Grade): boolean {
    const values = Object.values(grade).map((v) => (v ?? "").toString().trim());
    return values.every((v) => v === "");
}

export function getGrades({
    semesterKey,
    grades,
}: {
    semesterKey?: string | null;
    grades: Grade[];
}): Grade[] {
    return grades.filter((grade) => {
        if (isArtifactGrade(grade)) return false;
        if (semesterKey) {
            return getGradeSemester(grade)?.key === semesterKey;
        }
        return true;
    });
}

export type SemesterId = {
    /** Stable identifier, e.g. "2025-S1". */
    key: string;
    /** Academic year label, e.g. "2025-26". */
    yearLabel: string;
    sem: 1 | 2;
};

/** Academic year starts at the "rentrée" (late August). */
function academicStartYear(d: Date): number {
    if (d.getMonth() >= 8) return d.getFullYear();
    if (d.getMonth() === 7 && d.getDate() >= 29) return d.getFullYear();
    return d.getFullYear() - 1;
}

/**
 * Aurion encodes the semester in the grade code, e.g.
 * `..._PART1_MATHS1`, `..._ANGLAIS_CLASSWORK_S2`, `..._TIPE_S2`.
 */
function semesterFromCode(code: string): 1 | 2 | null {
    const m =
        code.match(/_PART([12])(?:_|$)/i) ?? code.match(/_S([12])(?:_|$)/i);
    if (!m) return null;
    return m[1] === "2" ? 2 : 1;
}

/** Fallback when the code carries no marker. S1: Aug 29 – Dec 29, S2: Dec 30 – Aug 28. */
function semesterFromDate(d: Date): 1 | 2 {
    const m = d.getMonth();
    const day = d.getDate();
    if (m === 7 && day >= 29) return 1; // late August = rentrée
    if (m >= 8 && !(m === 11 && day >= 30)) return 1;
    return 2;
}

function parseGradeDate(date?: string | null): Date | null {
    if (!date) return null;
    const d = new Date(date.split("/").reverse().join("-"));
    return isNaN(d.getTime()) ? null : d;
}

export function getGradeSemester(grade: Grade): SemesterId | null {
    const d = parseGradeDate(grade.date);
    if (!d) return null;
    const startYear = academicStartYear(d);
    const sem = semesterFromCode(grade.code) ?? semesterFromDate(d);
    return {
        key: `${startYear}-S${sem}`,
        yearLabel: `${startYear}-${String(startYear + 1).slice(2)}`,
        sem,
    };
}

/** Distinct semesters present in the grades, chronological order (oldest first). */
export function getGradeSemesters(grades: Grade[]): SemesterId[] {
    const map = new Map<string, SemesterId>();
    for (const grade of grades) {
        if (isArtifactGrade(grade)) continue;
        const s = getGradeSemester(grade);
        if (s) map.set(s.key, s);
    }
    return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
}

export function getCurrentSemesterKey(now = new Date()): string {
    return `${academicStartYear(now)}-S${semesterFromDate(now)}`;
}

export type GradeBadgeInfo = {
    labelKey: string;
    rawCode: string;
    normalizedCode: string;
};

const gradeBadgeKeywordMap: Array<{ keyword: string; labelKey: string }> = [
    { keyword: "math", labelKey: "gradesPage.subjects.maths" },
    { keyword: "phys", labelKey: "gradesPage.subjects.physics" },
    { keyword: "optique", labelKey: "gradesPage.subjects.physics" },
    { keyword: "info", labelKey: "gradesPage.subjects.computerScience" },
    { keyword: "prog", labelKey: "gradesPage.subjects.computerScience" },
    { keyword: "web", labelKey: "gradesPage.subjects.computerScience" },
    { keyword: "anglais", labelKey: "gradesPage.subjects.english" },
    { keyword: "sii", labelKey: "gradesPage.subjects.sii" },
    { keyword: "fhs", labelKey: "gradesPage.subjects.fhs" },
    { keyword: "eps", labelKey: "gradesPage.subjects.eps" },
    { keyword: "lv2", labelKey: "gradesPage.subjects.lv2" },
    { keyword: "langue vivante", labelKey: "gradesPage.subjects.lv2" },
    { keyword: "tipe", labelKey: "gradesPage.subjects.tipe" },
    { keyword: "projet passion", labelKey: "gradesPage.subjects.tipe" },
    { keyword: "pix", labelKey: "gradesPage.subjects.pix" },
];

export type StudentClass = "CPG1_MP2I" | "CPG1_MPSI" | "CPG2_MPI" | "CPG2_PSI";

const CLASS_PATTERNS: Array<{ pattern: string; cls: StudentClass }> = [
    { pattern: "CPG1_MP2I", cls: "CPG1_MP2I" },
    { pattern: "CPG1_MPSI", cls: "CPG1_MPSI" },
    { pattern: "CPG2_MPI", cls: "CPG2_MPI" },
    { pattern: "CPG2_PSI", cls: "CPG2_PSI" },
];

export function detectStudentClass(grades: Grade[]): StudentClass | null {
    for (const grade of grades) {
        const code = grade.code.toUpperCase();
        for (const { pattern, cls } of CLASS_PATTERNS) {
            if (code.includes(pattern)) return cls;
        }
    }
    return null;
}

const subjectCoefficientsPerClass: Record<
    StudentClass,
    Record<string, number>
> = {
    CPG1_MP2I: {
        "gradesPage.subjects.maths": 8,
        "gradesPage.subjects.physics": 6,
        "gradesPage.subjects.sii": 2,
        "gradesPage.subjects.computerScience": 6,
        "gradesPage.subjects.fhs": 2,
        "gradesPage.subjects.english": 2,
        "gradesPage.subjects.eps": 1,
        "gradesPage.subjects.lv2": 2,
        "gradesPage.subjects.tipe": 1,
    },
    CPG1_MPSI: {
        "gradesPage.subjects.maths": 8,
        "gradesPage.subjects.physics": 8,
        "gradesPage.subjects.sii": 4,
        "gradesPage.subjects.computerScience": 2,
        "gradesPage.subjects.fhs": 2,
        "gradesPage.subjects.english": 2,
        "gradesPage.subjects.eps": 1,
        "gradesPage.subjects.lv2": 2,
        "gradesPage.subjects.tipe": 1,
        "gradesPage.subjects.pix": 1,
    },
    CPG2_MPI: {
        "gradesPage.subjects.maths": 8,
        "gradesPage.subjects.physics": 6,
        "gradesPage.subjects.computerScience": 6,
        "gradesPage.subjects.fhs": 2,
        "gradesPage.subjects.english": 2,
        "gradesPage.subjects.eps": 1,
        "gradesPage.subjects.lv2": 2,
        "gradesPage.subjects.tipe": 1,
    },
    CPG2_PSI: {
        "gradesPage.subjects.maths": 8,
        "gradesPage.subjects.physics": 8,
        "gradesPage.subjects.sii": 4,
        "gradesPage.subjects.computerScience": 2,
        "gradesPage.subjects.fhs": 2,
        "gradesPage.subjects.english": 2,
        "gradesPage.subjects.eps": 1,
        "gradesPage.subjects.lv2": 2,
        "gradesPage.subjects.tipe": 1,
        "gradesPage.subjects.pix": 1,
    },
};

export function getSubjectCoefficients(
    grades: Grade[]
): Record<string, number> {
    const cls = detectStudentClass(grades);
    return subjectCoefficientsPerClass[cls ?? "CPG1_MP2I"];
}

export function getGradeBadgeInfoFromCode(
    code?: string | null
): GradeBadgeInfo | null {
    const rawCode = (code ?? "").trim();
    if (!rawCode) return null;

    const normalizedBase = rawCode
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim();

    const normalizedCode = normalizedBase.toUpperCase();
    const searchableCode = normalizedBase.toLowerCase();

    const keywordMatch = gradeBadgeKeywordMap.find(({ keyword }) =>
        searchableCode.includes(keyword)
    );
    const labelKey = keywordMatch?.labelKey ?? "";

    return {
        labelKey,
        rawCode,
        normalizedCode,
    };
}
