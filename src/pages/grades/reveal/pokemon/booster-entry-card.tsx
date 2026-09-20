import { motion } from "framer-motion";
import { ChevronsRight, PlayingCardsFan } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Card } from "@/components/ui/card";
import { fadeInIndexed } from "@/lib/motion";

const MotionCard = motion(Card);

// Pokemon theme accent, mirroring the REVEAL_CARD_THEMES pattern used by
// the CS2 and FDJ unopened-grade cards.
const POKE_CORNER = "border-amber-200/70";
const POKE_CORNER_EMPTY = "border-zinc-600/70";
const POKE_ICON = "text-amber-300 drop-shadow-[0_0_8px_rgba(252,211,77,0.9)]";
const POKE_CTA =
    "bg-gradient-to-b from-amber-200 to-amber-400 text-indigo-950 shadow-[0_1px_0_rgba(255,255,255,0.5)_inset,0_2px_6px_rgba(0,0,0,0.45)]";
const POKE_DATE =
    "bg-black/40 text-amber-100 shadow-[0_0_0_1px_rgba(252,211,77,0.25)_inset]";

/**
 * Stands in for every unopened grade in the list: in booster mode the grades
 * themselves stay hidden until they are pulled out of a pack. Same layout as
 * the CS2/FDJ unopened-grade cards, dressed in the Pokemon theme.
 */
export function BoosterEntryCard({
    count,
    onOpen,
}: {
    count: number;
    onOpen: () => void;
}) {
    const { t } = useTranslation();
    const empty = count === 0;

    return (
        <MotionCard
            layout
            variants={fadeInIndexed}
            custom={0}
            initial="hidden"
            animate="show"
            exit="exit"
            className={`reveal-card relative border-none bg-white p-4 shadow-md dark:bg-mauria-card h-full overflow-visible ${
                empty
                    ? "cursor-not-allowed opacity-60"
                    : "cursor-pointer transition-transform duration-150 hover:-translate-y-0.5"
            }`}
            onClick={empty ? undefined : onOpen}
        >
            <div
                className={`pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] ${
                    empty ? "poke-entry-empty" : "poke-entry-foil"
                }`}
            >
                <span
                    className={`absolute left-1 top-1 size-2.5 rounded-tl-sm border-l-2 border-t-2 ${empty ? POKE_CORNER_EMPTY : POKE_CORNER}`}
                />
                <span
                    className={`absolute right-1 top-1 size-2.5 rounded-tr-sm border-r-2 border-t-2 ${empty ? POKE_CORNER_EMPTY : POKE_CORNER}`}
                />
                <span
                    className={`absolute bottom-1 left-1 size-2.5 rounded-bl-sm border-b-2 border-l-2 ${empty ? POKE_CORNER_EMPTY : POKE_CORNER}`}
                />
                <span
                    className={`absolute bottom-1 right-1 size-2.5 rounded-br-sm border-b-2 border-r-2 ${empty ? POKE_CORNER_EMPTY : POKE_CORNER}`}
                />
            </div>
            <div className="relative flex items-center">
                <div className="mr-4 flex w-20 items-center justify-center">
                    <PlayingCardsFan
                        className={
                            empty
                                ? "size-8 text-zinc-400"
                                : `reveal-icon size-8 ${POKE_ICON}`
                        }
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex-1 min-w-0 truncate text-lg font-medium text-white">
                        {t(
                            empty
                                ? "gradesPage.booster.empty"
                                : "gradesPage.booster.openPack"
                        )}
                    </div>
                    <div className="flex h-5 items-center justify-between gap-2 text-sm text-zinc-500">
                        {empty ? (
                            <span className="min-w-0 truncate font-mono text-[11px] uppercase tracking-wide text-zinc-400">
                                {t("gradesPage.booster.emptyHint")}
                            </span>
                        ) : (
                            <>
                                <span
                                    className={`inline-flex h-5 shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-[10px] font-extrabold uppercase leading-none tracking-wide ${POKE_CTA}`}
                                >
                                    <ChevronsRight className="size-3 shrink-0 animate-pulse" />
                                    {t("gradesPage.booster.tapToOpen")}
                                </span>
                                <p
                                    className={`inline-flex h-5 min-w-0 shrink items-center truncate rounded-full px-2 font-mono text-[11px] font-semibold uppercase leading-none tracking-wide ${POKE_DATE}`}
                                >
                                    {/* No room for the full wording next to
                                        the CTA on a phone */}
                                    <span className="truncate sm:hidden">
                                        {t(
                                            "gradesPage.booster.remainingShort",
                                            { count }
                                        )}
                                    </span>
                                    <span className="hidden truncate sm:inline">
                                        {t("gradesPage.booster.remaining", {
                                            count,
                                        })}
                                    </span>
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </MotionCard>
    );
}
