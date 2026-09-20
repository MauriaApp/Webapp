import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowUp, Package } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Grade } from "@/types/aurion";
import { Button } from "@/components/ui/button";
import {
    GRADE_RARITIES,
    GRADE_SCALE,
    formatGradeValue,
    getRarityForGrade,
    type GradeRarity,
} from "@/lib/utils/grade-rarity";
import { useGradeReveal } from "./use-grade-reveal";

const ITEM_WIDTH = 96;
const ITEM_GAP = 8;
const PITCH = ITEM_WIDTH + ITEM_GAP;
const REEL_LENGTH = 64;
const WINNER_INDEX = 58;
const SPIN_DURATION = 6.2;

type ReelItem = { value: number; rarity: GradeRarity };

const makeItem = (value: number): ReelItem => ({
    value,
    rarity: getRarityForGrade(value),
});

/** Plausible-looking filler grades: mostly average, rarely excellent. */
function randomGradeValue(): number {
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
    return Math.round((min + Math.random() * (max - min)) * 2) / 2;
}

/** The "0 – 8", "18 – 20" … span covered by each rarity tier. */
function rarityRange(index: number): string {
    const min = GRADE_RARITIES[index]!.min;
    const max = GRADE_RARITIES[index + 1]?.min ?? GRADE_SCALE;
    return `${min} – ${max}`;
}

const CornerBrackets = () => (
    <>
        <span className="pointer-events-none absolute left-0 top-0 size-3 rounded-tl-sm border-l-2 border-t-2 border-amber-400/70" />
        <span className="pointer-events-none absolute right-0 top-0 size-3 rounded-tr-sm border-r-2 border-t-2 border-amber-400/70" />
        <span className="pointer-events-none absolute bottom-0 left-0 size-3 rounded-bl-sm border-b-2 border-l-2 border-amber-400/70" />
        <span className="pointer-events-none absolute bottom-0 right-0 size-3 rounded-br-sm border-b-2 border-r-2 border-amber-400/70" />
    </>
);

function GradeReelItem({
    item,
    dimmed,
    won,
}: {
    item: ReelItem;
    dimmed: boolean;
    won: boolean;
}) {
    return (
        <div
            className="relative flex shrink-0 flex-col items-center justify-center overflow-hidden rounded-sm transition-all duration-300"
            style={{
                width: ITEM_WIDTH,
                height: 128,
                opacity: dimmed ? 0.25 : 1,
                transform: won ? "scale(1.06)" : undefined,
                background: `linear-gradient(180deg, #14161d 0%, #0b0d12 55%, ${item.rarity.color}33 100%)`,
                boxShadow: won
                    ? `inset 0 0 0 1px ${item.rarity.color}, inset 0 -3px 0 0 ${item.rarity.color}, 0 0 30px -4px ${item.rarity.glow}`
                    : `inset 0 -3px 0 0 ${item.rarity.color}`,
            }}
        >
            <span
                className="absolute inset-x-0 bottom-0 h-16 blur-lg"
                style={{ background: item.rarity.glow, opacity: 0.35 }}
            />
            <span className="relative font-mono text-3xl font-bold text-white">
                {formatGradeValue(item.value)}
            </span>
            <span className="relative font-mono text-[10px] tracking-widest text-zinc-500">
                {`/${GRADE_SCALE}`}
            </span>
        </div>
    );
}

function RarityLegend({ t }: { t: (key: string) => string }) {
    return (
        <div className="w-full max-w-2xl">
            <p className="mb-2 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
                {t("gradesPage.caseOpening.contains")}
            </p>
            <div className="flex items-end justify-center gap-1.5">
                {GRADE_RARITIES.map((rarity, index) => (
                    <div
                        key={rarity.id}
                        className="flex flex-1 flex-col items-center gap-1"
                    >
                        <span
                            className="h-1.5 w-full rounded-full"
                            style={{
                                backgroundColor: rarity.color,
                                boxShadow: `0 0 8px ${rarity.glow}`,
                            }}
                        />
                        <span className="font-mono text-[9px] tracking-tight text-zinc-500">
                            {rarityRange(index)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/** Full-screen CS2-style case opening for an unopened grade. */
export function CaseOpening({
    grade,
    onClose,
}: {
    grade: Grade;
    onClose: () => void;
}) {
    const { t } = useTranslation();
    const reducedMotion = useReducedMotion();
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);
    const [revealed, setRevealed] = useState(false);

    // Covert / gold get the full CS2 treatment: flash, rings and a shake
    const {
        value: wonValue,
        rarity: wonRarity,
        bigWin,
        delta,
        above,
        trendColor,
        subjectLabel,
        dateLabel,
    } = useGradeReveal(grade);

    const { items, jitter } = useMemo(() => {
        const reel = Array.from({ length: REEL_LENGTH }, () =>
            makeItem(randomGradeValue())
        );
        if (wonValue !== null) reel[WINNER_INDEX] = makeItem(wonValue);
        // Never land dead-center: CS2 always stops slightly off the ticker
        return {
            items: reel,
            jitter: Math.round((Math.random() - 0.5) * ITEM_WIDTH * 0.6),
        };
    }, [wonValue]);

    useLayoutEffect(() => {
        const measure = () =>
            setContainerWidth(containerRef.current?.offsetWidth ?? 0);
        measure();
        window.addEventListener("resize", measure);
        return () => window.removeEventListener("resize", measure);
    }, []);

    const targetX =
        -(WINNER_INDEX * PITCH + ITEM_WIDTH / 2 - containerWidth / 2) + jitter;
    const ready = containerWidth > 0;
    const spin = ready && !reducedMotion && wonValue !== null;

    // Nothing to spin for (unparseable grade or reduced motion): reveal at once
    useLayoutEffect(() => {
        if (ready && !spin) setRevealed(true);
    }, [ready, spin]);

    return (
        <motion.div
            className="fixed inset-0 z-100 flex flex-col items-center justify-center overflow-hidden px-6"
            style={{
                paddingTop: "var(--safe-area-top)",
                paddingBottom: "var(--safe-area-bottom)",
                backgroundColor: "#05070b",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: "easeInOut" }}
            onClick={revealed ? onClose : undefined}
        >
            {/* Case-opening backdrop: hatching, scanlines and a rarity glow */}
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    backgroundImage:
                        "repeating-linear-gradient(135deg, rgba(255,255,255,0.022) 0 8px, transparent 8px 16px), repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 4px), radial-gradient(ellipse at 50% 42%, #16202e 0%, #05070b 70%)",
                }}
            />
            <div
                className="pointer-events-none absolute inset-0 transition-opacity duration-700"
                style={{
                    opacity: revealed ? 1 : 0,
                    background: `radial-gradient(ellipse at center, ${wonRarity.glow} -45%, transparent 62%)`,
                }}
            />
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    boxShadow: "inset 0 0 160px 40px rgba(0,0,0,0.9)",
                }}
            />

            <AnimatePresence>
                {revealed && !reducedMotion && (
                    <motion.div
                        key="flash"
                        className="pointer-events-none absolute inset-0 bg-white"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, bigWin ? 0.75 : 0.4, 0] }}
                        transition={{ duration: 0.6, times: [0, 0.1, 1] }}
                    />
                )}
            </AnimatePresence>

            <motion.div
                className="relative flex w-full max-w-2xl flex-col items-center"
                animate={
                    revealed && bigWin && !reducedMotion
                        ? { x: [0, -9, 9, -6, 6, -3, 3, 0] }
                        : { x: 0 }
                }
                transition={{ duration: 0.5, ease: "easeOut" }}
            >
                <div className="relative mb-6 flex items-center gap-3 px-6 py-2">
                    <CornerBrackets />
                    <Package className="reveal-icon size-6 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.9)]" />
                    <div className="min-w-0">
                        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber-400/80">
                            {t("gradesPage.caseOpening.caseName")}
                        </p>
                        <p className="max-w-[60vw] truncate text-base font-medium text-white">
                            {grade.name}
                        </p>
                    </div>
                </div>

                <div className="relative w-full px-2 py-2">
                    <CornerBrackets />
                    {revealed &&
                        !reducedMotion &&
                        [0, 0.18].map((delay) => (
                            <motion.span
                                key={delay}
                                className="pointer-events-none absolute left-1/2 top-1/2 size-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
                                style={{ borderColor: wonRarity.color }}
                                initial={{ scale: 0.2, opacity: 0.9 }}
                                animate={{ scale: 7, opacity: 0 }}
                                transition={{
                                    duration: 1,
                                    delay,
                                    ease: "easeOut",
                                }}
                            />
                        ))}
                    <div
                        ref={containerRef}
                        className="relative w-full overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]"
                        style={{ height: 128 }}
                    >
                        {ready && (
                            <motion.div
                                className="flex h-full"
                                style={{ gap: ITEM_GAP }}
                                initial={{ x: 0 }}
                                animate={{ x: targetX }}
                                transition={
                                    spin
                                        ? {
                                              duration: SPIN_DURATION,
                                              ease: [0.08, 0.84, 0.12, 1],
                                          }
                                        : { duration: 0 }
                                }
                                onAnimationComplete={() => setRevealed(true)}
                            >
                                {items.map((item, index) => (
                                    <GradeReelItem
                                        key={index}
                                        item={item}
                                        won={revealed && index === WINNER_INDEX}
                                        dimmed={
                                            revealed && index !== WINNER_INDEX
                                        }
                                    />
                                ))}
                            </motion.div>
                        )}

                        {revealed && (
                            <motion.span
                                className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 blur-md"
                                style={{
                                    width: ITEM_WIDTH,
                                    background: `linear-gradient(180deg, transparent, ${wonRarity.glow}, transparent)`,
                                }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: [0, 0.9, 0.3] }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                            />
                        )}

                        <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-amber-400 shadow-[0_0_10px_2px_rgba(245,158,11,0.7)]" />
                        <div
                            className="pointer-events-none absolute left-1/2 top-0 size-0 -translate-x-1/2"
                            style={{
                                borderLeft: "6px solid transparent",
                                borderRight: "6px solid transparent",
                                borderTop: "9px solid #fbbf24",
                            }}
                        />
                        <div
                            className="pointer-events-none absolute bottom-0 left-1/2 size-0 -translate-x-1/2"
                            style={{
                                borderLeft: "6px solid transparent",
                                borderRight: "6px solid transparent",
                                borderBottom: "9px solid #fbbf24",
                            }}
                        />
                    </div>
                </div>

                <div className="relative mt-8 flex min-h-56 w-full flex-col items-center justify-start">
                    <AnimatePresence mode="wait">
                        {!revealed ? (
                            <motion.div
                                key="legend"
                                className="w-full"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <RarityLegend t={t} />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="reveal"
                                className="flex flex-col items-center gap-3"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.15 }}
                            >
                                <span
                                    className="rounded-sm px-3 py-1 font-mono text-xs font-bold uppercase tracking-[0.2em] text-white"
                                    style={{
                                        backgroundColor: `${wonRarity.color}33`,
                                        boxShadow: `inset 0 0 0 1px ${wonRarity.color}`,
                                    }}
                                >
                                    {t(wonRarity.labelKey)}
                                </span>

                                <div className="flex items-baseline gap-1">
                                    <span
                                        className="font-mono text-6xl font-bold"
                                        style={{
                                            color: wonRarity.color,
                                            textShadow: `0 0 24px ${wonRarity.glow}`,
                                        }}
                                    >
                                        {grade.grade}
                                    </span>
                                    <span className="font-mono text-xl text-zinc-500">
                                        {`/${GRADE_SCALE}`}
                                    </span>
                                </div>

                                {delta !== null && (
                                    <motion.div
                                        className="flex items-center gap-2 rounded-sm px-3 py-1.5"
                                        style={{
                                            backgroundColor: `${trendColor}1f`,
                                            boxShadow: `inset 0 0 0 1px ${trendColor}66`,
                                        }}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{
                                            duration: 0.35,
                                            delay: 0.35,
                                        }}
                                    >
                                        {above ? (
                                            <ArrowUp
                                                className="size-4"
                                                style={{ color: trendColor }}
                                            />
                                        ) : (
                                            <ArrowDown
                                                className="size-4"
                                                style={{ color: trendColor }}
                                            />
                                        )}
                                        <span
                                            className="font-mono text-[11px] font-bold uppercase tracking-wider"
                                            style={{ color: trendColor }}
                                        >
                                            {t(
                                                above
                                                    ? "gradesPage.caseOpening.aboveAverage"
                                                    : "gradesPage.caseOpening.belowAverage"
                                            )}
                                        </span>
                                        <span
                                            className="font-mono text-[11px] font-bold"
                                            style={{ color: trendColor }}
                                        >
                                            {`${delta >= 0 ? "+" : "−"}${Math.abs(delta).toFixed(2)}`}
                                        </span>
                                    </motion.div>
                                )}

                                <p className="font-mono text-xs uppercase tracking-wider text-zinc-500">
                                    {[subjectLabel, dateLabel]
                                        .filter(Boolean)
                                        .join(" — ")}
                                </p>

                                <Button
                                    className="mt-2 rounded-sm bg-amber-400 px-6 font-bold uppercase tracking-wider text-zinc-950 hover:bg-amber-300"
                                    onClick={onClose}
                                >
                                    {t("gradesPage.caseOpening.continue")}
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </motion.div>
    );
}
