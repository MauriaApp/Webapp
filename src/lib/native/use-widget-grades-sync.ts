import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useIsRestoring, useQueryClient } from "@tanstack/react-query";

import { Grade } from "@/types/aurion";
import {
    getGrades,
    getGradeBadgeInfoFromCode,
    getGradeSemesters,
    getCurrentSemesterKey,
} from "@/lib/utils/grades";
import {
    computeAverages,
    computeAverageEvolution,
    parseGradeValue,
} from "@/lib/utils/grades-averages";
import {
    hasWidgetPlugin,
    pushWidgetGrades,
    WidgetGradesPayload,
} from "@/lib/native/widget";

// Le widget ne montre que le semestre en cours ; les notes des semestres
// precedents restent consultables dans l'app.
const WIDGET_GRADES_ALL_SEMESTERS = false;

// Construit le payload envoye au widget de notes natif (MauriaPWA2).
// Base sur le semestre courant (ou le plus recent avec des notes),
// independamment du filtre choisi dans l'UI.
function buildWidgetGradesPayload(
    allGrades: Grade[],
    subjectLabel: (code: string, fallback: string) => string,
    badgeLabel: (code: string) => string | null
): WidgetGradesPayload {
    const semesters = getGradeSemesters(allGrades);
    const current = getCurrentSemesterKey();
    const semesterKey = semesters.some((s) => s.key === current)
        ? current
        : (semesters[semesters.length - 1]?.key ?? null);

    const grades = WIDGET_GRADES_ALL_SEMESTERS
        ? getGrades({ grades: allGrades })
        : getGrades({ semesterKey, grades: allGrades });
    const { overall, bySubject } = computeAverages(grades);

    const evolution = computeAverageEvolution(grades).map((p) => ({
        student: p.student,
        class: p.class,
    }));

    const parseNum = (v?: string | null): number | null => {
        const n = parseGradeValue(v ?? "");
        return n;
    };

    const recent = [...grades]
        .filter((g) => g.date && parseNum(g.grade) !== null)
        .sort((a, b) => {
            const toMs = (d: string) =>
                new Date(d.split("/").reverse().join("-")).getTime();
            return toMs(b.date) - toMs(a.date);
        })
        .slice(0, 8)
        .map((g) => {
            const value = parseNum(g.grade) as number;
            const classAvg = parseNum(g.average);
            const candidates = [
                value,
                classAvg,
                parseNum(g.min),
                parseNum(g.max),
            ].filter((v): v is number => v !== null && v > 0);
            const scale = candidates.every((v) => v <= 10) ? 10 : 20;
            const coefficient = parseNum(g.coefficient);
            // g.date est au format "DD/MM/YYYY" -> ISO "YYYY-MM-DD".
            const isoDate = g.date
                ? g.date.split("/").reverse().join("-")
                : null;
            return {
                // Meme decoupage que la GradeCard : intitule en titre, type
                // de note en badge a cote.
                subject: g.name || g.code,
                badge: badgeLabel(g.code),
                value,
                scale,
                classAvg,
                coefficient,
                date: isoDate,
            };
        });

    const subjects = bySubject
        .filter((s) => s.student !== null || s.class !== null)
        .map((s) => ({
            subject: subjectLabel(s.labelKey, s.labelKey),
            student: s.student,
            class: s.class,
        }));

    return {
        scale: 20,
        overallStudent: overall.student,
        overallClass: overall.class,
        evolution,
        recent,
        bySubject: subjects,
    };
}

/**
 * Pousse la synthese des notes au widget Android.
 *
 * Appele avec les notes fraiches par la page notes, et sans argument par
 * l'accueil — celui-ci relit alors le cache persiste au lieu de declencher une
 * requete Aurion. Sans ca le widget ne se mettait a jour qu'en ouvrant
 * /grades, et gardait indefiniment un payload d'une version precedente.
 */
export function useWidgetGradesSync(grades?: Grade[]) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const isRestoring = useIsRestoring();

    useEffect(() => {
        // Hors shell Android, personne ne lira le payload : on evite le
        // calcul complet des moyennes et de leur evolution.
        if (!hasWidgetPlugin()) return;
        const source =
            grades ?? queryClient.getQueryData<Grade[]>(["grades"]) ?? [];
        if (source.length === 0) return;
        const subjectLabel = (code: string, fallback: string) => {
            const key = getGradeBadgeInfoFromCode(code)?.labelKey;
            return key ? t(key) : fallback;
        };
        const badgeLabel = (code: string) => {
            const key = getGradeBadgeInfoFromCode(code)?.labelKey;
            return key ? t(key) : null;
        };
        void pushWidgetGrades(
            buildWidgetGradesPayload(source, subjectLabel, badgeLabel)
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [grades, isRestoring]);
}
