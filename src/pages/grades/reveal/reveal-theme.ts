import { Coins, Package, type LucideIcon } from "lucide-react";

import type { GradeRevealMode } from "@/lib/utils/experimental";

/**
 * Look of the unopened grade card for each reveal mode. The layout is shared,
 * only the accent, the icon and the call to action change.
 */
export type RevealCardTheme = {
    icon: LucideIcon;
    /** Animated background, defined in globals.css */
    caseClass: string;
    cornerClass: string;
    iconClass: string;
    valueClass: string;
    badgeClass: string;
    ctaClass: string;
    dateClass: string;
    ctaKey: string;
    ctaShortKey: string;
};

export const REVEAL_CARD_THEMES: Record<
    Exclude<GradeRevealMode, "off">,
    RevealCardTheme
> = {
    cs2: {
        icon: Package,
        caseClass: "cs2-case",
        cornerClass: "border-amber-400/70",
        iconClass: "text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.9)]",
        valueClass: "text-amber-300/80",
        badgeClass: "border-amber-400/60 text-amber-300",
        ctaClass: "bg-amber-400 text-zinc-950",
        dateClass: "text-amber-300/70",
        ctaKey: "gradesPage.clickToOpen",
        ctaShortKey: "gradesPage.clickToOpenShort",
    },
    fdj: {
        icon: Coins,
        caseClass: "fdj-case",
        cornerClass: "border-zinc-200/70",
        iconClass: "text-zinc-100 drop-shadow-[0_0_8px_rgba(226,232,240,0.85)]",
        valueClass: "text-zinc-200/80",
        badgeClass: "border-zinc-200/60 text-zinc-100",
        ctaClass: "bg-zinc-100 text-zinc-950",
        dateClass: "text-zinc-200/70",
        ctaKey: "gradesPage.clickToScratch",
        ctaShortKey: "gradesPage.clickToScratchShort",
    },
};
