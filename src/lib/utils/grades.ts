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
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            // Academic year starts in September (month 8) and ends in August (month 7)
            const academicYear =
                currentMonth >= 8 ? currentYear : currentYear - 1;

            const gradeDate = new Date(
                grade.date.split("/").reverse().join("-")
            );
            const gradeMonth = gradeDate.getMonth();
            const gradeYear = gradeDate.getFullYear();
            const gradeAcademicYear =
                gradeMonth >= 8 ? gradeYear : gradeYear - 1;

            return gradeAcademicYear === academicYear;
        }
        return true;
    });
}

export type GradeBadgeInfo = {
    label: string;
    rawCode: string;
    normalizedCode: string;
};

const gradeBadgeKeywordMap: Array<{ keyword: string; label: string }> = [
    { keyword: "math", label: "Maths" },
    { keyword: "phys", label: "Physique" },
    { keyword: "optique", label: "Physique" },
    { keyword: "info", label: "Informatique" },
    { keyword: "prog", label: "Informatique" },
    { keyword: "web", label: "Informatique" },
    { keyword: "anglais", label: "Anglais" },
    { keyword: "sii", label: "SII" },
    { keyword: "fhs", label: "FHS" },
];

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
    const label = keywordMatch?.label ?? "";

    return {
        label,
        rawCode,
        normalizedCode,
    };
}
