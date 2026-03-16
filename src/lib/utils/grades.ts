import { Grade } from "@/types/aurion";

export function getGrades({
    showCurrentYearOnly,
    grades,
}: {
    showCurrentYearOnly?: boolean;
    grades: Grade[];
}): Grade[] {
    return grades.filter((grade) => {
        const values = Object.values(grade).map((v) => (v ?? "").toString().trim());
        const isArtifact = values.every((v) => v === "");
        if (isArtifact) return false;

        if (showCurrentYearOnly) {
            const now = new Date();
            const currentMonth = now.getMonth(); // 0-indexed

            // S1: Sept 1 – Dec 29, S2: Dec 30 – Aug 31
            const inS1 = currentMonth >= 8 && (currentMonth < 11 || now.getDate() <= 29);

            let semesterStart: Date;
            let semesterEnd: Date;
            if (inS1) {
                semesterStart = new Date(now.getFullYear(), 8, 1);   // Sept 1
                semesterEnd   = new Date(now.getFullYear(), 11, 29); // Dec 29
            } else if (currentMonth <= 7) {
                // Jan–Aug: S2 started Dec 30 of previous year
                semesterStart = new Date(now.getFullYear() - 1, 11, 30);
                semesterEnd   = new Date(now.getFullYear(), 7, 31);
            } else {
                // Dec 30–31: S2 goes to Aug 31 of next year
                semesterStart = new Date(now.getFullYear(), 11, 30);
                semesterEnd   = new Date(now.getFullYear() + 1, 7, 31);
            }

            const gradeDate = new Date(
                grade.date.split("/").reverse().join("-")
            );

            return gradeDate >= semesterStart && gradeDate <= semesterEnd;
        }
        return true;
    });
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
];

export const subjectCoefficients: Record<string, number> = {
    "gradesPage.subjects.maths": 8,
    "gradesPage.subjects.physics": 6,
    "gradesPage.subjects.computerScience": 6,
    "gradesPage.subjects.sii": 3,
    "gradesPage.subjects.fhs": 2,
    "gradesPage.subjects.english": 2,
    "gradesPage.subjects.eps": 1,
};

export function getGradeBadgeInfoFromCode(code?: string | null): GradeBadgeInfo | null {
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
