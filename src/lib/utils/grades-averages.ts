import { Grade } from "@/types/aurion";
import {
    getCirModuleWeights,
    getGradeBadgeInfoFromCode,
    getSubjectCoefficients,
    CirModuleWeight,
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

type ModuleAcc = {
    weight: number;
    studentSum: number;
    studentCoef: number;
    classSum: number;
    classCoef: number;
};

type SubjectAcc = {
    labelKey: string;
    modules: Map<string, ModuleAcc>;
    // Grades that match no module of the barème: the whole subject falls
    // back to the coefficient-mass averaging.
    hasUnknownModule: boolean;
    studentSum: number;
    studentCoef: number;
    classSum: number;
    classCoef: number;
};

function findModule(
    moduleWeights: CirModuleWeight[] | null,
    info: ReturnType<typeof getGradeBadgeInfoFromCode>,
    code: string
): CirModuleWeight | null {
    if (!moduleWeights) return null;
    const normalizedCode = info?.normalizedCode ?? code.toUpperCase();
    return (
        moduleWeights.find((m) => normalizedCode.includes(m.match)) ?? null
    );
}

export function computeAverages(grades: Grade[]) {
    const coefficients = getSubjectCoefficients(grades);
    const moduleWeights = getCirModuleWeights(grades);
    const subjectMap = new Map<string, SubjectAcc>();

    for (const grade of grades) {
        const g = parseGradeValue(grade.grade);
        const avg = parseGradeValue(grade.average);
        const isPartiel = grade.code.toUpperCase().includes("PART");
        const rawCoef = parseGradeValue(grade.coefficient) ?? 1;
        // CIR : le coefficient Aurion est deja le poids officiel de
        // l'epreuve dans son module (partiel 60, CC 20, hebdo 1…), le
        // rebalancage partiel/CC propre au CPG ne doit pas s'appliquer.
        const coef =
            moduleWeights !== null ? rawCoef : rawCoef * (isPartiel ? 1 : 2);
        const info = getGradeBadgeInfoFromCode(grade.code);
        const labelKey = info?.labelKey || grade.code;
        const module = findModule(moduleWeights, info, grade.code);

        if (!subjectMap.has(labelKey)) {
            subjectMap.set(labelKey, {
                labelKey,
                modules: new Map(),
                hasUnknownModule: false,
                studentSum: 0,
                studentCoef: 0,
                classSum: 0,
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

        if (moduleWeights !== null) {
            if (module) {
                let mod = s.modules.get(module.module);
                if (!mod) {
                    mod = {
                        weight: module.weight,
                        studentSum: 0,
                        studentCoef: 0,
                        classSum: 0,
                        classCoef: 0,
                    };
                    s.modules.set(module.module, mod);
                }
                if (g !== null) {
                    mod.studentSum += g * coef;
                    mod.studentCoef += coef;
                }
                if (avg !== null) {
                    mod.classSum += avg * coef;
                    mod.classCoef += coef;
                }
            } else {
                s.hasUnknownModule = true;
            }
        }
    }

    const massAvg = (sum: number, coefSum: number) =>
        coefSum > 0 ? sum / coefSum : null;

    // Barème officiel : moyenne de l'UE = moyenne des modules pondérée
    // par leur poids dans l'UE. Les modules sans note (élève ou classe)
    // sont écartés des deux sommes.
    const moduleAvg = (s: SubjectAcc, kind: "student" | "class") => {
        let sum = 0;
        let totalWeight = 0;
        for (const mod of s.modules.values()) {
            const coefSum = kind === "student" ? mod.studentCoef : mod.classCoef;
            if (coefSum <= 0) continue;
            const value =
                kind === "student"
                    ? mod.studentSum / mod.studentCoef
                    : mod.classSum / mod.classCoef;
            sum += mod.weight * value;
            totalWeight += mod.weight;
        }
        return totalWeight > 0 ? sum / totalWeight : null;
    };

    const bySubject = Array.from(subjectMap.values()).map((s) => {
        const exact =
            moduleWeights !== null &&
            !s.hasUnknownModule &&
            s.modules.size > 0;
        return {
            labelKey: s.labelKey,
            student: exact
                ? moduleAvg(s, "student")
                : massAvg(s.studentSum, s.studentCoef),
            class: exact
                ? moduleAvg(s, "class")
                : massAvg(s.classSum, s.classCoef),
            subjectCoef: coefficients[s.labelKey] ?? null,
            excluded: false,
        };
    });

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
