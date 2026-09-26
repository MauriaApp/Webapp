import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type CSSProperties,
    type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
    AnimatePresence,
    motion,
    useAnimationControls,
    useReducedMotion,
} from "framer-motion";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { Grade } from "@/types/aurion";
import { GRADE_SCALE } from "@/lib/utils/grade-rarity";
import { useGradeReveal } from "../use-grade-reveal";
import {
    HEX_PATTERN,
    ITEMS_PER_BOX,
    LOOT_RARITIES,
    OW_ORANGE,
    getLootRarity,
    type LootRarity,
} from "./lootbox-data";

const BOX_WIDTH = 150;
const BOX_HEIGHT = 92;
const BOX_DEPTH = 110;
const LID_HEIGHT = 24;
/** Box charging up, then the lid blows open, then the drops fly out */
const CHARGE_TIME = 1000;
const DROP_TIME = 1450;

type Phase = "idle" | "opening" | "items";

type LootItem = { grade: Grade; rarity: LootRarity };

const vibrate = (pattern: number | number[]) => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(pattern);
    }
};

const shuffle = <T,>(items: T[]): T[] => {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index--) {
        const swap = Math.floor(Math.random() * (index + 1));
        [copy[index], copy[swap]] = [copy[swap]!, copy[index]!];
    }
    return copy;
};

const rarityRank = (rarity: LootRarity) => LOOT_RARITIES.indexOf(rarity);

/** Gunmetal plating shared by every face of the box */
const PLATE: CSSProperties = {
    position: "absolute",
    background:
        "linear-gradient(180deg, #4a5366 0%, #2b313e 55%, #1c2029 100%)",
    boxShadow:
        "inset 0 0 0 2px rgba(255,255,255,0.14), inset 0 -10px 18px rgba(0,0,0,0.35)",
    backfaceVisibility: "hidden",
};

/** Split ring on the front of the box: a nod to the Overwatch emblem */
function Emblem({ size, color }: { size: number; color: string }) {
    return (
        <span
            className="relative block rounded-full"
            style={{
                width: size,
                height: size,
                background:
                    "conic-gradient(from 205deg, #fff 0deg 140deg, transparent 140deg 180deg, #fff 180deg 320deg, transparent 320deg)",
                mask: "radial-gradient(circle, transparent 52%, #000 54%)",
                WebkitMask:
                    "radial-gradient(circle, transparent 52%, #000 54%)",
                filter: `drop-shadow(0 0 6px ${color})`,
            }}
        />
    );
}

/**
 * A real CSS 3D crate: five plated faces, a glowing interior and a hinged
 * lid. `color` lights the seams, `open` swings the lid back.
 */
function LootBox3D({ color, open }: { color: string; open: boolean }) {
    const half = BOX_DEPTH / 2;
    const seam = `inset 0 3px 0 ${color}, inset 0 8px 14px -6px ${color}`;

    return (
        <div
            className="relative"
            style={{
                width: BOX_WIDTH,
                height: BOX_HEIGHT,
                transformStyle: "preserve-3d",
            }}
        >
            {/* Front: orange band, white trim, emblem */}
            <div
                style={{
                    ...PLATE,
                    width: BOX_WIDTH,
                    height: BOX_HEIGHT,
                    transform: `translateZ(${half}px)`,
                }}
            >
                <span
                    className="absolute inset-0"
                    style={{ boxShadow: seam }}
                />
                <span
                    className="absolute inset-x-0 bottom-3 h-2.5"
                    style={{
                        background: OW_ORANGE,
                        boxShadow: `0 0 10px ${OW_ORANGE}`,
                    }}
                />
                <span className="absolute inset-x-3 top-3 h-px bg-white/25" />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[60%]">
                    <Emblem size={40} color={color} />
                </span>
            </div>
            {/* Back */}
            <div
                style={{
                    ...PLATE,
                    width: BOX_WIDTH,
                    height: BOX_HEIGHT,
                    transform: `rotateY(180deg) translateZ(${half}px)`,
                }}
            />
            {/* Sides */}
            {[90, -90].map((angle) => (
                <div
                    key={angle}
                    style={{
                        ...PLATE,
                        width: BOX_DEPTH,
                        height: BOX_HEIGHT,
                        left: (BOX_WIDTH - BOX_DEPTH) / 2,
                        transform: `rotateY(${angle}deg) translateZ(${BOX_WIDTH / 2}px)`,
                    }}
                >
                    <span
                        className="absolute inset-0"
                        style={{ boxShadow: seam }}
                    />
                    <span
                        className="absolute inset-x-0 bottom-3 h-2.5"
                        style={{ background: OW_ORANGE }}
                    />
                </div>
            ))}
            {/* Bottom */}
            <div
                style={{
                    ...PLATE,
                    width: BOX_WIDTH,
                    height: BOX_DEPTH,
                    top: (BOX_HEIGHT - BOX_DEPTH) / 2,
                    transform: `rotateX(-90deg) translateZ(${BOX_HEIGHT / 2}px)`,
                }}
            />
            {/* Glowing interior, seen once the lid is up */}
            <div
                className="absolute"
                style={{
                    width: BOX_WIDTH - 8,
                    height: BOX_DEPTH - 8,
                    left: 4,
                    top: (BOX_HEIGHT - BOX_DEPTH) / 2 + 4,
                    transform: `rotateX(90deg) translateZ(${BOX_HEIGHT / 2 - 6}px)`,
                    background: `radial-gradient(circle, #fff 0%, ${color} 35%, #111 100%)`,
                }}
            />

            {/* Lid, hinged on its back bottom edge */}
            <motion.div
                className="absolute left-0"
                style={{
                    top: -LID_HEIGHT,
                    width: BOX_WIDTH,
                    height: LID_HEIGHT,
                    transformStyle: "preserve-3d",
                    originX: 0.5,
                    originY: 1,
                    originZ: -half,
                }}
                initial={false}
                animate={{ rotateX: open ? 118 : 0 }}
                transition={
                    open
                        ? { type: "spring", stiffness: 260, damping: 13 }
                        : { duration: 0 }
                }
            >
                {/* Top */}
                <div
                    style={{
                        ...PLATE,
                        width: BOX_WIDTH,
                        height: BOX_DEPTH,
                        top: (LID_HEIGHT - BOX_DEPTH) / 2,
                        transform: `rotateX(90deg) translateZ(${LID_HEIGHT / 2}px)`,
                        background:
                            "linear-gradient(135deg, #5a6479, #2f3542 60%, #22262f)",
                    }}
                >
                    <span className="absolute inset-4 rounded-sm border-2 border-white/20" />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                        <Emblem size={34} color={color} />
                    </span>
                </div>
                {/* Underside, lit by the loot */}
                <div
                    style={{
                        ...PLATE,
                        width: BOX_WIDTH,
                        height: BOX_DEPTH,
                        top: (LID_HEIGHT - BOX_DEPTH) / 2,
                        transform: `rotateX(-90deg) translateZ(${LID_HEIGHT / 2}px)`,
                        background: `radial-gradient(circle, ${color}, #1c2029 75%)`,
                    }}
                />
                {/* Rim */}
                <div
                    style={{
                        ...PLATE,
                        width: BOX_WIDTH,
                        height: LID_HEIGHT,
                        transform: `translateZ(${half}px)`,
                        background: "linear-gradient(180deg, #e5e7eb, #9ca3af)",
                        boxShadow: `inset 0 -3px 0 ${color}`,
                    }}
                />
                <div
                    style={{
                        ...PLATE,
                        width: BOX_WIDTH,
                        height: LID_HEIGHT,
                        transform: `rotateY(180deg) translateZ(${half}px)`,
                    }}
                />
                {[90, -90].map((angle) => (
                    <div
                        key={angle}
                        style={{
                            ...PLATE,
                            width: BOX_DEPTH,
                            height: LID_HEIGHT,
                            left: (BOX_WIDTH - BOX_DEPTH) / 2,
                            transform: `rotateY(${angle}deg) translateZ(${BOX_WIDTH / 2}px)`,
                            background:
                                "linear-gradient(180deg, #d1d5db, #8b929e)",
                            boxShadow: `inset 0 -3px 0 ${color}`,
                        }}
                    />
                ))}
            </motion.div>
        </div>
    );
}

/** Motes of light drifting up around the box */
function RisingMotes({ color, intense }: { color: string; intense: boolean }) {
    const motes = useMemo(
        () =>
            Array.from({ length: 16 }, () => ({
                left: 10 + Math.random() * 80,
                size: 2 + Math.random() * 3,
                duration: 1.8 + Math.random() * 1.8,
                delay: Math.random() * 2.5,
                drift: (Math.random() - 0.5) * 30,
            })),
        []
    );

    return (
        <div className="pointer-events-none absolute inset-x-0 bottom-6 top-0">
            {motes.map((mote, index) => (
                <motion.span
                    key={index}
                    className="absolute bottom-0 rounded-full"
                    style={{
                        left: `${mote.left}%`,
                        width: mote.size,
                        height: mote.size,
                        background: color,
                        boxShadow: `0 0 8px 2px ${color}`,
                    }}
                    animate={{
                        y: [0, -170],
                        x: [0, mote.drift],
                        opacity: [0, 1, 0],
                    }}
                    transition={{
                        duration: intense ? mote.duration / 2 : mote.duration,
                        delay: mote.delay,
                        repeat: Infinity,
                        ease: "easeOut",
                    }}
                />
            ))}
        </div>
    );
}

/** Streaks thrown off a card as it flips, more for the rarer tiers */
function RevealSparks({ rarity }: { rarity: LootRarity }) {
    const tier = rarityRank(rarity);
    const sparks = useMemo(
        () =>
            Array.from({ length: 6 + tier * 6 }, () => {
                const angle = Math.random() * Math.PI * 2;
                const distance = 60 + Math.random() * (40 + tier * 30);
                return {
                    x: Math.cos(angle) * distance,
                    y: Math.sin(angle) * distance,
                    size: 3 + Math.random() * 3,
                    duration: 0.6 + Math.random() * 0.4,
                };
            }),
        [tier]
    );

    return (
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-20">
            {sparks.map((spark, index) => (
                <motion.span
                    key={index}
                    className="absolute rounded-full"
                    style={{
                        width: spark.size,
                        height: spark.size,
                        background: index % 3 === 0 ? "#fff" : rarity.color,
                        boxShadow: `0 0 8px 2px ${rarity.glow}`,
                    }}
                    initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                    animate={{
                        x: spark.x,
                        y: spark.y,
                        opacity: 0,
                        scale: 0.3,
                    }}
                    transition={{ duration: spark.duration, ease: "easeOut" }}
                />
            ))}
        </div>
    );
}

function LootCard({
    item,
    index,
    revealed,
    instant,
    onReveal,
}: {
    item: LootItem;
    index: number;
    revealed: boolean;
    instant: boolean;
    onReveal: (index: number) => void;
}) {
    const { t } = useTranslation();
    const { delta, above, trendColor, subjectLabel } = useGradeReveal(
        item.grade
    );
    const { rarity } = item;
    const legendary = rarity.id === "legendary";

    return (
        <motion.div
            className="relative w-[28vw] max-w-[132px]"
            // Shot out of the box below, in a spray
            initial={
                instant
                    ? false
                    : {
                          y: 230,
                          x: (1 - index) * 40,
                          scale: 0.15,
                          opacity: 0,
                          rotate: (index - 1) * 25,
                      }
            }
            animate={{ y: 0, x: 0, scale: 1, opacity: 1, rotate: 0 }}
            transition={{
                type: "spring",
                stiffness: 150,
                damping: 15,
                delay: index * 0.14,
            }}
        >
            {/* Light shaft behind the drop, as tall as the rarity is high */}
            <motion.span
                className="pointer-events-none absolute bottom-1/2 left-1/2 w-3/4 -translate-x-1/2 blur-md"
                style={{
                    height: `${24 + rarityRank(rarity) * 12}vh`,
                    background: `linear-gradient(0deg, ${rarity.glow}, transparent)`,
                    transformOrigin: "bottom",
                }}
                animate={{
                    opacity: revealed ? 0.9 : 0.45,
                    scaleY: revealed ? 1 : 0.7,
                }}
                transition={{ duration: 0.5 }}
            />

            <button
                type="button"
                className="relative block aspect-[2/3] w-full outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                style={{ perspective: 800 }}
                disabled={revealed}
                onClick={(event) => {
                    event.stopPropagation();
                    onReveal(index);
                }}
            >
                <motion.div
                    className="absolute inset-0"
                    style={{ transformStyle: "preserve-3d" }}
                    initial={false}
                    animate={{ rotateY: revealed ? 180 : 0 }}
                    transition={
                        instant
                            ? { duration: 0 }
                            : { duration: 0.6, ease: [0.3, 1.4, 0.5, 1] }
                    }
                >
                    {/* Back: honeycomb, rarity glow, emblem */}
                    <motion.div
                        className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-lg"
                        style={{
                            backfaceVisibility: "hidden",
                            backgroundColor: "#121826",
                            backgroundImage: `${HEX_PATTERN}, radial-gradient(circle at 50% 45%, ${rarity.glow}, transparent 70%)`,
                            boxShadow: `inset 0 0 0 2px ${rarity.color}, 0 0 18px ${rarity.glow}`,
                        }}
                        animate={
                            revealed || instant
                                ? undefined
                                : {
                                      boxShadow: [
                                          `inset 0 0 0 2px ${rarity.color}, 0 0 10px ${rarity.glow}`,
                                          `inset 0 0 0 2px ${rarity.color}, 0 0 26px ${rarity.glow}`,
                                          `inset 0 0 0 2px ${rarity.color}, 0 0 10px ${rarity.glow}`,
                                      ],
                                  }
                        }
                        transition={{
                            duration: legendary ? 0.9 : 1.6,
                            repeat: Infinity,
                        }}
                    >
                        <Emblem size={44} color={rarity.color} />
                        <span
                            className="absolute inset-x-0 bottom-0 h-1.5"
                            style={{ background: rarity.color }}
                        />
                        {legendary && !instant && (
                            <span className="ow-card-shine pointer-events-none absolute inset-0" />
                        )}
                    </motion.div>

                    {/* Face: the grade itself */}
                    <div
                        className="absolute inset-0 flex flex-col items-center overflow-hidden rounded-lg px-2 pb-2.5 pt-2 text-center"
                        style={{
                            backfaceVisibility: "hidden",
                            transform: "rotateY(180deg)",
                            backgroundColor: "#0f1420",
                            backgroundImage: `${HEX_PATTERN}, linear-gradient(0deg, ${rarity.color}55, transparent 60%)`,
                            boxShadow: `inset 0 0 0 2px ${rarity.color}, 0 0 24px ${rarity.glow}`,
                        }}
                    >
                        <span
                            className="rounded-sm px-1.5 py-0.5 text-[9px] font-black uppercase italic tracking-wider text-zinc-950"
                            style={{ background: rarity.color }}
                        >
                            {t(rarity.labelKey)}
                        </span>
                        <div className="mt-auto flex items-baseline justify-center gap-0.5">
                            <span
                                className="font-mono text-2xl font-bold sm:text-3xl"
                                style={{
                                    color: rarity.color,
                                    textShadow: `0 0 14px ${rarity.glow}`,
                                }}
                            >
                                {item.grade.grade}
                            </span>
                            <span className="font-mono text-[10px] text-zinc-400">
                                {`/${GRADE_SCALE}`}
                            </span>
                        </div>
                        {delta !== null && (
                            <span
                                className="mt-0.5 inline-flex items-center gap-0.5 font-mono text-[10px] font-bold"
                                style={{ color: trendColor }}
                            >
                                {above ? (
                                    <ArrowUp className="size-3" />
                                ) : (
                                    <ArrowDown className="size-3" />
                                )}
                                {`${delta >= 0 ? "+" : "−"}${Math.abs(delta).toFixed(2)}`}
                            </span>
                        )}
                        <p className="mt-auto line-clamp-2 text-[10px] font-semibold leading-tight text-white">
                            {item.grade.name}
                        </p>
                        {subjectLabel && (
                            <p className="mt-0.5 truncate font-mono text-[8px] uppercase tracking-wider text-zinc-400">
                                {subjectLabel}
                            </p>
                        )}
                    </div>
                </motion.div>
            </button>

            {revealed && !instant && <RevealSparks rarity={rarity} />}
        </motion.div>
    );
}

/** Skewed call-to-action, in the Overwatch menu style */
function OwButton({
    children,
    onClick,
}: {
    children: ReactNode;
    onClick: () => void;
}) {
    return (
        <motion.button
            type="button"
            className="-skew-x-12 px-7 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-white"
            style={{
                background: OW_ORANGE,
                boxShadow: `0 0 24px ${OW_ORANGE}66`,
            }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={(event) => {
                event.stopPropagation();
                onClick();
            }}
        >
            <span className="block skew-x-12 text-sm font-black uppercase italic tracking-wider text-zinc-950">
                {children}
            </span>
        </motion.button>
    );
}

function Lootbox({
    unopened,
    onClose,
}: {
    unopened: Grade[];
    onClose: (opened: Grade[]) => void;
}) {
    const { t } = useTranslation();
    const instant = useReducedMotion() === true;

    // Drawn once per box: reopening the overlay rolls a new one
    const [items] = useState<LootItem[]>(() =>
        shuffle(unopened)
            .slice(0, ITEMS_PER_BOX)
            .map((grade) => ({ grade, rarity: getLootRarity(grade.grade) }))
    );
    const best = useMemo(
        () =>
            items.reduce<LootRarity>(
                (top, item) =>
                    rarityRank(item.rarity) > rarityRank(top)
                        ? item.rarity
                        : top,
                LOOT_RARITIES[0]!
            ),
        [items]
    );

    const [phase, setPhase] = useState<Phase>("idle");
    const [lidOpen, setLidOpen] = useState(false);
    const [revealed, setRevealed] = useState<boolean[]>(() =>
        items.map(() => false)
    );
    const [flashKey, setFlashKey] = useState(0);
    const stageControls = useAnimationControls();

    const allRevealed = revealed.every(Boolean);
    const remainingBoxes = Math.ceil(
        (unopened.length - items.length) / ITEMS_PER_BOX
    );

    // Only reachable once every drop is flipped
    const close = () => onClose(items.map((item) => item.grade));

    // Nothing to hand out (opened from a stale list): get out of the way
    useEffect(() => {
        if (items.length === 0) onClose([]);
    }, [items.length, onClose]);

    useEffect(() => {
        if (phase !== "opening") return;
        const timers = [
            window.setTimeout(() => {
                setLidOpen(true);
                setFlashKey((key) => key + 1);
                vibrate(best.id === "legendary" ? [30, 50, 60] : 30);
            }, CHARGE_TIME),
            window.setTimeout(() => setPhase("items"), DROP_TIME),
        ];
        return () => timers.forEach((timer) => window.clearTimeout(timer));
    }, [phase, best.id]);

    const open = () => {
        if (phase !== "idle") return;
        if (instant) {
            setLidOpen(true);
            setPhase("items");
            return;
        }
        vibrate(15);
        setPhase("opening");
    };

    const reveal = useCallback(
        (index: number) => {
            const item = items[index];
            if (!item || revealed[index]) return;
            setRevealed((previous) =>
                previous.map((isRevealed, card) => isRevealed || card === index)
            );
            if (instant) return;

            const tier = rarityRank(item.rarity);
            vibrate(tier >= 2 ? [20, 40, 40] : 12);
            if (tier >= 2) setFlashKey((key) => key + 1);
            if (item.rarity.id === "legendary") {
                void stageControls.start({
                    x: [0, -9, 9, -6, 6, -3, 3, 0],
                    transition: { duration: 0.5, ease: "easeOut" },
                });
            }
        },
        [items, revealed, instant, stageControls]
    );

    const boxColor = phase === "idle" ? OW_ORANGE : best.color;
    const boxGlow = phase === "idle" ? `${OW_ORANGE}88` : best.glow;

    return (
        <motion.div
            className="fixed inset-0 z-100 flex flex-col items-center overflow-hidden px-4"
            style={{
                paddingTop: "calc(var(--safe-area-top) + 12px)",
                paddingBottom: "calc(var(--safe-area-bottom) + 20px)",
                backgroundColor: "#070b14",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: "easeInOut" }}
        >
            {/* Menu backdrop: honeycomb over a cold blue haze */}
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    backgroundImage: `${HEX_PATTERN}, radial-gradient(ellipse at 50% 70%, #1d3557 0%, #0b1224 55%, #05070d 100%)`,
                }}
            />
            <div
                className="pointer-events-none absolute inset-0 transition-opacity duration-700"
                style={{
                    opacity: phase === "idle" ? 0.35 : 1,
                    background: `radial-gradient(ellipse at 50% 72%, ${boxGlow} -30%, transparent 55%)`,
                }}
            />
            <div
                className="pointer-events-none absolute inset-0"
                style={{ boxShadow: "inset 0 0 160px 40px rgba(0,0,0,0.85)" }}
            />

            <AnimatePresence>
                {flashKey > 0 && !instant && (
                    <motion.div
                        key={flashKey}
                        className="pointer-events-none absolute inset-0 z-40 bg-white"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.6, 0] }}
                        transition={{ duration: 0.55, times: [0, 0.12, 1] }}
                    />
                )}
            </AnimatePresence>

            <div className="relative w-full max-w-md text-center">
                <div>
                    <p
                        className="text-2xl font-black uppercase italic tracking-wide text-white"
                        style={{ textShadow: `0 0 18px ${OW_ORANGE}88` }}
                    >
                        {t("gradesPage.lootbox.boxName")}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-sky-200/70">
                        {remainingBoxes > 0
                            ? t("gradesPage.lootbox.boxesLeft", {
                                  count: remainingBoxes,
                              })
                            : t("gradesPage.lootbox.contents", {
                                  count: items.length,
                              })}
                    </p>
                </div>
            </div>

            <motion.div
                className="relative flex w-full max-w-md flex-1 flex-col items-center justify-center"
                animate={stageControls}
            >
                {/* The drops: one card per grade, fanned out above the box */}
                <div className="relative z-10 flex min-h-[42vw] items-end justify-center gap-3 sm:min-h-[198px]">
                    {phase === "items" &&
                        items.map((item, index) => (
                            <LootCard
                                key={index}
                                item={item}
                                index={index}
                                revealed={revealed[index]!}
                                instant={instant}
                                onReveal={reveal}
                            />
                        ))}
                </div>

                {/* Stage: pedestal, motes and the box itself */}
                <div className="relative mt-10 flex h-56 w-full items-end justify-center">
                    <RisingMotes color={boxColor} intense={phase !== "idle"} />

                    <div
                        className="absolute bottom-3 left-1/2 h-14 w-64 -translate-x-1/2 rounded-[50%] transition-shadow duration-500"
                        style={{
                            background:
                                "radial-gradient(ellipse, #2b3a55 0%, #121a2b 60%, transparent 72%)",
                            boxShadow: `0 0 40px -6px ${boxGlow}, inset 0 0 0 2px ${boxColor}55`,
                        }}
                    />

                    {/* Light column erupting from the open box */}
                    <AnimatePresence>
                        {lidOpen && !instant && (
                            <motion.span
                                key="column"
                                className="pointer-events-none absolute bottom-24 left-1/2 w-32 -translate-x-1/2 blur-md"
                                style={{
                                    height: "70vh",
                                    background: `linear-gradient(0deg, #fff, ${best.color} 20%, transparent)`,
                                    transformOrigin: "bottom",
                                    mixBlendMode: "screen",
                                }}
                                initial={{ scaleY: 0, opacity: 1 }}
                                animate={{
                                    scaleY: [0, 1, 1],
                                    opacity: [1, 0.9, 0.25],
                                }}
                                transition={{
                                    duration: 1.4,
                                    times: [0, 0.25, 1],
                                }}
                            />
                        )}
                    </AnimatePresence>

                    <motion.button
                        type="button"
                        aria-label={t("gradesPage.lootbox.open")}
                        className="relative mb-9 outline-none"
                        style={{ perspective: 900 }}
                        disabled={phase !== "idle"}
                        onClick={open}
                        animate={
                            phase === "items"
                                ? { y: 16, scale: 0.85, opacity: 0.55 }
                                : { y: 0, scale: 1, opacity: 1 }
                        }
                        transition={{ duration: 0.6, ease: "easeOut" }}
                    >
                        <motion.div
                            style={{
                                transformStyle: "preserve-3d",
                                rotateX: -20,
                            }}
                            animate={
                                instant
                                    ? { rotateY: -25 }
                                    : phase === "opening" && !lidOpen
                                      ? {
                                            rotateY: -25,
                                            y: -14,
                                            x: [0, -4, 4, -3, 3, 0],
                                        }
                                      : phase === "idle"
                                        ? {
                                              rotateY: [-35, -15, -35],
                                              y: [0, -8, 0],
                                              x: 0,
                                          }
                                        : { rotateY: -25, y: 0, x: 0 }
                            }
                            transition={
                                phase === "opening" && !lidOpen
                                    ? {
                                          x: {
                                              duration: 0.18,
                                              repeat: Infinity,
                                          },
                                          default: { duration: 0.3 },
                                      }
                                    : phase === "idle"
                                      ? {
                                            duration: 5,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                        }
                                      : {
                                            type: "spring",
                                            stiffness: 300,
                                            damping: 12,
                                        }
                            }
                        >
                            <LootBox3D color={boxColor} open={lidOpen} />
                        </motion.div>
                    </motion.button>
                </div>
            </motion.div>

            <div className="relative flex min-h-12 flex-col items-center justify-center gap-2">
                <AnimatePresence mode="wait">
                    {phase === "idle" && (
                        <OwButton key="open" onClick={open}>
                            {t("gradesPage.lootbox.open")}
                        </OwButton>
                    )}
                    {phase === "items" && !allRevealed && (
                        <motion.p
                            key="reveal"
                            className="font-mono text-[10px] uppercase tracking-[0.25em] text-sky-100/70"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            {t("gradesPage.lootbox.tapToReveal")}
                        </motion.p>
                    )}
                    {phase === "items" && allRevealed && (
                        <OwButton key="continue" onClick={close}>
                            {t("gradesPage.caseOpening.continue")}
                        </OwButton>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

export function LootboxOverlay({
    open,
    unopened,
    onClose,
}: {
    open: boolean;
    unopened: Grade[];
    onClose: (opened: Grade[]) => void;
}) {
    return createPortal(
        <AnimatePresence>
            {open && (
                <Lootbox key="lootbox" unopened={unopened} onClose={onClose} />
            )}
        </AnimatePresence>,
        document.body
    );
}
