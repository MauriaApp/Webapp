import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";

import type { Grade } from "@/types/aurion";
import { Button } from "@/components/ui/button";
import {
    buildBoosterCard,
    CARD_TREATMENTS,
    isFullArt,
    mulberry32,
    type BoosterCard,
} from "./card-data";
import { CardBack, PokemonCard } from "./pokemon-card";

export const MAX_CARDS_PER_PACK = 6;

type Phase = "pack" | "tearing" | "cards" | "summary";

const shuffle = <T,>(items: T[], random: () => number): T[] => {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index--) {
        const swap = Math.floor(random() * (index + 1));
        [copy[index], copy[swap]] = [copy[swap], copy[index]];
    }
    return copy;
};

/** Tilt + glare, driven straight through the DOM to stay smooth on mobile.
    The card keeps tracking the pointer even outside its box, with the effect
    damping to near-zero a short distance away. On touch devices the gyroscope
    drives the tilt instead of the pointer. */
function useCardTilt(disabled: boolean) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const node = ref.current;
        if (disabled || !node) return;

        const apply = (px: number, py: number, strength: number) => {
            const fromCenter = Math.min(
                Math.sqrt((px - 50) ** 2 + (py - 50) ** 2) / 50,
                1
            );
            const bgX = 37 + ((px / 100) * (63 - 37));
            const bgY = 33 + ((py / 100) * (67 - 33));
            node.style.setProperty("--pointer-x", `${px}%`);
            node.style.setProperty("--pointer-y", `${py}%`);
            node.style.setProperty(
                "--pointer-from-center",
                String(fromCenter)
            );
            node.style.setProperty("--pointer-from-top", String(py / 100));
            node.style.setProperty("--pointer-from-left", String(px / 100));
            node.style.setProperty("--background-x", `${bgX}%`);
            node.style.setProperty("--background-y", `${bgY}%`);
            node.style.setProperty("--card-opacity", String(strength));
            node.style.transform = `rotateY(${(px - 50) / 3.5}deg) rotateX(${
                (50 - py) / 3.5
            }deg)`;
        };

        const reset = () => {
            node.style.setProperty("--pointer-x", "50%");
            node.style.setProperty("--pointer-y", "50%");
            node.style.setProperty("--pointer-from-center", "0");
            node.style.setProperty("--pointer-from-top", "0.5");
            node.style.setProperty("--pointer-from-left", "0.5");
            node.style.setProperty("--background-x", "50%");
            node.style.setProperty("--background-y", "50%");
            node.style.setProperty("--card-opacity", "0");
            node.style.transform = "rotateY(0deg) rotateX(0deg)";
        };

        const onMove = (event: PointerEvent) => {
            const rect = node.getBoundingClientRect();
            const relX = (event.clientX - rect.left) / rect.width;
            const relY = (event.clientY - rect.top) / rect.height;
            const offX = Math.max(0, -relX, relX - 1);
            const offY = Math.max(0, -relY, relY - 1);
            const dist = Math.sqrt(offX * offX + offY * offY);
            const strength = 1 / (1 + dist * dist * 3);
            const px = 50 + (relX * 100 - 50) * strength;
            const py = 50 + (relY * 100 - 50) * strength;
            apply(px, py, strength);
        };

        // Gyroscope: rest position captured on first reading, then relative
        // tilt is mapped to the same px/py space the pointer uses.
        const LIMIT_G = 16;
        const LIMIT_B = 18;
        let baseSet = false;
        let baseGamma = 0;
        let baseBeta = 0;
        let gotOrient = false;

        const onOrient = (event: DeviceOrientationEvent) => {
            if (event.gamma == null || event.beta == null) return;
            if (!gotOrient) {
                gotOrient = true;
                // Gyro is live: drop the pointer fallback.
                window.removeEventListener("pointermove", onMove);
            }
            if (!baseSet) {
                baseSet = true;
                baseGamma = event.gamma;
                baseBeta = event.beta;
                return;
            }
            const g = Math.max(
                -LIMIT_G,
                Math.min(LIMIT_G, event.gamma - baseGamma)
            );
            const b = Math.max(
                -LIMIT_B,
                Math.min(LIMIT_B, event.beta - baseBeta)
            );
            const px = 50 + (g / LIMIT_G) * 50;
            const py = 50 + (b / LIMIT_B) * 50;
            apply(px, py, 1);
        };

        const addPointer = () => window.addEventListener("pointermove", onMove);
        const removePointer = () =>
            window.removeEventListener("pointermove", onMove);
        const addGyro = () =>
            window.addEventListener("deviceorientation", onOrient, true);
        const removeGyro = () =>
            window.removeEventListener("deviceorientation", onOrient, true);

        const coarse = window.matchMedia("(pointer: coarse)").matches;
        const gyroSupported = "DeviceOrientationEvent" in window;
        const useGyro = coarse && gyroSupported;

        let fallbackTimer: number | undefined;
        let cleanedUp = false;

        if (useGyro) {
            addGyro();
            // If no gyro reading arrives (permission denied, no sensor), fall
            // back to the pointer so the card never goes dead.
            fallbackTimer = window.setTimeout(() => {
                if (!cleanedUp && !gotOrient) addPointer();
            }, 1200);
        } else {
            addPointer();
        }

        return () => {
            cleanedUp = true;
            window.clearTimeout(fallbackTimer);
            removePointer();
            removeGyro();
            reset();
        };
    }, [disabled]);

    return { ref };
}

/**
 * iOS 13+ gates DeviceOrientationEvent behind a user gesture. Calling this
 * from the pack-tap (a real click) grants permission before any card mounts.
 * No-op on Android/desktop.
 */
function requestGyroPermission() {
    const DOE = window.DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<"granted" | "denied">;
    };
    if (DOE && typeof DOE.requestPermission === "function") {
        DOE.requestPermission().catch(() => {});
    }
}

function BoosterPack({
    accent,
    dark,
    tearing,
    onOpen,
}: {
    accent: string;
    dark: string;
    tearing: boolean;
    onOpen: () => void;
}) {
    const { t } = useTranslation();
    const reducedMotion = useReducedMotion();
    const foil = `linear-gradient(155deg, ${accent} 0%, ${dark} 45%, #09090b 100%)`;
    const glow = accent;

    // Sparkle burst from the tear point, reused across renders.
    const sparkles = useMemo(
        () =>
            Array.from({ length: 7 }, (_, index) => ({
                angle: (index / 7) * Math.PI * 2 + Math.random() * 0.4,
                distance: 40 + Math.random() * 70,
                delay: 0.2 + Math.random() * 0.15,
                size: 3 + Math.random() * 4,
            })),
        []
    );

    return (
        <motion.div
            initial={{ scale: 0.85, opacity: 0, rotate: -3 }}
            animate={
                tearing
                    ? reducedMotion
                        ? { scale: 0.9, opacity: 0, rotate: 0 }
                        : {
                              scale: [1, 1.03, 1.05, 1.02, 0.92, 0.86],
                              opacity: [1, 1, 1, 1, 0.85, 0],
                              rotate: [
                                  0,
                                  -1.5,
                                  1.5,
                                  -1,
                                  0.5,
                                  -2,
                              ],
                          }
                    : { scale: 1, opacity: 1, rotate: 0 }
            }
            transition={{
                duration: tearing ? 0.85 : 0.45,
                times: tearing && !reducedMotion
                    ? [0, 0.25, 0.4, 0.6, 0.8, 1]
                    : undefined,
                ease: "easeInOut",
            }}
        >
            <button
                type="button"
                className={`relative flex w-[15rem] max-w-[62vw] flex-col items-center justify-between rounded-[1.2rem] px-4 py-6 text-center active:scale-[0.97] ${
                    tearing ? "" : "poke-pack-float"
                }`}
                style={{
                    aspectRatio: "63 / 100",
                    background: foil,
                    boxShadow:
                        "0 1.5rem 3rem rgba(0,0,0,0.55), inset 0 0 0 2px rgba(255,255,255,0.18)",
                    overflow: tearing ? "visible" : "hidden",
                }}
                onClick={tearing ? undefined : onOpen}
            >
                {/* Foil sweep */}
                <span className="poke-pack-sheen pointer-events-none absolute inset-0 overflow-hidden rounded-[1.2rem]" />

                {/* Inner cavity revealed once the strip is torn off */}
                <motion.span
                    className="pointer-events-none absolute inset-x-0 top-0 h-[2.2rem]"
                    style={{
                        background:
                            "linear-gradient(180deg, #000 0%, rgba(0,0,0,0.6) 70%, transparent)",
                    }}
                    initial={{ opacity: 0 }}
                    animate={tearing ? { opacity: [0, 0, 1, 1] } : { opacity: 0 }}
                    transition={{
                        duration: 0.85,
                        times: [0, 0.25, 0.4, 1],
                        ease: "easeOut",
                    }}
                />

                {/* The strip that gets ripped off the top, peeling like foil */}
                <motion.span
                    className="pointer-events-none absolute inset-x-0 top-0 h-[2.2rem] rounded-t-[1.2rem] border-b-2 border-dashed border-white/35"
                    style={{ background: foil, transformOrigin: "top center" }}
                    animate={
                        tearing
                            ? {
                                  y: [0, -12, -120, -260],
                                  rotate: [0, -4, -12, -18],
                                  skewX: [0, -6, -12, -18],
                                  opacity: [1, 1, 0.7, 0],
                              }
                            : { y: 0, rotate: 0, skewX: 0, opacity: 1 }
                    }
                    transition={{
                        duration: 0.85,
                        times: [0, 0.2, 0.6, 1],
                        ease: ["easeInOut", "easeIn", "easeIn"],
                    }}
                />

                {/* Cone of light escaping the torn pack */}
                <motion.span
                    className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2"
                    style={{
                        width: "120%",
                        height: "14rem",
                        background: `radial-gradient(ellipse 50% 70% at 50% 0%, ${glow}cc, ${glow}55 35%, transparent 70%)`,
                        filter: "blur(2px)",
                        transformOrigin: "bottom center",
                        mixBlendMode: "screen",
                    }}
                    initial={{ scaleY: 0, opacity: 0 }}
                    animate={
                        tearing
                            ? {
                                  scaleY: [0, 1, 1.15, 0.9],
                                  opacity: [0, 1, 0.7, 0],
                              }
                            : { scaleY: 0, opacity: 0 }
                    }
                    transition={{
                        duration: 0.85,
                        times: [0, 0.3, 0.55, 1],
                        ease: "easeOut",
                    }}
                />

                {/* Sparkle burst from the tear point */}
                {tearing &&
                    !reducedMotion &&
                    sparkles.map((sparkle, index) => (
                        <motion.span
                            key={index}
                            className="pointer-events-none absolute left-1/2 top-[0.4rem] rounded-full bg-white"
                            style={{
                                width: sparkle.size,
                                height: sparkle.size,
                                boxShadow: `0 0 6px 2px ${glow}`,
                            }}
                            initial={{ x: 0, y: 0, opacity: 0, scale: 0.3 }}
                            animate={{
                                x: Math.cos(sparkle.angle) * sparkle.distance,
                                y: -Math.abs(
                                    Math.sin(sparkle.angle) * sparkle.distance
                                ),
                                opacity: [0, 1, 1, 0],
                                scale: [0.3, 1, 0.8, 0],
                            }}
                            transition={{
                                duration: 0.7,
                                times: [0, 0.25, 0.6, 1],
                                delay: sparkle.delay,
                                ease: "easeOut",
                            }}
                        />
                    ))}

                {/* Light escaping the pack once the seal is broken */}
                <motion.span
                    className="pointer-events-none absolute inset-x-6 top-[2.2rem] h-1 rounded-full bg-white blur-[2px]"
                    initial={{ opacity: 0, scaleX: 0.3 }}
                    animate={
                        tearing
                            ? { opacity: [0, 1, 0.6], scaleX: [0.3, 1.2, 1] }
                            : { opacity: 0, scaleX: 0.3 }
                    }
                    transition={{ duration: 0.6, delay: 0.2 }}
                />

                <span className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.35em] text-white/70">
                    {t("gradesPage.booster.tearHere")}
                </span>

                <span className="flex flex-col items-center gap-2">
                    <span
                        className="flex size-16 items-center justify-center rounded-full"
                        style={{
                            background:
                                "conic-gradient(from 210deg, #f8fafc 0deg 180deg, #ef4444 180deg 360deg)",
                            boxShadow:
                                "0 0 0 4px #09090b, 0 6px 18px rgba(0,0,0,0.6)",
                        }}
                    >
                        <span className="size-5 rounded-full bg-white shadow-[0_0_0_3px_#09090b]" />
                    </span>
                    <span className="text-xl font-black uppercase italic tracking-wider text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
                        {t("gradesPage.booster.packName")}
                    </span>
                    <span className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-white/75">
                        {t("gradesPage.booster.setName")}
                    </span>
                </span>

                <span className="rounded-full bg-white/15 px-3 py-1 font-mono text-[0.6rem] uppercase tracking-widest text-white">
                    {t("gradesPage.booster.tapToOpen")}
                </span>
            </button>
        </motion.div>
    );
}

function CardStage({
    card,
    faceUp,
    onTap,
}: {
    card: BoosterCard;
    faceUp: boolean;
    onTap: () => void;
}) {
    const reducedMotion = useReducedMotion();
    const tilt = useCardTilt(!faceUp);
    const width = Math.min(300, Math.round(window.innerWidth * 0.72));

    return (
        <div
            className="relative"
            style={{ perspective: 1200 }}
            onClick={onTap}
        >
            <div
                ref={tilt.ref}
                className="transition-transform duration-200 ease-out"
                style={{ transformStyle: "preserve-3d" }}
            >
                <motion.div
                    className="relative"
                    style={{ transformStyle: "preserve-3d", width }}
                    initial={{ rotateY: 180 }}
                    animate={{
                        rotateY: faceUp ? 0 : 180,
                        // The rarer the card, the harder it pops out
                        scale:
                            faceUp && !reducedMotion
                                ? [1, 1 + 0.025 * (tierOf(card) + 1), 1]
                                : 1,
                    }}
                    transition={{
                        rotateY: {
                            duration: reducedMotion ? 0 : 0.65,
                            ease: [0.2, 0.8, 0.2, 1],
                        },
                        scale: { duration: 0.6, times: [0, 0.35, 1] },
                    }}
                >
                    <div
                        style={{
                            backfaceVisibility: "hidden",
                            opacity: faceUp ? 1 : 0,
                            pointerEvents: faceUp ? "auto" : "none",
                        }}
                    >
                        <PokemonCard card={card} width={width} />
                    </div>
                    <div
                        className="absolute inset-0"
                        style={{
                            backfaceVisibility: "hidden",
                            transform: "rotateY(180deg)",
                            opacity: faceUp ? 0 : 1,
                            pointerEvents: faceUp ? "none" : "auto",
                        }}
                    >
                        <CardBack width={width} />
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

/**
 * Anticipation while the card is still face down. Same colors whatever lies
 * underneath, so the wait builds hype without giving the rarity away.
 */
const WAITING_GLOW =
    "conic-gradient(from 0deg, #fcd34d, #67e8f9, #c084fc, #fcd34d)";

function WaitingGlow() {
    return (
        <motion.span
            className="pointer-events-none absolute inset-[-10%] rounded-full blur-2xl"
            style={{ background: WAITING_GLOW }}
            initial={{ opacity: 0 }}
            animate={{
                opacity: [0.3, 0.6, 0.3],
                rotate: 360,
                scale: [1, 1.06, 1],
            }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            transition={{
                opacity: { duration: 2, repeat: Infinity },
                scale: { duration: 2, repeat: Infinity },
                rotate: { duration: 6, repeat: Infinity, ease: "linear" },
            }}
        />
    );
}

const EMBER_COLORS = ["#fcd34d", "#67e8f9", "#c084fc"];

function WaitingEmbers() {
    const embers = useMemo(
        () =>
            Array.from({ length: 16 }, (_, index) => ({
                left: -8 + Math.random() * 116,
                top: 55 + Math.random() * 50,
                rise: 120 + Math.random() * 160,
                drift: (Math.random() - 0.5) * 40,
                size: 2 + Math.random() * 4,
                duration: 1.8 + Math.random() * 1.6,
                delay: Math.random() * 2.5,
                color: EMBER_COLORS[index % EMBER_COLORS.length],
            })),
        []
    );

    return (
        <motion.div
            className="pointer-events-none absolute inset-0"
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
        >
            {embers.map((ember, index) => (
                <motion.span
                    key={index}
                    className="absolute rounded-full bg-white"
                    style={{
                        left: `${ember.left}%`,
                        top: `${ember.top}%`,
                        width: ember.size,
                        height: ember.size,
                        boxShadow: `0 0 6px 2px ${ember.color}`,
                    }}
                    initial={{ opacity: 0 }}
                    animate={{
                        y: [0, -ember.rise],
                        x: [0, ember.drift],
                        opacity: [0, 1, 0.8, 0],
                        scale: [0.4, 1, 0.6],
                    }}
                    transition={{
                        duration: ember.duration,
                        delay: ember.delay,
                        repeat: Infinity,
                        ease: "easeOut",
                    }}
                />
            ))}
        </motion.div>
    );
}

/** 0 (common) to 5 (sir): drives how loud the reveal is */
const tierOf = (card: BoosterCard): number =>
    CARD_TREATMENTS.indexOf(card.treatment);

const RAINBOW = ["#f87171", "#fbbf24", "#4ade80", "#38bdf8", "#c084fc"];

/**
 * Burst fired as the card lands face up. It only plays once the grade is on
 * screen, so it can scale with the rarity without spoiling the flip: a common
 * gets a small ring, a full-art gets light rays and a shower of sparks.
 */
function RevealBurst({ card }: { card: BoosterCard }) {
    const tier = tierOf(card);
    const accent = card.subject.accent;
    const rainbow = card.treatment === "sir";

    const sparks = useMemo(() => {
        const count = 6 + tier * 4;
        return Array.from({ length: count }, (_, index) => ({
            angle: (index / count) * Math.PI * 2 + Math.random() * 0.5,
            distance: 110 + tier * 22 + Math.random() * 60,
            size: 3 + Math.random() * (3 + tier),
            delay: 0.12 + Math.random() * 0.15,
            color: rainbow ? RAINBOW[index % RAINBOW.length] : accent,
        }));
    }, [tier, accent, rainbow]);

    return (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            {/* Shockwave */}
            <motion.span
                className="absolute inset-0 rounded-[1.2rem]"
                style={{
                    border: `${2 + tier}px solid ${accent}`,
                    boxShadow: `0 0 ${12 + tier * 6}px ${accent}, inset 0 0 ${
                        12 + tier * 6
                    }px ${accent}`,
                }}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1.25 + tier * 0.08, opacity: [0, 1, 0] }}
                transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
            />

            {/* Sparks thrown off the card */}
            {sparks.map((spark, index) => (
                <motion.span
                    key={index}
                    className="absolute rounded-full bg-white"
                    style={{
                        width: spark.size,
                        height: spark.size,
                        boxShadow: `0 0 8px 2px ${spark.color}`,
                    }}
                    initial={{ x: 0, y: 0, opacity: 0, scale: 0.3 }}
                    animate={{
                        x: Math.cos(spark.angle) * spark.distance,
                        y: Math.sin(spark.angle) * spark.distance,
                        opacity: [0, 1, 1, 0],
                        scale: [0.3, 1, 0.8, 0],
                    }}
                    transition={{
                        duration: 0.8 + tier * 0.05,
                        times: [0, 0.2, 0.6, 1],
                        delay: spark.delay,
                        ease: "easeOut",
                    }}
                />
            ))}
        </div>
    );
}

/** Light rays spinning behind a rare card, painted under the card itself */
function RevealRays({ card }: { card: BoosterCard }) {
    const tier = tierOf(card);
    const colors = card.treatment === "sir" ? RAINBOW : [card.subject.accent];
    const rays = colors
        .map((color) => `${color}aa 0deg 8deg, transparent 8deg 24deg`)
        .join(", ");
    const mask = "radial-gradient(circle, black 15%, transparent 60%)";

    return (
        <motion.span
            className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[260%] rounded-full"
            style={{
                x: "-50%",
                y: "-50%",
                background: `repeating-conic-gradient(from 0deg, ${rays})`,
                maskImage: mask,
                WebkitMaskImage: mask,
            }}
            initial={{ opacity: 0, rotate: 0, scale: 0.6 }}
            animate={{
                opacity: [0, 0.5 + tier * 0.08, 0.35],
                rotate: 90,
                scale: 1,
            }}
            transition={{
                opacity: { duration: 0.9, delay: 0.1, times: [0, 0.3, 1] },
                scale: { duration: 0.6, delay: 0.1, ease: "easeOut" },
                rotate: { duration: 12, ease: "linear" },
            }}
        />
    );
}

function Booster({
    unopened,
    onClose,
}: {
    unopened: Grade[];
    onClose: (opened: Grade[]) => void;
}) {
    const { t } = useTranslation();
    const reducedMotion = useReducedMotion();
    const [phase, setPhase] = useState<Phase>("pack");
    const [index, setIndex] = useState(0);
    const [faceUp, setFaceUp] = useState(false);
    const tearTimeout = useRef<number>(undefined);

    useEffect(() => () => window.clearTimeout(tearTimeout.current), []);

    const tearPack = () => {
        setPhase("tearing");
        requestGyroPermission();
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
            navigator.vibrate([8, 30, 16]);
        }
        tearTimeout.current = window.setTimeout(
            () => setPhase("cards"),
            reducedMotion ? 0 : 850
        );
    };

    // Rolled once per opening: tapping the entry card is a fresh pull, never
    // a replay of the same pack. Kept in state so re-renders don't re-roll.
    const [packSeed] = useState(
        () => (Math.random() * 0x100000000) >>> 0
    );

    const deck = useMemo<BoosterCard[]>(() => {
        if (unopened.length === 0) return [];

        const random = mulberry32(packSeed);
        const pulls = Math.min(MAX_CARDS_PER_PACK, unopened.length);
        const chase = shuffle(unopened, random).slice(0, pulls);

        return chase.map((grade) => buildBoosterCard(grade, true));
    }, [unopened, packSeed]);

    const newCards = useMemo(() => deck.filter((card) => card.isNew), [deck]);
    const card = deck[index];

    const close = useCallback(
        () => onClose(newCards.map((entry) => entry.grade)),
        [newCards, onClose]
    );

    // Nothing to hand out (opened from a stale list): get out of the way
    useEffect(() => {
        if (deck.length === 0) close();
    }, [deck.length, close]);

    const tapCard = () => {
        if (!faceUp) {
            setFaceUp(true);
            if (
                card &&
                typeof navigator !== "undefined" &&
                "vibrate" in navigator
            ) {
                const tier = tierOf(card);
                navigator.vibrate(
                    tier >= 4 ? [12, 40, 24, 40, 60] : [12, 40, 12 + tier * 6]
                );
            }
            return;
        }

        if (index + 1 >= deck.length) {
            setPhase("summary");
            return;
        }
        setIndex(index + 1);
        setFaceUp(false);
    };

    return (
        <motion.div
            className="fixed inset-0 z-100 flex flex-col items-center justify-center overflow-hidden px-6"
            style={{
                paddingTop: "var(--safe-area-top)",
                paddingBottom: "var(--safe-area-bottom)",
                backgroundColor: "#07070c",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
        >
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    backgroundImage:
                        "repeating-conic-gradient(from 0deg at 50% 45%, rgba(255,255,255,0.03) 0deg 3deg, transparent 3deg 14deg), radial-gradient(ellipse at 50% 40%, #1b1030 0%, #07070c 70%)",
                }}
            />

            {(phase === "pack" || phase === "tearing") && (
                <BoosterPack
                    accent={newCards[0]?.subject.accent ?? "#6366f1"}
                    dark={newCards[0]?.subject.dark ?? "#312e81"}
                    tearing={phase === "tearing"}
                    onOpen={tearPack}
                />
            )}

            {/* Flash as the pack gives up its cards */}
            <AnimatePresence>
                {phase === "tearing" && !reducedMotion && (
                    <motion.span
                        key="flash"
                        className="pointer-events-none absolute inset-0 bg-white"
                        initial={{ opacity: 0 }}
                        animate={{
                            opacity: [0, 0, 0.75, 0.35, 0],
                        }}
                        exit={{ opacity: 0 }}
                        transition={{
                            duration: 0.85,
                            times: [0, 0.3, 0.5, 0.7, 1],
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Full-art pulls light up the whole screen */}
            <AnimatePresence>
                {phase === "cards" &&
                    faceUp &&
                    card &&
                    isFullArt(card.treatment) &&
                    !reducedMotion && (
                        <motion.span
                            key={`full-art-flash-${index}`}
                            className="pointer-events-none absolute inset-0"
                            style={{
                                background: `radial-gradient(circle at 50% 45%, #fff 0%, ${card.subject.accent} 40%, transparent 75%)`,
                            }}
                            initial={{ opacity: 0 }}
                            animate={{
                                opacity: [
                                    0,
                                    card.treatment === "sir" ? 0.85 : 0.6,
                                    0,
                                ],
                            }}
                            exit={{ opacity: 0 }}
                            transition={{
                                duration: 0.7,
                                delay: 0.1,
                                times: [0, 0.25, 1],
                            }}
                        />
                    )}
            </AnimatePresence>

            {phase === "cards" && card && (
                <div className="relative flex w-full flex-col items-center gap-4">
                    <p className="font-mono text-xs uppercase tracking-[0.3em] text-white/60">
                        {t("gradesPage.booster.counter", {
                            current: index + 1,
                            total: deck.length,
                        })}
                    </p>

                    <div className="relative">
                        {/* Depth: the cards still waiting in the pack */}
                        {deck.length - index > 1 && (
                            <>
                                <span className="absolute inset-0 -z-10 translate-x-2 translate-y-2 rounded-[1rem] bg-white/10" />
                                <span className="absolute inset-0 -z-20 translate-x-4 translate-y-4 rounded-[1rem] bg-white/5" />
                            </>
                        )}

                        {faceUp && tierOf(card) >= 3 && !reducedMotion && (
                            <RevealRays key={`rays-${index}`} card={card} />
                        )}

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{
                                    opacity: 0,
                                    x: -120,
                                    rotate: -8,
                                    transition: { duration: 0.25 },
                                }}
                                transition={{ duration: 0.35, ease: "easeOut" }}
                                className="relative"
                            >
                                {/* Inside the card's wrapper so the wait
                                    effects come and go with the card itself */}
                                <AnimatePresence>
                                    {!faceUp && !reducedMotion && (
                                        <WaitingGlow key="glow" />
                                    )}
                                </AnimatePresence>
                                <CardStage
                                    card={card}
                                    faceUp={faceUp}
                                    onTap={tapCard}
                                />
                                <AnimatePresence>
                                    {!faceUp && !reducedMotion && (
                                        <WaitingEmbers key="embers" />
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </AnimatePresence>

                        {faceUp && !reducedMotion && (
                            <RevealBurst key={`burst-${index}`} card={card} />
                        )}
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`${index}-${faceUp}`}
                            className="flex min-h-[3rem] flex-col items-center justify-center gap-1"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{
                                duration: 0.25,
                                delay: faceUp ? 0.4 : 0,
                            }}
                        >
                            {faceUp ? (
                                <>
                                    <span
                                        className="rounded-sm px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.2em]"
                                        style={{
                                            backgroundColor: card.isNew
                                                ? `${card.subject.accent}33`
                                                : "rgba(255,255,255,0.08)",
                                            color: card.isNew
                                                ? "#fff"
                                                : "rgba(255,255,255,0.6)",
                                        }}
                                    >
                                        {card.isNew
                                            ? t(
                                                  `gradesPage.booster.treatments.${card.treatment}`
                                              )
                                            : t("gradesPage.booster.duplicate")}
                                    </span>
                                    <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                                        {t("gradesPage.booster.tapToNext")}
                                    </span>
                                </>
                            ) : (
                                <span className="font-mono text-[10px] uppercase tracking-widest text-white/50">
                                    {t("gradesPage.booster.tapToFlip")}
                                </span>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            )}

            {phase === "summary" && (
                <motion.div
                    className="relative flex w-full max-w-lg flex-col items-center gap-5"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                >
                    <p className="font-mono text-xs uppercase tracking-[0.3em] text-white/70">
                        {t("gradesPage.booster.summaryTitle")}
                    </p>
                    <div className="flex flex-wrap items-start justify-center gap-4">
                        {newCards.map((entry, position) => (
                            <motion.div
                                key={position}
                                className="flex flex-col items-center gap-2"
                                initial={{ opacity: 0, y: 20, rotate: -4 }}
                                animate={{ opacity: 1, y: 0, rotate: 0 }}
                                transition={{
                                    duration: 0.35,
                                    delay: position * 0.12,
                                }}
                            >
                                <PokemonCard card={entry} width={128} />
                                <span
                                    className="font-mono text-[10px] uppercase tracking-widest"
                                    style={{
                                        color: isFullArt(entry.treatment)
                                            ? entry.subject.accent
                                            : "rgba(255,255,255,0.55)",
                                    }}
                                >
                                    {t(
                                        `gradesPage.booster.treatments.${entry.treatment}`
                                    )}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                    <Button
                        className="rounded-sm bg-amber-400 px-6 font-bold uppercase tracking-wider text-zinc-950 hover:bg-amber-300"
                        onClick={close}
                    >
                        {t("gradesPage.caseOpening.continue")}
                    </Button>
                </motion.div>
            )}
        </motion.div>
    );
}

/** Pack opening for the grades waiting to be discovered. */
export function BoosterOverlay({
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
                <Booster key="booster" unopened={unopened} onClose={onClose} />
            )}
        </AnimatePresence>,
        document.body
    );
}
