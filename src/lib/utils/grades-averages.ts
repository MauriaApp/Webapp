import { Grade } from "@/types/aurion";
import {
    getGradeBadgeInfoFromCode,
    getSubjectCoefficients,
} from "@/lib/utils/grades";

// Calcul des moyennes (matiere par matiere puis generale) et de leur
// evolution dans le temps. Partage entre la page notes et la synthese
// envoyee au widget Android.

export function parseGradeValue(value: string): number | null {
    if (!value || value.trim() === "") return null;
    const n = parseFloat(value.replace(",", "."));
    return isNaN(n) ? null : n;
}

const LV2_LABEL_KEY = "gradesPage.subjects.lv2";

export function computeAverages(grades: Grade[]) {
    const coefficients = getSubjectCoefficients(grades);
    const subjectMap = new Map<
        string,
        {
            labelKey: string;
            studentSum: number;
            classSum: number;
            studentCoef: number;
            classCoef: number;
        }
    >();

    for (const grade of grades) {
        const g = parseGradeValue(grade.grade);
        const avg = parseGradeValue(grade.average);
        const isPartiel = grade.code.toUpperCase().includes("PART");
        const coef =
            (parseGradeValue(grade.coefficient) ?? 1) * (isPartiel ? 1 : 2);
        const info = getGradeBadgeInfoFromCode(grade.code);
        const labelKey = info?.labelKey || grade.code;

        if (!subjectMap.has(labelKey)) {
            subjectMap.set(labelKey, {
                labelKey,
                studentSum: 0,
                classSum: 0,
                studentCoef: 0,
                classCoef: 0,
            });
        }
        const s = subjectMap.get(labelKey)!;
        if (g !== null) {
            s.studentSum += g * coef;
            s.studentCoef += coef;
        }
        if (avg !== null) {
            s.classSum += avg * coef;
            s.classCoef += coef;
        }
    }

    const bySubject = Array.from(subjectMap.values()).map((s) => ({
        labelKey: s.labelKey,
        student: s.studentCoef > 0 ? s.studentSum / s.studentCoef : null,
        class: s.classCoef > 0 ? s.classSum / s.classCoef : null,
        subjectCoef: coefficients[s.labelKey] ?? null,
        excluded: false,
    }));

    const computeOverall = (subjects: typeof bySubject) => {
        let studentSum = 0,
            classSum = 0,
            studentTotalCoef = 0,
            classTotalCoef = 0;
        for (const s of subjects) {
            if (s.excluded) continue;
            const sc = s.subjectCoef ?? 1;
            if (s.student !== null) {
                studentSum += s.student * sc;
                studentTotalCoef += sc;
            }
            if (s.class !== null) {
                classSum += s.class * sc;
                classTotalCoef += sc;
            }
        }
        return {
            student:
                studentTotalCoef > 0 ? studentSum / studentTotalCoef : null,
            class: classTotalCoef > 0 ? classSum / classTotalCoef : null,
        };
    };

    // LV2 is optional: only counted if it improves the student's average
    const lv2Idx = bySubject.findIndex((s) => s.labelKey === LV2_LABEL_KEY);
    if (lv2Idx !== -1 && bySubject[lv2Idx].student !== null) {
        bySubject[lv2Idx].excluded = true;
        const avgWithout = computeOverall(bySubject);
        bySubject[lv2Idx].excluded = false;
        const avgWith = computeOverall(bySubject);
        if (
            avgWithout.student !== null &&
            avgWith.student !== null &&
            avgWith.student <= avgWithout.student
        ) {
            bySubject[lv2Idx].excluded = true;
        }
    }

    return { overall: computeOverall(bySubject), bySubject };
}

export function computeAverageEvolution(grades: Grade[]) {
    const sorted = [...grades]
        .filter((g) => g.date)
        .sort((a, b) => {
            const toMs = (d: string) =>
                new Date(d.split("/").reverse().join("-")).getTime();
            return toMs(a.date) - toMs(b.date);
        });

    if (sorted.length === 0) return [];

    const points: Array<{
        date: string;
        student: number | null;
        class: number | null;
    }> = [];
    const dateToIdx = new Map<string, number>();

    for (let i = 0; i < sorted.length; i++) {
        const avg = computeAverages(sorted.slice(0, i + 1));
        const dateKey = sorted[i].date;
        const point = {
            date: dateKey,
            student: avg.overall.student,
            class: avg.overall.class,
        };

        if (dateToIdx.has(dateKey)) {
            points[dateToIdx.get(dateKey)!] = point;
        } else {
            dateToIdx.set(dateKey, points.length);
            points.push(point);
        }
    }

    return points;
}
