import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
} from "react";
import {
    AnimatePresence,
    animate,
    motion,
    useMotionValue,
    useReducedMotion,
    useTransform,
    useVelocity,
    type MotionValue,
} from "framer-motion";
import {
    ArrowDown,
    ArrowUp,
    Cherry,
    ChevronsDown,
    Equal,
    Plus,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { Grade } from "@/types/aurion";
import { Button } from "@/components/ui/button";
import {
    GRADE_RARITIES,
    GRADE_SCALE,
    getRarityForGrade,
    randomGradeValue,
    type GradeRarity,
} from "@/lib/utils/grade-rarity";
import { useGradeReveal } from "./use-grade-reveal";

const REEL_COUNT = 3;
const ROW_HEIGHT = 64;
/** Rows visible in each reel window, the payline runs through the middle one */
const VISIBLE_ROWS = 3;
/** Index of the winning value on each strip, one row is kept above it */
const WINNER_ROW = 2;
/** Top speed of every reel, in px/s */
const SPIN_SPEED = 2400;
const SPIN_UP = 0.35;
const SPIN_DOWN = 0.55;
/** When each reel locks, in seconds after the lever pull */
const STOP_TIMES = [1.6, 2.4, 3.2];
/** Extra suspense on the last reel before a big win */
const TENSION_TIME = 1.4;
const EASE_IN: [number, number, number, number] = [0.42, 0, 1, 1];
/** Lands a touch past the payline and settles back, like a reel in its notch */
const EASE_STOP: [number, number, number, number] = [0.3, 1.25, 0.6, 1];
/** Bézier slopes where each eased segment meets the cruise, so speeds match */
const EASE_IN_END_SLOPE = (1 - EASE_IN[1]) / (1 - EASE_IN[0]);
const EASE_STOP_START_SLOPE = EASE_STOP[1] / EASE_STOP[0];
const LEVER_LENGTH = 84;
const PLACEHOLDER = "–";

const vibrate = (pattern: number | number[]) => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(pattern);
    }
};

/** Each slot holds about a third of the grade: colour it on that share. */
const getSlotRarity = (value: number): GradeRarity =>
    getRarityForGrade(value * REEL_COUNT);

/** Same precision as the Aurion grade, at least one decimal, at most two. */
function countDecimals(raw: string): number {
    const digits = raw.trim().replace(",", ".").split(".")[1]?.length ?? 0;
    return Math.min(Math.max(digits, 1), 2);
}

/**
 * Three random-looking shares that add up exactly to the grade. Worked out in
 * integer steps of the grade's precision so no float drift ever shows.
 */
function splitGrade(value: number, decimals: number): number[] {
    const unit = 10 ** decimals;
    const total = Math.round(value * unit);
    // Never a lopsided 0 + 0 + 14: each share stays between ~1/6 and ~3/5
    const weights = Array.from(
        { length: REEL_COUNT },
        () => 0.5 + Math.random()
    );
    const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
    const steps = weights.map((weight) =>
        Math.floor((total * weight) / weightSum)
    );
    const rest = total - steps.reduce((sum, step) => sum + step, 0);
    steps[Math.floor(Math.random() * REEL_COUNT)]! += rest;
    return steps.map((step) => step / unit);
}

const randomSlotValue = (decimals: number): number => {
    const unit = 10 ** decimals;
    return Math.round((randomGradeValue() / REEL_COUNT) * unit) / unit;
};

type ReelPlan = {
    values: (number | null)[];
    endY: number;
    keyframes: number[];
    times: number[];
    duration: number;
};

/**
 * One strip per reel, long enough to scroll at full speed until its stop
 * time: spin up, cruise, then a short braking segment onto the winner.
 */
function planReel(
    stopTime: number,
    winner: number | null,
    decimals: number
): ReelPlan {
    const cruise = stopTime - SPIN_UP - SPIN_DOWN;
    const upDistance = (SPIN_SPEED * SPIN_UP) / EASE_IN_END_SLOPE;
    const downDistance = (SPIN_SPEED * SPIN_DOWN) / EASE_STOP_START_SLOPE;
    const rows = Math.round(
        (upDistance + SPIN_SPEED * cruise + downDistance) / ROW_HEIGHT
    );
    // The row at index k sits on the payline when y = -(k - 1) * ROW_HEIGHT
    const endY = -(WINNER_ROW - 1) * ROW_HEIGHT;
    const startY = endY - rows * ROW_HEIGHT;

    const values: (number | null)[] = Array.from(
        { length: WINNER_ROW + rows + 2 },
        () => randomSlotValue(decimals)
    );
    values[WINNER_ROW] = winner;

    return {
        values,
        endY,
        keyframes: [startY, startY + upDistance, endY - downDistance, endY],
        times: [0, SPIN_UP / stopTime, (stopTime - SPIN_DOWN) / stopTime, 1],
        duration: stopTime,
    };
}

function Bulbs({
    count,
    vertical = false,
    className = "",
}: {
    count: number;
    vertical?: boolean;
    className?: string;
}) {
    return (
        <div
            className={`pointer-events-none flex justify-between ${vertical ? "flex-col" : ""} ${className}`}
        >
            {Array.from({ length: count }, (_, index) => (
                <span key={index} className="slot-bulb size-1.5 rounded-full" />
            ))}
        </div>
    );
}

function ReelCell({
    value,
    decimals,
    won,
    dimmed,
}: {
    value: number | null;
    decimals: number;
    won: boolean;
    dimmed: boolean;
}) {
    const rarity = value === null ? GRADE_RARITIES[0]! : getSlotRarity(value);

    return (
        <div
            className="relative flex shrink-0 items-center justify-center transition-opacity duration-300"
            style={{ height: ROW_HEIGHT, opacity: dimmed ? 0.3 : 1 }}
        >
            <span
                className="absolute inset-x-3 bottom-2 h-[3px] rounded-full"
                style={{
                    background: rarity.color,
                    boxShadow: `0 0 8px ${rarity.glow}`,
                }}
            />
            <motion.span
                className="relative font-mono text-2xl font-bold sm:text-3xl"
                style={{
                    color: won ? rarity.color : "#f4f4f5",
                    textShadow: won ? `0 0 18px ${rarity.glow}` : "none",
                }}
                animate={won ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
            >
                {value === null ? PLACEHOLDER : value.toFixed(decimals)}
            </motion.span>
        </div>
    );
}

function Reel({
    index,
    plan,
    decimals,
    instant,
    started,
    locked,
    tension,
    onLocked,
}: {
    index: number;
    plan: ReelPlan;
    decimals: number;
    instant: boolean;
    started: boolean;
    locked: boolean;
    tension: boolean;
    onLocked: (index: number) => void;
}) {
    const y = useMotionValue(instant ? plan.endY : plan.keyframes[0]!);
    // Motion blur that follows the actual speed, so it fades while braking
    const velocity = useVelocity(y);
    const filter = useTransform(
        velocity,
        (speed) => `blur(${Math.min(Math.abs(speed) / 1400, 2).toFixed(2)}px)`
    );
    const winner = plan.values[WINNER_ROW] ?? null;
    const rarity = winner === null ? GRADE_RARITIES[0]! : getSlotRarity(winner);

    useEffect(() => {
        if (!started || instant) return;
        const controls = animate(y, plan.keyframes, {
            duration: plan.duration,
            times: plan.times,
            ease: [EASE_IN, "linear", EASE_STOP],
        });
        // A stopped animation still resolves: only a real stop locks the reel
        let cancelled = false;
        controls.then(() => {
            if (!cancelled) onLocked(index);
        });
        return () => {
            cancelled = true;
            controls.stop();
        };
    }, [started, instant, plan, y, index, onLocked]);

    return (
        <div
            className="relative flex-1 overflow-hidden rounded-md transition-shadow duration-300"
            style={{
                height: ROW_HEIGHT * VISIBLE_ROWS,
                background:
                    "linear-gradient(90deg, #07080c, #171b24 50%, #07080c)",
                boxShadow: locked
                    ? `inset 0 0 0 2px ${rarity.color}, 0 0 22px -2px ${rarity.glow}`
                    : "inset 0 0 0 1px rgba(255,255,255,0.06)",
            }}
        >
            <motion.div className="absolute inset-0" style={{ filter }}>
                <motion.div className="flex flex-col" style={{ y }}>
                    {plan.values.map((value, row) => (
                        <ReelCell
                            key={row}
                            value={value}
                            decimals={decimals}
                            won={locked && row === WINNER_ROW}
                            dimmed={locked && row !== WINNER_ROW}
                        />
                    ))}
                </motion.div>
            </motion.div>

            {/* Drum shading and a glass reflection on top */}
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background:
                        "linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 26%, transparent 40%, transparent 60%, rgba(0,0,0,0.3) 74%, rgba(0,0,0,0.9) 100%)",
                }}
            />
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background:
                        "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.08) 42%, transparent 55%)",
                }}
            />

            {tension && !locked && (
                <motion.div
                    className="pointer-events-none absolute inset-0 rounded-md"
                    style={{
                        boxShadow:
                            "inset 0 0 0 2px #fde047, inset 0 0 24px rgba(250,204,21,0.55)",
                    }}
                    animate={{ opacity: [0.25, 1, 0.25] }}
                    transition={{
                        duration: 0.45,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            )}

            <AnimatePresence>
                {locked && !instant && (
                    <motion.div
                        key="lock-flash"
                        className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2"
                        style={{
                            height: ROW_HEIGHT,
                            background: `linear-gradient(180deg, transparent, ${rarity.glow}, transparent)`,
                        }}
                        initial={{ opacity: 1, scaleY: 1.6 }}
                        animate={{ opacity: 0.35, scaleY: 1 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

/**
 * The side lever: drag the knob down past the pivot, or just tap it. The rod
 * swings towards the viewer, so the knob grows as it comes down.
 */
function Lever({
    disabled,
    label,
    pullRequest,
    onPull,
}: {
    disabled: boolean;
    label: string;
    /** Bumped from outside (the hint button) to pull the lever */
    pullRequest: number;
    onPull: () => void;
}) {
    const angle = useMotionValue(0);
    const pulling = useRef(false);
    const panned = useRef(false);
    const knobY = useTransform(angle, (a) => -LEVER_LENGTH * Math.cos(a));
    const knobScale = useTransform(angle, (a) => 1 + 0.3 * Math.sin(a));
    const rodTop = useTransform(knobY, (y) => Math.min(0, y));
    const rodHeight = useTransform(knobY, (y) => Math.abs(y));

    const springBack = useCallback(
        () =>
            animate(angle, 0, { type: "spring", stiffness: 240, damping: 11 }),
        [angle]
    );

    const pull = useCallback(async () => {
        if (disabled || pulling.current) return;
        pulling.current = true;
        vibrate(15);
        await animate(angle, Math.PI * 0.94, {
            duration: 0.22,
            ease: "easeIn",
        });
        onPull();
        springBack();
    }, [angle, disabled, onPull, springBack]);

    useEffect(() => {
        if (pullRequest > 0) pull();
    }, [pullRequest, pull]);

    return (
        <div className="absolute inset-y-0 right-0 w-7">
            {/* Bracket bolted onto the cabinet side */}
            <div
                className="absolute left-0 top-1/2 h-14 w-5 -translate-y-1/2 rounded-r-lg"
                style={{
                    background:
                        "linear-gradient(90deg, #78350f, #fcd34d 45%, #b45309)",
                    boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.35)",
                }}
            />
            <div className="absolute left-4 top-1/2 size-0">
                <motion.div
                    className="absolute left-[-3px] w-[6px] rounded-full"
                    style={{
                        top: rodTop,
                        height: rodHeight,
                        background:
                            "linear-gradient(90deg, #52525b, #f4f4f5 45%, #3f3f46)",
                    }}
                />
                <span
                    className="absolute left-[-8px] top-[-8px] size-4 rounded-full"
                    style={{
                        background:
                            "radial-gradient(circle at 35% 30%, #fef3c7, #d97706 60%, #78350f)",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.7)",
                    }}
                />
                <motion.button
                    type="button"
                    aria-label={label}
                    disabled={disabled}
                    className="absolute left-[-18px] top-[-18px] size-9 touch-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-yellow-300 disabled:cursor-default"
                    style={{
                        y: knobY,
                        scale: knobScale,
                        background:
                            "radial-gradient(circle at 35% 30%, #ffe4e6, #f43f5e 32%, #9f1239 72%, #4c0519)",
                        boxShadow:
                            "0 4px 10px rgba(0,0,0,0.6), 0 0 16px rgba(244,63,94,0.45)",
                    }}
                    onClick={(event) => {
                        event.stopPropagation();
                        // A drag released too early must not pull on its click
                        if (panned.current) {
                            panned.current = false;
                            return;
                        }
                        pull();
                    }}
                    onPanStart={() => {
                        panned.current = true;
                    }}
                    onPan={(_, info) => {
                        if (disabled || pulling.current) return;
                        const travel = Math.min(
                            Math.max(info.offset.y, 0),
                            LEVER_LENGTH * 2
                        );
                        angle.set(Math.acos(1 - travel / LEVER_LENGTH));
                    }}
                    onPanEnd={(_, info) => {
                        if (disabled || pulling.current) return;
                        if (info.offset.y > LEVER_LENGTH) pull();
                        else springBack();
                    }}
                >
                    {!disabled && (
                        <motion.span
                            className="pointer-events-none absolute inset-0 rounded-full border-2 border-rose-400"
                            animate={{ scale: [1, 1.8], opacity: [0.7, 0] }}
                            transition={{
                                duration: 1.3,
                                repeat: Infinity,
                                ease: "easeOut",
                            }}
                        />
                    )}
                </motion.button>
            </div>
        </div>
    );
}

/** Random tumble on one axis, either direction */
const randomSpin = () =>
    (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 720);

const randomTumble = () => ({
    spinX: randomSpin(),
    spinY: randomSpin(),
    spinZ: randomSpin(),
});

/** Stacked discs: the coin keeps a body when seen edge-on */
function Coin3D({ size }: { size: number }) {
    const thickness = Math.max(3, size * 0.16);

    return (
        <>
            {[-0.5, -0.25, 0, 0.25, 0.5].map((offset) => {
                const face = offset === 0.5 || offset === -0.5;
                return (
                    <span
                        key={offset}
                        className="absolute inset-0 rounded-full"
                        style={{
                            transform: `translateZ(${offset * thickness}px)`,
                            background: face
                                ? "radial-gradient(circle at 32% 28%, #fffbeb, #fde047 30%, #eab308 62%, #a16207)"
                                : "#a16207",
                            boxShadow: face
                                ? "inset 0 0 0 2px rgba(161,98,7,0.55)"
                                : undefined,
                        }}
                    />
                );
            })}
        </>
    );
}

/** Coins spat out of the payline, then pulled down by gravity. */
function CoinBurst({ rarity }: { rarity: GradeRarity }) {
    const tier = GRADE_RARITIES.indexOf(rarity);

    const coins = useMemo(
        () =>
            Array.from({ length: 6 + tier * 4 }, () => {
                const angle =
                    -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.4;
                const speed = 110 + Math.random() * (70 + tier * 25);
                return {
                    dx: Math.cos(angle) * speed,
                    dy: Math.sin(angle) * speed,
                    size: 12 + Math.random() * 8,
                    ...randomTumble(),
                    duration: 1 + Math.random() * 0.5,
                    delay: Math.random() * 0.15,
                };
            }),
        [tier]
    );

    return (
        <div
            className="pointer-events-none absolute left-1/2 top-1/2 z-20"
            style={{ perspective: 700 }}
        >
            {coins.map((coin, index) => (
                <motion.span
                    key={index}
                    className="absolute block"
                    style={{
                        left: -coin.size / 2,
                        top: -coin.size / 2,
                        width: coin.size,
                        height: coin.size,
                        transformStyle: "preserve-3d",
                    }}
                    initial={{ x: 0, y: 0, opacity: 1 }}
                    animate={{
                        x: [0, coin.dx * 0.7, coin.dx],
                        y: [0, coin.dy * 0.8, coin.dy + 220],
                        rotateX: coin.spinX,
                        rotateY: coin.spinY,
                        rotateZ: coin.spinZ,
                        opacity: [1, 1, 0],
                    }}
                    transition={{
                        duration: coin.duration,
                        delay: coin.delay,
                        ease: "easeOut",
                    }}
                >
                    <Coin3D size={coin.size} />
                </motion.span>
            ))}
        </div>
    );
}

/** Big wins only: the whole screen rains coins. */
function CoinRain() {
    const coins = useMemo(
        () =>
            Array.from({ length: 30 }, () => ({
                left: Math.random() * 100,
                size: 14 + Math.random() * 12,
                drift: (Math.random() - 0.5) * 80,
                ...randomTumble(),
                duration: 1.6 + Math.random() * 1.1,
                delay: Math.random() * 0.9,
            })),
        []
    );

    return (
        <div
            className="pointer-events-none absolute inset-0 z-30 overflow-hidden"
            style={{ perspective: 700 }}
        >
            {coins.map((coin, index) => (
                <motion.span
                    key={index}
                    className="absolute top-0 block"
                    style={{
                        left: `${coin.left}%`,
                        width: coin.size,
                        height: coin.size,
                        transformStyle: "preserve-3d",
                    }}
                    initial={{ y: -40, x: 0 }}
                    animate={{
                        y: "110vh",
                        x: coin.drift,
                        rotateX: coin.spinX,
                        rotateY: coin.spinY,
                        rotateZ: coin.spinZ,
                    }}
                    transition={{
                        duration: coin.duration,
                        delay: coin.delay,
                        ease: "easeIn",
                    }}
                >
                    <Coin3D size={coin.size} />
                </motion.span>
            ))}
        </div>
    );
}

/** The running total under the reels, an old LED counter. */
function TotalDisplay({
    label,
    text,
    rarity,
}: {
    label: string;
    text: MotionValue<string> | string;
    rarity: GradeRarity | null;
}) {
    return (
        <div
            className="mt-3 flex items-center justify-between gap-3 rounded-lg px-3 py-1.5"
            style={{
                background: "#050505",
                boxShadow:
                    "inset 0 0 0 1px rgba(253,224,71,0.35), inset 0 2px 10px rgba(0,0,0,0.9)",
            }}
        >
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-yellow-200/70">
                <Equal className="size-3.5" />
                {label}
            </span>
            <div className="flex items-baseline gap-1">
                <motion.span
                    className="font-mono text-3xl font-bold tabular-nums transition-colors duration-300"
                    style={{
                        color: rarity?.color ?? "#71717a",
                        textShadow: rarity ? `0 0 14px ${rarity.glow}` : "none",
                    }}
                >
                    {text}
                </motion.span>
                <span className="font-mono text-sm text-zinc-500">
                    {`/${GRADE_SCALE}`}
                </span>
            </div>
        </div>
    );
}

/** Full-screen slot machine: three reels whose values add up to the grade. */
export function SlotMachine({
    grade,
    onClose,
}: {
    grade: Grade;
    onClose: () => void;
}) {
    const { t } = useTranslation();
    const instant = useReducedMotion() === true;
    const {
        value,
        rarity,
        bigWin,
        delta,
        above,
        trendColor,
        subjectLabel,
        dateLabel,
    } = useGradeReveal(grade);
    // Nothing to split for an unparseable grade: show it at once
    const skipSpin = instant || value === null;
    const decimals = countDecimals(grade.grade);

    const { parts, plans } = useMemo(() => {
        const parts = value === null ? null : splitGrade(value, decimals);
        const plans = STOP_TIMES.map((stopTime, index) =>
            planReel(
                index === REEL_COUNT - 1 && bigWin
                    ? stopTime + TENSION_TIME
                    : stopTime,
                parts?.[index] ?? null,
                decimals
            )
        );
        return { parts, plans };
    }, [value, decimals, bigWin]);

    const [pulled, setPulled] = useState(skipSpin);
    const [locked, setLocked] = useState<boolean[]>(() =>
        Array.from({ length: REEL_COUNT }, () => skipSpin)
    );
    const [revealed, setRevealed] = useState(skipSpin);
    const [pullRequest, setPullRequest] = useState(0);
    const allLocked = locked.every(Boolean);
    const spinning = pulled && !allLocked;

    const onPull = useCallback(() => setPulled(true), []);

    const onLocked = useCallback((index: number) => {
        vibrate(index === REEL_COUNT - 1 ? [30, 40, 70] : 25);
        setLocked((previous) =>
            previous.map((isLocked, reel) => isLocked || reel === index)
        );
    }, []);

    // Let the last reel settle before the payout
    useEffect(() => {
        if (!allLocked || revealed) return;
        const timeout = window.setTimeout(() => setRevealed(true), 250);
        return () => window.clearTimeout(timeout);
    }, [allLocked, revealed]);

    const lockedSum =
        parts?.reduce(
            (sum, part, index) => (locked[index] ? sum + part : sum),
            0
        ) ?? 0;
    const total = useMotionValue(skipSpin ? lockedSum : 0);
    const totalText = useTransform(total, (current) =>
        current.toFixed(decimals)
    );

    useEffect(() => {
        const controls = animate(total, lockedSum, {
            duration: skipSpin ? 0 : 0.5,
            ease: "easeOut",
        });
        return () => controls.stop();
    }, [total, lockedSum, skipSpin]);

    const anyLocked = locked.some(Boolean);
    const displayText =
        value === null
            ? grade.grade
            : anyLocked
              ? totalText
              : `--.${"-".repeat(decimals)}`;
    const tension = bigWin && pulled && locked.slice(0, -1).every(Boolean);

    return (
        <motion.div
            className="fixed inset-0 z-100 flex flex-col items-center justify-center overflow-hidden px-4"
            style={{
                paddingTop: "var(--safe-area-top)",
                paddingBottom: "var(--safe-area-bottom)",
                backgroundColor: "#0a0305",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: "easeInOut" }}
            onClick={revealed ? onClose : undefined}
        >
            {/* Casino carpet: diamond pattern under a warm spotlight */}
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    backgroundImage:
                        "repeating-linear-gradient(45deg, rgba(253,224,71,0.035) 0 1px, transparent 1px 22px), repeating-linear-gradient(-45deg, rgba(253,224,71,0.035) 0 1px, transparent 1px 22px), radial-gradient(ellipse at 50% 38%, #4a0d1c 0%, #16050a 58%, #070203 100%)",
                }}
            />
            <div
                className="pointer-events-none absolute inset-0 transition-opacity duration-700"
                style={{
                    opacity: revealed ? 1 : 0,
                    background: `radial-gradient(ellipse at center, ${rarity.glow} -45%, transparent 62%)`,
                }}
            />
            <div
                className="pointer-events-none absolute inset-0"
                style={{ boxShadow: "inset 0 0 160px 40px rgba(0,0,0,0.9)" }}
            />

            <AnimatePresence>
                {revealed && !instant && (
                    <motion.div
                        key="flash"
                        className="pointer-events-none absolute inset-0 z-40 bg-white"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, bigWin ? 0.75 : 0.4, 0] }}
                        transition={{ duration: 0.6, times: [0, 0.1, 1] }}
                    />
                )}
            </AnimatePresence>
            {revealed && bigWin && !instant && <CoinRain />}

            <motion.div
                className={`relative flex w-full max-w-md flex-col items-center ${spinning || revealed ? "slot-bulbs-fast" : ""}`}
                style={
                    {
                        "--bulb-color": revealed ? rarity.color : undefined,
                    } as CSSProperties
                }
                animate={
                    revealed && bigWin && !instant
                        ? { x: [0, -10, 10, -7, 7, -3, 3, 0] }
                        : { x: 0 }
                }
                transition={{ duration: 0.55, ease: "easeOut" }}
            >
                <div className="relative w-full px-7">
                    {/* Cabinet: gold trim around a lacquered red body */}
                    <div
                        className="rounded-[28px] p-[3px]"
                        style={{
                            background:
                                "linear-gradient(160deg, #fef3c7, #b45309 30%, #fcd34d 55%, #78350f 85%, #fbbf24)",
                            boxShadow:
                                "0 20px 60px -10px rgba(0,0,0,0.9), 0 0 40px -8px rgba(244,63,94,0.35)",
                        }}
                    >
                        <div
                            className="relative rounded-[25px] px-4 pb-4 pt-3"
                            style={{
                                background:
                                    "radial-gradient(ellipse at 50% 0%, #7f1d1d 0%, #3b0a12 45%, #1a0509 100%)",
                            }}
                        >
                            <Bulbs
                                count={9}
                                vertical
                                className="absolute bottom-10 left-1.5 top-24"
                            />
                            <Bulbs
                                count={9}
                                vertical
                                className="absolute bottom-10 right-1.5 top-24"
                            />

                            <div
                                className="relative mb-4 overflow-hidden rounded-2xl px-4 py-4 text-center"
                                style={{
                                    background:
                                        "linear-gradient(180deg, #450a0a, #1c0509)",
                                    boxShadow:
                                        "inset 0 0 0 1px rgba(253,224,71,0.4), inset 0 -12px 24px rgba(0,0,0,0.5)",
                                }}
                            >
                                <Bulbs
                                    count={16}
                                    className="absolute inset-x-3 top-1.5"
                                />
                                <Bulbs
                                    count={16}
                                    className="absolute inset-x-3 bottom-1.5"
                                />
                                <div className="flex items-center justify-center gap-2">
                                    <Cherry className="reveal-icon size-5 shrink-0 text-rose-400 drop-shadow-[0_0_6px_rgba(244,63,94,0.9)]" />
                                    <p
                                        className="text-lg font-black uppercase italic tracking-[0.15em] text-yellow-300 sm:text-2xl"
                                        style={{
                                            textShadow:
                                                "0 0 6px #facc15, 0 0 18px #f43f5e, 0 2px 0 #9f1239",
                                        }}
                                    >
                                        {t(
                                            "gradesPage.slotMachine.machineName"
                                        )}
                                    </p>
                                    <Cherry className="reveal-icon size-5 shrink-0 text-rose-400 drop-shadow-[0_0_6px_rgba(244,63,94,0.9)]" />
                                </div>
                                <p className="mt-1 truncate text-sm font-medium text-rose-50/85">
                                    {grade.name}
                                </p>
                            </div>

                            <div
                                className="relative rounded-xl p-1.5"
                                style={{
                                    background:
                                        "linear-gradient(180deg, #0a0a0a, #1c1c1c)",
                                    boxShadow:
                                        "inset 0 0 0 1px rgba(253,224,71,0.5), inset 0 4px 12px rgba(0,0,0,0.9)",
                                }}
                            >
                                <div className="relative flex gap-1.5">
                                    {plans.map((plan, index) => (
                                        <Reel
                                            key={index}
                                            index={index}
                                            plan={plan}
                                            decimals={decimals}
                                            instant={skipSpin}
                                            started={pulled}
                                            locked={locked[index]!}
                                            tension={
                                                tension &&
                                                index === REEL_COUNT - 1
                                            }
                                            onLocked={onLocked}
                                        />
                                    ))}
                                    {revealed && !instant && (
                                        <CoinBurst rarity={rarity} />
                                    )}
                                </div>

                                {/* The shares add up: + between the reels */}
                                {[1, 2].map((gap) => (
                                    <span
                                        key={gap}
                                        className="absolute top-1/2 z-10 flex size-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-zinc-950 shadow-[0_0_8px_rgba(0,0,0,0.9)] ring-1 ring-yellow-300/70"
                                        style={{
                                            left: `${(gap * 100) / REEL_COUNT}%`,
                                        }}
                                    >
                                        <Plus className="size-3 text-yellow-200" />
                                    </span>
                                ))}

                                {/* Payline markers */}
                                <span
                                    className="absolute -left-[7px] top-1/2 size-0 -translate-y-1/2"
                                    style={{
                                        borderTop: "7px solid transparent",
                                        borderBottom: "7px solid transparent",
                                        borderLeft: "9px solid #f43f5e",
                                        filter: "drop-shadow(0 0 4px rgba(244,63,94,0.8))",
                                    }}
                                />
                                <span
                                    className="absolute -right-[7px] top-1/2 size-0 -translate-y-1/2"
                                    style={{
                                        borderTop: "7px solid transparent",
                                        borderBottom: "7px solid transparent",
                                        borderRight: "9px solid #f43f5e",
                                        filter: "drop-shadow(0 0 4px rgba(244,63,94,0.8))",
                                    }}
                                />

                                <AnimatePresence>
                                    {revealed && bigWin && !instant && (
                                        <motion.div
                                            key="jackpot"
                                            className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
                                            initial={{
                                                opacity: 0,
                                                scale: 0.3,
                                                rotate: -8,
                                            }}
                                            animate={{
                                                opacity: [0, 1, 1, 0],
                                                scale: [0.3, 1.15, 1, 1.3],
                                                rotate: -8,
                                            }}
                                            transition={{
                                                duration: 1.9,
                                                times: [0, 0.18, 0.8, 1],
                                            }}
                                        >
                                            <span
                                                className="rounded-lg bg-black/70 px-4 py-1 text-4xl font-black uppercase italic tracking-wider"
                                                style={{
                                                    color: rarity.color,
                                                    textShadow: `0 0 10px ${rarity.glow}, 0 0 28px ${rarity.glow}, 0 3px 0 #000`,
                                                    boxShadow: `inset 0 0 0 2px ${rarity.color}`,
                                                }}
                                            >
                                                {t(
                                                    "gradesPage.slotMachine.jackpot"
                                                )}
                                            </span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <TotalDisplay
                                label={t("gradesPage.slotMachine.total")}
                                text={displayText}
                                rarity={
                                    value === null
                                        ? null
                                        : anyLocked
                                          ? getRarityForGrade(lockedSum)
                                          : null
                                }
                            />
                        </div>
                    </div>

                    <Lever
                        disabled={pulled}
                        label={t("gradesPage.slotMachine.lever")}
                        pullRequest={pullRequest}
                        onPull={onPull}
                    />
                </div>

                <div className="relative mt-6 flex min-h-56 w-full flex-col items-center justify-start">
                    <AnimatePresence mode="wait">
                        {!revealed ? (
                            !pulled && (
                                <motion.button
                                    key="hint"
                                    type="button"
                                    className="flex items-center gap-2 rounded-full px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.25em] text-yellow-200"
                                    style={{
                                        boxShadow:
                                            "inset 0 0 0 1px rgba(253,224,71,0.4)",
                                    }}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    onClick={() =>
                                        setPullRequest((count) => count + 1)
                                    }
                                >
                                    <ChevronsDown className="size-4 animate-bounce" />
                                    {t("gradesPage.slotMachine.pullLever")}
                                </motion.button>
                            )
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
                                        backgroundColor: `${rarity.color}33`,
                                        boxShadow: `inset 0 0 0 1px ${rarity.color}`,
                                    }}
                                >
                                    {t(rarity.labelKey)}
                                </span>

                                <div className="flex items-baseline gap-1">
                                    <span
                                        className="font-mono text-6xl font-bold"
                                        style={{
                                            color: rarity.color,
                                            textShadow: `0 0 24px ${rarity.glow}`,
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
                                    className="mt-2 rounded-full bg-rose-500 px-6 font-bold uppercase tracking-wider text-white hover:bg-rose-400"
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
