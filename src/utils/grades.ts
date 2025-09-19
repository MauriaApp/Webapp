import { mockNotes } from "@/pages/mock";

export type Grade = {
    date: string;
    code: string;
    name: string;
    grade: string;
    coefficient: string;
    average: string;
    min: string;
    max: string;
    median: string;
    standardDeviation: string;
    comment: string;
};

export function getGrades({
    showCurrentYearOnly,
}: { showCurrentYearOnly?: boolean } = {}) {
    return mockNotes.data.filter((grade) => {
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
