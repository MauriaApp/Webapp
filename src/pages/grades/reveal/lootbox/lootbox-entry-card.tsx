import { motion } from "framer-motion";
import { Box, ChevronsRight } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Card } from "@/components/ui/card";
import { fadeInIndexed } from "@/lib/motion";
import { ITEMS_PER_BOX } from "./lootbox-data";

const MotionCard = motion(Card);

const OW_CORNER = "border-orange-300/70";
const OW_CORNER_EMPTY = "border-zinc-600/70";
const OW_ICON = "text-orange-400 drop-shadow-[0_0_8px_rgba(249,158,26,0.9)]";

/**
 * Stands in for every unopened grade in the list, like the booster entry: in
 * lootbox mode the grades stay hidden until they drop out of a box.
 */
export function LootboxEntryCard({
    count,
    onOpen,
}: {
    count: number;
    onOpen: () => void;
}) {
    const { t } = useTranslation();
    const empty = count === 0;
    const boxes = Math.ceil(count / ITEMS_PER_BOX);
    const corner = empty ? OW_CORNER_EMPTY : OW_CORNER;

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
                    empty ? "poke-entry-empty" : "ow-case"
                }`}
            >
                <span
                    className={`absolute left-1 top-1 size-2.5 rounded-tl-sm border-l-2 border-t-2 ${corner}`}
                />
                <span
                    className={`absolute right-1 top-1 size-2.5 rounded-tr-sm border-r-2 border-t-2 ${corner}`}
                />
                <span
                    className={`absolute bottom-1 left-1 size-2.5 rounded-bl-sm border-b-2 border-l-2 ${corner}`}
                />
                <span
                    className={`absolute bottom-1 right-1 size-2.5 rounded-br-sm border-b-2 border-r-2 ${corner}`}
                />
            </div>
            <div className="relative flex items-center">
                <div className="mr-4 w-20 items-center justify-center text-center">
                    <Box
                        className={
                            empty
                                ? "mx-auto size-8 text-zinc-400"
                                : `reveal-icon mx-auto size-8 ${OW_ICON}`
                        }
                    />
                    {!empty && (
                        <div className="font-mono text-sm font-bold italic leading-5 tracking-[0.2em] text-orange-200">
                            {t("gradesPage.lootbox.boxCount", {
                                count: boxes,
                            })}
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex-1 min-w-0 truncate text-lg font-black uppercase italic tracking-wide text-white">
                        {t(
                            empty
                                ? "gradesPage.lootbox.empty"
                                : "gradesPage.lootbox.openBox"
                        )}
                    </div>
                    <div className="flex h-5 items-center justify-between gap-2 text-sm text-zinc-500">
                        {empty ? (
                            <span className="min-w-0 truncate font-mono text-[11px] uppercase tracking-wide text-zinc-400">
                                {t("gradesPage.lootbox.emptyHint")}
                            </span>
                        ) : (
                            <>
                                <span className="inline-flex h-5 shrink-0 -skew-x-12 items-center bg-[#f99e1a] px-2.5 shadow-[0_0_12px_rgba(249,158,26,0.45)]">
                                    <span className="inline-flex skew-x-12 items-center gap-1 whitespace-nowrap text-[10px] font-black uppercase italic leading-none tracking-wide text-zinc-950">
                                        <ChevronsRight className="size-3 shrink-0 animate-pulse" />
                                        {t("gradesPage.lootbox.tapToOpen")}
                                    </span>
                                </span>
                                <p className="min-w-0 truncate font-mono text-[11px] uppercase tracking-wide text-sky-200/70">
                                    {/* No room for the full wording next to
                                        the CTA on a phone */}
                                    <span className="sm:hidden">
                                        {t(
                                            "gradesPage.lootbox.remainingShort",
                                            { count }
                                        )}
                                    </span>
                                    <span className="hidden sm:inline">
                                        {t("gradesPage.lootbox.remaining", {
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
