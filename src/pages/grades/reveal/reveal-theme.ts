import { Cherry, Coins, Package, type LucideIcon } from "lucide-react";

/** The modes that dress up each unopened grade with its own card */
export type RevealCardMode = "cs2" | "fdj" | "slots";

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

export const REVEAL_CARD_THEMES: Record<RevealCardMode, RevealCardTheme> = {
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
        cornerClass: "border-amber-300/70",
        iconClass: "text-amber-300 drop-shadow-[0_0_8px_rgba(252,211,77,0.85)]",
        // The hidden grade sits under a strip of silver foil
        valueClass:
            "mt-1.5 rounded-sm bg-[linear-gradient(135deg,#9aa1ab,#eef1f5_45%,#b9c0c9_70%,#e3e7ec)] text-zinc-600 shadow-[0_1px_3px_rgba(0,0,0,0.4)]",
        badgeClass: "border-amber-300/60 text-amber-200",
        ctaClass: "bg-amber-400 text-emerald-950",
        dateClass: "text-emerald-100/70",
        ctaKey: "gradesPage.clickToScratch",
        ctaShortKey: "gradesPage.clickToScratchShort",
    },
    slots: {
        icon: Cherry,
        caseClass: "slots-case",
        cornerClass: "border-yellow-300/70",
        iconClass: "text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.9)]",
        valueClass: "text-yellow-200/80",
        badgeClass: "border-yellow-300/60 text-yellow-200",
        ctaClass: "bg-rose-500 text-white",
        dateClass: "text-yellow-200/70",
        ctaKey: "gradesPage.clickToSpin",
        ctaShortKey: "gradesPage.clickToSpinShort",
    },
};
