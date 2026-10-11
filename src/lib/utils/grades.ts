import { Grade } from "@/types/aurion";
import {
    SemesterId,
    academicStartYear,
    semesterFromDate,
    getCurrentSemesterKey,
    parseFrDate,
} from "./semesters";

export type { SemesterId };
export { getCurrentSemesterKey };

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

/**
 * Aurion encodes the semester in the grade code, e.g.
 * `..._PART1_MATHS1`, `..._ANGLAIS_CLASSWORK_S2`, `..._TIPE_S2`.
 * CIR2 codes carry the global curriculum semester (`..._CIR2_S3_MATH5_P1`,
 * `..._CIR2_S4_ONDES_P1`) — odd semesters map to the first calendar
 * semester, even ones to the second.
 */
function semesterFromCode(code: string): 1 | 2 | null {
    const m =
        code.match(/_PART([12])(?:_|$)/i) ?? code.match(/_S([1-9])(?:_|$)/i);
    if (!m) return null;
    return Number(m[1]) % 2 === 0 ? 2 : 1;
}

export function getGradeSemester(grade: Grade): SemesterId | null {
    const d = parseFrDate(grade.date);
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
    // CIR: UE Physique, Électronique
    { keyword: "elec", labelKey: "gradesPage.subjects.physics" },
    { keyword: "meca", labelKey: "gradesPage.subjects.physics" },
    { keyword: "thermo", labelKey: "gradesPage.subjects.physics" },
    { keyword: "onde", labelKey: "gradesPage.subjects.physics" },
    { keyword: "autom", labelKey: "gradesPage.subjects.physics" },
    { keyword: "autoseq", labelKey: "gradesPage.subjects.physics" },
    // CIR: UE Informatique
    { keyword: "bdd", labelKey: "gradesPage.subjects.computerScience" },
    { keyword: "embarq", labelKey: "gradesPage.subjects.computerScience" },
    { keyword: "algo", labelKey: "gradesPage.subjects.computerScience" },
    { keyword: "logique", labelKey: "gradesPage.subjects.computerScience" },
    { keyword: "fhs", labelKey: "gradesPage.subjects.fhs" },
    // CIR: UE Humanités, Langues (hors Anglais)
    { keyword: "comm", labelKey: "gradesPage.subjects.fhs" },
    { keyword: "ecrit", labelKey: "gradesPage.subjects.fhs" },
    { keyword: "oral", labelKey: "gradesPage.subjects.fhs" },
    { keyword: "epistemo", labelKey: "gradesPage.subjects.fhs" },
    { keyword: "promo", labelKey: "gradesPage.subjects.fhs" },
    { keyword: "societe", labelKey: "gradesPage.subjects.fhs" },
    { keyword: "scisoc", labelKey: "gradesPage.subjects.fhs" },
    { keyword: "intercultur", labelKey: "gradesPage.subjects.fhs" },
    { keyword: "comp_rel", labelKey: "gradesPage.subjects.fhs" },
    { keyword: "odd", labelKey: "gradesPage.subjects.fhs" },
    { keyword: "eps", labelKey: "gradesPage.subjects.eps" },
    { keyword: "lv2", labelKey: "gradesPage.subjects.lv2" },
    { keyword: "langue vivante", labelKey: "gradesPage.subjects.lv2" },
    { keyword: "tipe", labelKey: "gradesPage.subjects.tipe" },
    { keyword: "projet passion", labelKey: "gradesPage.subjects.tipe" },
    // CIR: UE Stage / UE Projet — après "projet passion" pour ne pas
    // capturer les codes CPG (PROJ_INFO/PROJ_ELEC matchent info/elec avant)
    { keyword: "stage", labelKey: "gradesPage.subjects.stage" },
    { keyword: "projet", labelKey: "gradesPage.subjects.projet" },
    { keyword: "pix", labelKey: "gradesPage.subjects.pix" },
];

export type StudentClass =
    | "CPG1_MP2I"
    | "CPG1_MPSI"
    | "CPG2_MPI"
    | "CPG2_PSI"
    | "CIR1"
    | "CIR2";

const CLASS_PATTERNS: Array<{ pattern: string; cls: StudentClass }> = [
    { pattern: "CPG1_MP2I", cls: "CPG1_MP2I" },
    { pattern: "CPG1_MPSI", cls: "CPG1_MPSI" },
    { pattern: "CPG2_MPI", cls: "CPG2_MPI" },
    { pattern: "CPG2_PSI", cls: "CPG2_PSI" },
    { pattern: "CIR1", cls: "CIR1" },
    { pattern: "CIR2", cls: "CIR2" },
];

export function detectStudentClass(grades: Grade[]): StudentClass | null {
    // A student's history holds codes from earlier cycles too (a CIR2
    // student still carries their CIR1 grades, a CPG2 their CPG1): the
    // most recent dated grade decides which class is current.
    let best: { cls: StudentClass; date: number } | null = null;
    for (const grade of grades) {
        const cls = CLASS_PATTERNS.find(({ pattern }) =>
            grade.code.toUpperCase().includes(pattern)
        )?.cls;
        if (!cls) continue;
        const time = parseFrDate(grade.date)?.getTime() ?? 0;
        if (best === null || time >= best.date) best = { cls, date: time };
    }
    return best?.cls ?? null;
}

export function isCpgClass(cls: StudentClass | null): boolean {
    return cls !== null && cls.startsWith("CPG");
}

export function isCirClass(cls: StudentClass | null): cls is "CIR1" | "CIR2" {
    return cls === "CIR1" || cls === "CIR2";
}

const subjectCoefficientsPerClass: Record<
    Exclude<StudentClass, "CIR1" | "CIR2">,
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

// CIR averages follow the UE/ECTS scheme of the official "Calcul de
// moyenne" barèmes: a subject's coefficient is its UE's ECTS weight, and
// it changes between the two semesters of the year (Aurion encodes the
// semester in the grade codes, e.g. 2526_ISEN_CIR1_S2_MATH3_CC). Anglais
// is a module of the Humanités UE, so its ECTS share is split by the
// module's official weight within that UE. The Stage/Projet UEs have no
// subject slot: the stage is not graded, and the project grades fold
// into the subject of their module (PROJ_INFO → Informatique,
// PROJ_ELEC → Physique).
const cirSubjectCoefficients: Record<
    "CIR1" | "CIR2",
    [Record<string, number>, Record<string, number>] // [semester 1, semester 2]
> = {
    CIR1: [
        {
            // UE 1.1 — Maths 9, Physique/Élec 8, Info 7, Humanités 6 (Anglais 50 %)
            "gradesPage.subjects.maths": 9,
            "gradesPage.subjects.physics": 8,
            "gradesPage.subjects.computerScience": 7,
            "gradesPage.subjects.english": 3,
            "gradesPage.subjects.fhs": 3,
        },
        {
            // UE 1.2 — Maths 8, Physique/Élec 7, Info 7, Humanités 6 (Anglais 50 %)
            "gradesPage.subjects.maths": 8,
            "gradesPage.subjects.physics": 7,
            "gradesPage.subjects.computerScience": 7,
            "gradesPage.subjects.english": 3,
            "gradesPage.subjects.fhs": 3,
        },
    ],
    CIR2: [
        {
            // UE 1.3 — Maths 8, Physique/Élec 5, Info 8, Humanités 7 (Anglais 35 %), Stage 2
            "gradesPage.subjects.maths": 8,
            "gradesPage.subjects.physics": 5,
            "gradesPage.subjects.computerScience": 8,
            "gradesPage.subjects.english": 2.5,
            "gradesPage.subjects.fhs": 4.5,
            "gradesPage.subjects.stage": 2,
        },
        {
            // UE 1.4 — Maths 8, Physique/Élec 7, Info 6, Humanités 6 (Anglais 50 %), Projet 3
            "gradesPage.subjects.maths": 8,
            "gradesPage.subjects.physics": 7,
            "gradesPage.subjects.computerScience": 6,
            "gradesPage.subjects.english": 3,
            "gradesPage.subjects.fhs": 3,
            "gradesPage.subjects.projet": 3,
        },
    ],
};

// Same recency rule as detectStudentClass: the semester of the most
// recent dated grade wins. Only matters for mixed-semester views.
function detectCirSemester(grades: Grade[]): 0 | 1 {
    let best: { sem: 1 | 2; date: number } | null = null;
    for (const grade of grades) {
        const sem = semesterFromCode(grade.code);
        if (!sem) continue;
        const time = parseFrDate(grade.date)?.getTime() ?? 0;
        if (best === null || time >= best.date) best = { sem, date: time };
    }
    return best?.sem === 2 ? 1 : 0;
}

export function getSubjectCoefficients(
    grades: Grade[]
): Record<string, number> {
    const cls = detectStudentClass(grades);
    if (isCirClass(cls)) {
        return cirSubjectCoefficients[cls][detectCirSemester(grades)];
    }
    return subjectCoefficientsPerClass[cls ?? "CPG1_MP2I"];
}

// CIR: official "Poids du module dans l'UE" from the barèmes. Each grade
// is attached to a module by substring-matching its code (entries are
// ordered most-specific first); the subject average then weights the
// module averages by these instead of the raw coefficient mass, matching
// the school's "Calcul de moyenne" sheets. Grades of a subject that match
// no module fall back to the coefficient-mass averaging (see
// computeAverages). Modules evaluated outside their UE's official barème
// (S2 Projet UE, S4 ODD) get an ECTS-proportional pseudo-weight.
export type CirModuleWeight = {
    match: string;
    module: string;
    weight: number;
};

const cirModuleWeights: Record<
    "CIR1" | "CIR2",
    [CirModuleWeight[], CirModuleWeight[]] // [semester 1, semester 2]
> = {
    CIR1: [
        [
            // UE 1.1
            { match: "MATH1", module: "MATH1", weight: 40 },
            { match: "MATH2", module: "MATH2", weight: 40 },
            { match: "MATH_TP", module: "MATH_TP", weight: 20 },
            { match: "OPTIQUE", module: "OPTIQUE", weight: 25 },
            { match: "ELEC_TP", module: "ELEC_TP", weight: 25 },
            { match: "ELEC", module: "ELEC", weight: 50 },
            { match: "PROG1_TPA", module: "PROG1_TP", weight: 35 },
            { match: "INFO_PRAT", module: "PROG1_TP", weight: 35 },
            { match: "PROG1", module: "PROG1", weight: 15 },
            { match: "WEB", module: "WEB", weight: 50 },
            { match: "ANGLAIS", module: "ANGLAIS", weight: 50 },
            { match: "COMM", module: "COMM", weight: 50 },
        ],
        [
            // UE 1.2
            { match: "MATH3", module: "MATH3", weight: 40 },
            { match: "MATH4", module: "MATH4", weight: 40 },
            { match: "MATH_TP", module: "MATH_TP", weight: 20 },
            { match: "ELEC_TP", module: "ELEC_TP", weight: 20 },
            { match: "MECA", module: "MECA", weight: 50 },
            { match: "THERMO", module: "THERMO", weight: 30 },
            { match: "PROG2_TPC", module: "PROG2_TPC", weight: 15 },
            { match: "PROG2", module: "PROG2", weight: 50 },
            { match: "BDD", module: "BDD", weight: 10 },
            { match: "INFO_WEB", module: "WEB", weight: 25 },
            { match: "WEB", module: "WEB", weight: 25 },
            { match: "ANGLAIS", module: "ANGLAIS", weight: 50 },
            { match: "ECRIT", module: "ECRIT", weight: 10 },
            { match: "ORAL", module: "ORAL", weight: 10 },
            { match: "EPISTEMO", module: "EPISTEMO", weight: 20 },
            { match: "PROMOTION", module: "PROMOTION", weight: 10 },
            { match: "PROJ_INFO", module: "PROJ_INFO", weight: 14 },
            { match: "PROJ_ELEC", module: "PROJ_ELEC", weight: 14 },
        ],
    ],
    CIR2: [
        [
            // UE 1.3
            { match: "MATH5", module: "MATH5", weight: 40 },
            { match: "MATH6", module: "MATH6", weight: 40 },
            { match: "MATHS_TP", module: "MATHS_TP", weight: 20 },
            { match: "ELECMAG", module: "ELECMAG", weight: 70 },
            { match: "ELEC", module: "ELECMAG", weight: 70 },
            { match: "AUTOSEQ", module: "AUTOSEQ", weight: 30 },
            { match: "PROG3", module: "PROG3", weight: 70 },
            { match: "INFO_ARDUINO", module: "INFO_ARDUINO", weight: 30 },
            { match: "ANGLAIS", module: "ANGLAIS", weight: 35 },
            { match: "SCISOC", module: "SCISOC", weight: 30 },
            { match: "ECRIT", module: "ECRIT", weight: 10 },
            { match: "ORAL", module: "ORAL", weight: 10 },
            { match: "EPISTEMO", module: "EPISTEMO", weight: 15 },
            { match: "STAGE", module: "STAGE", weight: 100 },
        ],
        [
            // UE 1.4
            { match: "MATH7", module: "MATH7", weight: 40 },
            { match: "MATH8", module: "MATH8", weight: 40 },
            { match: "MATHS_TP", module: "MATHS_TP", weight: 20 },
            { match: "ONDES", module: "ONDES", weight: 30 },
            { match: "ELEC", module: "ELEC", weight: 40 },
            { match: "AUTOSEQ", module: "AUTOSEQ2", weight: 30 },
            { match: "PROG4", module: "PROG4", weight: 70 },
            { match: "WEB", module: "WEB", weight: 30 },
            { match: "ANGLAIS", module: "ANGLAIS", weight: 50 },
            { match: "COMP_REL", module: "COMP_REL", weight: 20 },
            { match: "INTERCULTUREL", module: "INTERCULTUREL", weight: 20 },
            { match: "PROMOTION", module: "PROMOTION", weight: 10 },
            { match: "ODD", module: "ODD", weight: 10 },
            { match: "PROJET", module: "PROJET", weight: 100 },
        ],
    ],
};

export function getCirModuleWeights(
    grades: Grade[]
): CirModuleWeight[] | null {
    const cls = detectStudentClass(grades);
    if (!isCirClass(cls)) return null;
    return cirModuleWeights[cls][detectCirSemester(grades)];
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
