/**
 * CS2-style rarity tiers mapped onto the /20 grading scale, from Consumer
 * Grade (grey) up to the gold "Exceedingly Rare" reserved for a near-perfect
 * grade. Used by the case-opening overlay (CS2 Grades Gambling).
 */

export const GRADE_SCALE = 20;

export type GradeRarity = {
    id: string;
    labelKey: string;
    /** Inclusive lower bound on the /20 scale */
    min: number;
    color: string;
    glow: string;
};

export const GRADE_RARITIES: GradeRarity[] = [
    {
        id: "consumer",
        labelKey: "gradesPage.rarity.consumer",
        min: 0,
        color: "#b0c3d9",
        glow: "rgba(176, 195, 217, 0.55)",
    },
    {
        id: "industrial",
        labelKey: "gradesPage.rarity.industrial",
        min: 8,
        color: "#5e98d9",
        glow: "rgba(94, 152, 217, 0.55)",
    },
    {
        id: "milspec",
        labelKey: "gradesPage.rarity.milspec",
        min: 10,
        color: "#4b69ff",
        glow: "rgba(75, 105, 255, 0.6)",
    },
    {
        id: "restricted",
        labelKey: "gradesPage.rarity.restricted",
        min: 12,
        color: "#8847ff",
        glow: "rgba(136, 71, 255, 0.6)",
    },
    {
        id: "classified",
        labelKey: "gradesPage.rarity.classified",
        min: 14,
        color: "#d32ce6",
        glow: "rgba(211, 44, 230, 0.6)",
    },
    {
        id: "covert",
        labelKey: "gradesPage.rarity.covert",
        min: 16,
        color: "#eb4b4b",
        glow: "rgba(235, 75, 75, 0.65)",
    },
    {
        id: "exceedingly-rare",
        labelKey: "gradesPage.rarity.exceedinglyRare",
        min: 18,
        color: "#e4ae39",
        glow: "rgba(228, 174, 57, 0.75)",
    },
];

export function parseGradeValue(raw?: string | null): number | null {
    if (!raw?.trim()) return null;
    const n = Number.parseFloat(raw.replace(",", "."));
    return Number.isNaN(n) ? null : n;
}

export function getRarityForGrade(value: number): GradeRarity {
    let rarity = GRADE_RARITIES[0]!;
    for (const tier of GRADE_RARITIES) {
        if (value >= tier.min) rarity = tier;
    }
    return rarity;
}

/** Plausible-looking filler grades: mostly average, rarely excellent. */
export function randomGradeValue(): number {
    const roll = Math.random();
    const range =
        roll < 0.12
            ? [2, 8]
            : roll < 0.75
              ? [8, 15]
              : roll < 0.96
                ? [15, 18]
                : [18, GRADE_SCALE];
    const [min, max] = range as [number, number];
    // Any decimal, not just .0 and .5: Aurion grades land anywhere
    return Math.round((min + Math.random() * (max - min)) * 10) / 10;
}

/** Reel values always carry one decimal, like "14.0" / "8.5". */
export function formatGradeValue(value: number): string {
    return value.toFixed(1);
}
