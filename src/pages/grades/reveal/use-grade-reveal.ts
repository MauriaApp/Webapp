import { useMemo } from "react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

import type { Grade } from "@/types/aurion";
import { getGradeBadgeInfoFromCode } from "@/lib/utils/grades";
import { getDateLocale } from "@/lib/utils/translations";
import {
    getRarityForGrade,
    parseGradeValue,
    type GradeRarity,
} from "@/lib/utils/grade-rarity";

export type GradeReveal = {
    value: number | null;
    rarity: GradeRarity;
    /** Covert / gold: worth a flash, a shake and a louder glow */
    bigWin: boolean;
    /** Gap with the class average, null when Aurion gives no average */
    delta: number | null;
    above: boolean;
    trendColor: string;
    subjectLabel: string | null;
    dateLabel: string | null;
    /** Stable pseudo-random seed, so a grade always prints the same ticket */
    seed: number;
};

/** FNV-1a, enough to turn a grade key into a stable ticket number */
const hashKey = (input: string): number => {
    let hash = 2166136261;
    for (let index = 0; index < input.length; index++) {
        hash ^= input.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
};

/** Everything both reveal overlays need out of a raw Aurion grade. */
export function useGradeReveal(grade: Grade): GradeReveal {
    const { t, i18n } = useTranslation();

    return useMemo(() => {
        const value = parseGradeValue(grade.grade);
        const rarity = getRarityForGrade(value ?? 0);
        const average = parseGradeValue(grade.average);
        const delta =
            value !== null && average !== null ? value - average : null;
        const above = delta !== null && delta >= 0;
        const badgeInfo = grade.code?.trim()
            ? getGradeBadgeInfoFromCode(grade.code)
            : null;

        let dateLabel: string | null = null;
        if (grade.date) {
            const parsed = new Date(grade.date.split("/").reverse().join("-"));
            if (!Number.isNaN(parsed.getTime())) {
                dateLabel = format(parsed, "d MMM yyyy", {
                    locale: getDateLocale(i18n.language),
                });
            }
        }

        return {
            value,
            rarity,
            bigWin: rarity.id === "covert" || rarity.id === "exceedingly-rare",
            delta,
            above,
            trendColor: above ? "#22c55e" : "#ef4444",
            subjectLabel: badgeInfo?.labelKey ? t(badgeInfo.labelKey) : null,
            dateLabel,
            seed: hashKey([grade.date, grade.code, grade.name].join("|")),
        };
    }, [grade, t, i18n.language]);
}

/** "MAU-4821-0937", printed on the scratch ticket. */
export const formatTicketSerial = (seed: number): string =>
    `MAU-${String(seed % 10000).padStart(4, "0")}-${String(
        Math.floor(seed / 10000) % 10000
    ).padStart(4, "0")}`;
