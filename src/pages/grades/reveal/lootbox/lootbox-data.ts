import { parseGradeValue } from "@/lib/utils/grade-rarity";

/** Like the old Overwatch boxes, minus one: three drops, fewer if short */
export const ITEMS_PER_BOX = 3;

/** Overwatch's orange, for the UI chrome around the box */
export const OW_ORANGE = "#f99e1a";

export type LootRarity = {
    id: "common" | "rare" | "epic" | "legendary";
    labelKey: string;
    /** Inclusive lower bound on the /20 scale */
    min: number;
    color: string;
    glow: string;
};

/** The four Overwatch tiers mapped onto the /20 scale. */
export const LOOT_RARITIES: LootRarity[] = [
    {
        id: "common",
        labelKey: "gradesPage.lootbox.rarity.common",
        min: 0,
        color: "#e5e7eb",
        glow: "rgba(229, 231, 235, 0.55)",
    },
    {
        id: "rare",
        labelKey: "gradesPage.lootbox.rarity.rare",
        min: 10,
        color: "#3fa5ff",
        glow: "rgba(63, 165, 255, 0.65)",
    },
    {
        id: "epic",
        labelKey: "gradesPage.lootbox.rarity.epic",
        min: 13,
        color: "#c86bfa",
        glow: "rgba(200, 107, 250, 0.7)",
    },
    {
        id: "legendary",
        labelKey: "gradesPage.lootbox.rarity.legendary",
        min: 16,
        color: "#ffb33a",
        glow: "rgba(255, 179, 58, 0.8)",
    },
];

/** Unparseable grades fall back to common. */
export function getLootRarity(raw: string): LootRarity {
    const value = parseGradeValue(raw) ?? 0;
    let rarity = LOOT_RARITIES[0]!;
    for (const tier of LOOT_RARITIES) {
        if (value >= tier.min) rarity = tier;
    }
    return rarity;
}

/** Honeycomb tile, the backdrop of every Overwatch menu */
export const HEX_PATTERN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='42'%3E%3Cpath d='M12 0L24 7V21L12 28L0 21V7Z M12 28V42' fill='none' stroke='white' stroke-opacity='0.07'/%3E%3C/svg%3E")`;
