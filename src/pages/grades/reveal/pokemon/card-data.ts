import {
    Atom,
    Brain,
    Cpu,
    Dumbbell,
    FolderKanban,
    Languages,
    ShieldCheck,
    Sparkles,
    Waves,
    Wrench,
    type LucideIcon,
} from "lucide-react";

import type { Grade } from "@/types/aurion";
import { getGradeBadgeInfoFromCode } from "@/lib/utils/grades";
import { parseGradeValue } from "@/lib/utils/grade-rarity";

/**
 * Card treatments, from the bulk of a booster up to the chase card.
 * "common"/"uncommon" are the duplicates pulled from the collection, the four
 * others are what a freshly published grade can hit.
 */
export const CARD_TREATMENTS = [
    "common",
    "uncommon",
    "holo",
    "ex",
    "ar",
    "sir",
] as const;

export type CardTreatment = (typeof CARD_TREATMENTS)[number];

/** A full-art treatment spills the illustration over the whole card */
export const isFullArt = (treatment: CardTreatment): boolean =>
    treatment === "ar" || treatment === "sir";

export type SubjectCard = {
    id: string;
    icon: LucideIcon;
    /** Energy type printed on the card, as a locale key */
    typeKey: string;
    weaknessKey: string;
    resistanceKey: string;
    /** Frame, art and energy colors */
    accent: string;
    light: string;
    dark: string;
};

const FALLBACK_SUBJECT: SubjectCard = {
    id: "unknown",
    icon: Sparkles,
    typeKey: "gradesPage.booster.types.colorless",
    weaknessKey: "gradesPage.booster.types.fighting",
    resistanceKey: "gradesPage.booster.types.psychic",
    accent: "#9ca3af",
    light: "#e5e7eb",
    dark: "#4b5563",
};

const SUBJECT_CARDS: Record<string, SubjectCard> = {
    maths: {
        id: "maths",
        icon: Brain,
        typeKey: "gradesPage.booster.types.psychic",
        weaknessKey: "gradesPage.booster.types.darkness",
        resistanceKey: "gradesPage.booster.types.fighting",
        accent: "#a855f7",
        light: "#e9d5ff",
        dark: "#6b21a8",
    },
    physics: {
        id: "physics",
        icon: Atom,
        typeKey: "gradesPage.booster.types.lightning",
        weaknessKey: "gradesPage.booster.types.fighting",
        resistanceKey: "gradesPage.booster.types.metal",
        accent: "#f59e0b",
        light: "#fde68a",
        dark: "#b45309",
    },
    computerScience: {
        id: "computerScience",
        icon: Cpu,
        typeKey: "gradesPage.booster.types.metal",
        weaknessKey: "gradesPage.booster.types.fire",
        resistanceKey: "gradesPage.booster.types.grass",
        accent: "#06b6d4",
        light: "#a5f3fc",
        dark: "#0e7490",
    },
    english: {
        id: "english",
        icon: Waves,
        typeKey: "gradesPage.booster.types.water",
        weaknessKey: "gradesPage.booster.types.lightning",
        resistanceKey: "gradesPage.booster.types.metal",
        accent: "#3b82f6",
        light: "#bfdbfe",
        dark: "#1d4ed8",
    },
    sii: {
        id: "sii",
        icon: Wrench,
        typeKey: "gradesPage.booster.types.fighting",
        weaknessKey: "gradesPage.booster.types.psychic",
        resistanceKey: "gradesPage.booster.types.darkness",
        accent: "#ea580c",
        light: "#fed7aa",
        dark: "#9a3412",
    },
    fhs: {
        id: "fhs",
        icon: Sparkles,
        typeKey: "gradesPage.booster.types.fairy",
        weaknessKey: "gradesPage.booster.types.metal",
        resistanceKey: "gradesPage.booster.types.darkness",
        accent: "#ec4899",
        light: "#fbcfe8",
        dark: "#9d174d",
    },
    eps: {
        id: "eps",
        icon: Dumbbell,
        typeKey: "gradesPage.booster.types.grass",
        weaknessKey: "gradesPage.booster.types.fire",
        resistanceKey: "gradesPage.booster.types.water",
        accent: "#22c55e",
        light: "#bbf7d0",
        dark: "#15803d",
    },
    lv2: {
        id: "lv2",
        icon: Languages,
        typeKey: "gradesPage.booster.types.dragon",
        weaknessKey: "gradesPage.booster.types.dragon",
        resistanceKey: "gradesPage.booster.types.fairy",
        accent: "#6366f1",
        light: "#c7d2fe",
        dark: "#3730a3",
    },
    tipe: {
        id: "tipe",
        icon: FolderKanban,
        typeKey: "gradesPage.booster.types.colorless",
        weaknessKey: "gradesPage.booster.types.fighting",
        resistanceKey: "gradesPage.booster.types.psychic",
        accent: "#64748b",
        light: "#e2e8f0",
        dark: "#334155",
    },
    pix: {
        id: "pix",
        icon: ShieldCheck,
        typeKey: "gradesPage.booster.types.darkness",
        weaknessKey: "gradesPage.booster.types.grass",
        resistanceKey: "gradesPage.booster.types.psychic",
        accent: "#71717a",
        light: "#d4d4d8",
        dark: "#27272a",
    },
};

export type BoosterAttack = {
    nameKey: string;
    cost: number;
    damage: number;
};

export type BoosterCard = {
    grade: Grade;
    /** Freshly published grade (the chase cards) vs a collection duplicate */
    isNew: boolean;
    treatment: CardTreatment;
    subject: SubjectCard;
    subjectLabelKey: string;
    value: number | null;
    hp: number;
    attacks: BoosterAttack[];
    retreat: number;
    /** "042/250" */
    number: string;
    seed: number;
};

/** FNV-1a over the grade identity, so a card is always dealt the same way */
export const gradeSeed = (grade: Grade): number => {
    const input = [grade.date, grade.code, grade.name].join("|");
    let hash = 2166136261;
    for (let index = 0; index < input.length; index++) {
        hash ^= input.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
};

export const mulberry32 = (seed: number) => () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const subjectIdFromLabelKey = (labelKey: string | null | undefined): string =>
    labelKey?.split(".").pop() ?? "unknown";

/** Which subject a grade belongs to, as used to group the cards of a pack */
export const subjectIdOf = (grade: Grade): string =>
    subjectIdFromLabelKey(
        grade.code?.trim()
            ? getGradeBadgeInfoFromCode(grade.code)?.labelKey
            : null
    );

/**
 * Treatment straight from the grade, on the same /20 thresholds the CS2
 * case opening uses for its rarities: no roll, a given grade always prints
 * the same card. A duplicate is capped at the bulk treatments, so only a
 * freshly published grade can reach holo and above.
 */
const TREATMENT_TIERS: { min: number; treatment: CardTreatment }[] = [
    { min: 0, treatment: "common" },
    { min: 10, treatment: "uncommon" },
    { min: 12, treatment: "holo" },
    { min: 14, treatment: "ex" },
    { min: 16, treatment: "ar" },
    { min: 18, treatment: "sir" },
];

export const getTreatmentForGrade = (
    value: number | null,
    isNew: boolean
): CardTreatment => {
    const grade = value ?? 0;
    if (!isNew) return grade >= 14 ? "uncommon" : "common";

    let treatment: CardTreatment = "common";
    for (const tier of TREATMENT_TIERS) {
        if (grade >= tier.min) treatment = tier.treatment;
    }
    return treatment;
};

export function buildBoosterCard(grade: Grade, isNew: boolean): BoosterCard {
    const seed = gradeSeed(grade);
    const value = parseGradeValue(grade.grade);
    const labelKey = grade.code?.trim()
        ? (getGradeBadgeInfoFromCode(grade.code)?.labelKey ?? null)
        : null;
    const subjectId = subjectIdFromLabelKey(labelKey);
    const subject = SUBJECT_CARDS[subjectId] ?? FALLBACK_SUBJECT;
    const coefficient = Number.parseFloat(
        (grade.coefficient || "1").replace(",", ".")
    );
    const safeCoefficient = Number.isNaN(coefficient) ? 1 : coefficient;

    return {
        grade,
        isNew,
        treatment: getTreatmentForGrade(value, isNew),
        subject,
        subjectLabelKey: labelKey ?? "gradesPage.booster.unknownSubject",
        value,
        hp: Math.max(30, Math.round(value ?? 3) * 10),
        attacks: [
            {
                nameKey: `gradesPage.booster.subjects.${subject.id}.attack1`,
                cost: 1,
                damage: Math.max(10, Math.round(((value ?? 0) * 2) / 5) * 5),
            },
            {
                nameKey: `gradesPage.booster.subjects.${subject.id}.attack2`,
                cost: safeCoefficient >= 5 ? 3 : 2,
                damage: Math.max(20, Math.round((value ?? 0) / 2) * 10),
            },
        ],
        retreat: Math.min(3, Math.max(1, Math.round(safeCoefficient / 3))),
        number: `${String((seed % 250) + 1).padStart(3, "0")}/250`,
        seed,
    };
}
