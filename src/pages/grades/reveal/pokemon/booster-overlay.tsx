import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import {
    animate,
    AnimatePresence,
    motion,
    useMotionValue,
    useReducedMotion,
    useTransform,
} from "framer-motion";
import { useTranslation } from "react-i18next";

import type { Grade } from "@/types/aurion";
import { Button } from "@/components/ui/button";
import {
    buildBoosterCard,
    cardTitle,
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
    drives the tilt instead of the pointer. Until the first real input, the
    card sways on its own so the holo is lit from the moment it lands. */
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
            const bgX = 37 + (px / 100) * (63 - 37);
            const bgY = 33 + (py / 100) * (67 - 33);
            node.style.setProperty("--pointer-x", `${px}%`);
            node.style.setProperty("--pointer-y", `${py}%`);
            node.style.setProperty("--pointer-from-center", String(fromCenter));
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

        // Idle sway: a slow figure-eight, stopped by the first real input
        const IDLE_STRENGTH = 0.8;
        let idling = false;
        let idleFrame = 0;
        const idleLoop = (now: number) => {
            const time = now / 1000;
            apply(
                50 + 28 * Math.sin(time * 0.9),
                50 + 22 * Math.sin(time * 1.4 + 1),
                IDLE_STRENGTH
            );
            idleFrame = requestAnimationFrame(idleLoop);
        };
        const stopIdle = () => {
            idling = false;
            cancelAnimationFrame(idleFrame);
        };

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            apply(35, 30, IDLE_STRENGTH);
        } else {
            idling = true;
            idleFrame = requestAnimationFrame(idleLoop);
        }

        const onMove = (event: PointerEvent) => {
            if (idling) stopIdle();
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
            // Sensor noise while the phone lies still must not end the sway
            if (idling) {
                if (Math.abs(g) < 2 && Math.abs(b) < 2) return;
                stopIdle();
            }
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
            stopIdle();
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

const vibrate = (pattern: number | number[]) => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(pattern);
    }
};

/** Where the strip is torn off, in % of the pack height */
const STRIP = 13;
const TEAR_TEETH = 22;
const TEAR_DEPTH = 0.9;

/** Crimped top and bottom seals, plus the two V notches on the tear line */
const PACK_OUTLINE = (() => {
    const teeth = 28;
    const depth = 1.1;
    const top: string[] = [];
    const bottom: string[] = [];
    for (let k = 0; k <= teeth; k++) {
        const x = (k / teeth) * 100;
        const y = k % 2 === 1 ? depth : 0;
        top.push(`${x}% ${y}%`);
        bottom.unshift(`${x}% ${100 - y}%`);
    }
    return `polygon(${[
        ...top,
        `100% ${STRIP - 1.3}%`,
        `96% ${STRIP}%`,
        `100% ${STRIP + 1.3}%`,
        ...bottom,
        `0% ${STRIP + 1.3}%`,
        `4% ${STRIP}%`,
        `0% ${STRIP - 1.3}%`,
    ].join(", ")})`;
})();

/**
 * Clip paths for the pack torn `progress` (0-1) of the way, starting from the
 * left edge (`direction` 1) or the right one (-1). The flap and the body share
 * the same jagged points so the two edges mesh.
 */
const tearGeometry = (progress: number, direction: number) => {
    const reach = progress * 100;
    const x = (u: number) => (direction > 0 ? u : 100 - u);
    const step = 100 / TEAR_TEETH;
    const jagged: string[] = [];
    for (let k = 0; k * step < reach; k++) {
        const y = STRIP + (k % 2 === 0 ? -TEAR_DEPTH : TEAR_DEPTH);
        jagged.push(`${x(k * step)}% ${y}%`);
    }
    jagged.push(`${x(reach)}% ${STRIP}%`);
    const near = x(0);
    const far = x(100);
    const tip = x(reach);

    return {
        body: `polygon(${[
            ...jagged,
            `${far}% ${STRIP}%`,
            `${far}% 100%`,
            `${near}% 100%`,
        ].join(", ")})`,
        // Overlaps the body a hair so no seam shows along the intact part
        attached: `polygon(${tip}% 0%, ${far}% 0%, ${far}% ${
            STRIP + 0.4
        }%, ${tip}% ${STRIP + 0.4}%)`,
        flap: `polygon(${[
            `${near}% 0%`,
            `${tip}% 0%`,
            ...[...jagged].reverse(),
        ].join(", ")})`,
        openingLeft: `${direction > 0 ? 0 : 100 - reach}%`,
        openingWidth: `${reach}%`,
    };
};

/** Four-point sparkle printed on the pack art */
const STAR =
    "polygon(50% 0%, 61% 39%, 100% 50%, 61% 61%, 50% 100%, 39% 61%, 0% 50%, 39% 39%)";

const PACK_STARS = [
    { left: 14, top: 14, size: 1.1, delay: 0 },
    { left: 78, top: 20, size: 0.8, delay: 0.7 },
    { left: 82, top: 72, size: 1.2, delay: 1.3 },
    { left: 18, top: 78, size: 0.7, delay: 1.9 },
];

/** Pokémon-style logo lettering: yellow fill, thick blue outline */
const LOGO_SHADOW = [
    "0.07em 0 0 #2a75bb",
    "-0.07em 0 0 #2a75bb",
    "0 0.07em 0 #2a75bb",
    "0 -0.07em 0 #2a75bb",
    "0.05em 0.05em 0 #2a75bb",
    "-0.05em -0.05em 0 #2a75bb",
    "0.05em -0.05em 0 #2a75bb",
    "-0.05em 0.05em 0 #2a75bb",
    "0 0.16em 0 #1d3f72",
    "0 0.3em 0.4em rgba(0,0,0,0.55)",
].join(", ");

const CRIMP =
    "repeating-linear-gradient(90deg, rgba(255,255,255,0.35) 0 0.12em, rgba(0,0,0,0.22) 0.12em 0.3em), linear-gradient(180deg, #f4f4f5, #a1a1aa 55%, #52525b)";

/**
 * The printed foil. Drawn three times (body, intact strip, torn flap), so the
 * strip copies skip everything below the tear line.
 */
function PackFace({
    accent,
    dark,
    count,
    stripOnly,
}: {
    accent: string;
    dark: string;
    count: number;
    stripOnly?: boolean;
}) {
    const { t } = useTranslation();
    const reducedMotion = useReducedMotion();

    return (
        <div
            className="absolute inset-0 overflow-hidden"
            style={{
                clipPath: PACK_OUTLINE,
                WebkitClipPath: PACK_OUTLINE,
                background: `radial-gradient(ellipse at 25% 15%, ${accent}, transparent 55%), linear-gradient(160deg, ${accent} 0%, ${dark} 55%, #0b0b14 100%)`,
            }}
        >
            {/* Foil grain and a faint rainbow, plain alpha (no blend modes) */}
            <span
                className="absolute inset-0"
                style={{
                    backgroundImage:
                        "repeating-linear-gradient(115deg, rgba(255,255,255,0.07) 0 0.35em, transparent 0.35em 0.7em), linear-gradient(125deg, transparent 20%, rgba(252,211,77,0.16) 35%, rgba(103,232,249,0.16) 50%, rgba(192,132,252,0.16) 65%, transparent 80%)",
                }}
            />
            {/* Pillow shading: the pack bulges in the middle */}
            <span
                className="absolute inset-0"
                style={{
                    background:
                        "linear-gradient(90deg, rgba(0,0,0,0.4), transparent 12%, rgba(255,255,255,0.08) 50%, transparent 88%, rgba(0,0,0,0.4))",
                }}
            />

            {/* Top seal, then the tear line */}
            <span
                className="absolute inset-x-0 top-0 h-[7%]"
                style={{
                    background: CRIMP,
                    boxShadow: "0 0.1em 0.3em rgba(0,0,0,0.45)",
                }}
            />
            <span className="absolute inset-x-0 top-[8%] text-center font-mono text-[0.8em] font-bold uppercase tracking-[0.3em] text-white/75">
                {t("gradesPage.booster.tearHere")}
            </span>
            <span
                className="absolute inset-x-[6%] border-t-[0.12em] border-dashed border-white/60"
                style={{ top: `${STRIP}%` }}
            />

            {!stripOnly && (
                <>
                    {/* Logo */}
                    <div className="absolute inset-x-0 top-[16.5%] flex flex-col items-center gap-[0.2em]">
                        <span
                            className="whitespace-nowrap text-[1.7em] font-black italic leading-none text-[#ffcb05]"
                            style={{
                                textShadow: LOGO_SHADOW,
                                transform: "rotate(-4deg)",
                            }}
                        >
                            {t("gradesPage.booster.packName")}
                        </span>
                    </div>

                    {/* Illustration window */}
                    <div
                        className="absolute inset-x-[8%] top-[29%] bottom-[27%] overflow-hidden rounded-[0.8em]"
                        style={{
                            background: `radial-gradient(circle at 50% 45%, #fff 0%, ${accent} 32%, ${dark} 78%)`,
                            boxShadow:
                                "inset 0 0 0 0.14em rgba(255,255,255,0.55), inset 0 0 1.4em rgba(0,0,0,0.55)",
                        }}
                    >
                        <motion.span
                            className="absolute left-1/2 top-1/2 aspect-square w-[220%]"
                            style={{
                                x: "-50%",
                                y: "-50%",
                                background:
                                    "repeating-conic-gradient(from 0deg, rgba(255,255,255,0.2) 0deg 5deg, transparent 5deg 15deg)",
                            }}
                            animate={
                                reducedMotion ? undefined : { rotate: 360 }
                            }
                            transition={{
                                duration: 40,
                                repeat: Infinity,
                                ease: "linear",
                            }}
                        />
                        <span
                            className="absolute left-1/2 top-1/2 aspect-square w-[52%] -translate-x-1/2 -translate-y-1/2 rotate-[-18deg] rounded-full"
                            style={{
                                background:
                                    "linear-gradient(180deg, #ef4444 0 46%, #09090b 46% 54%, #f8fafc 54%)",
                                boxShadow: `0 0 0 0.2em #09090b, 0 0 2.2em ${accent}, 0 0 4em #ffffff88, inset -0.5em -0.4em 0.8em rgba(0,0,0,0.35)`,
                            }}
                        >
                            <span className="absolute left-1/2 top-1/2 size-[30%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_0_0.2em_#09090b]" />
                        </span>
                        {PACK_STARS.map((star, index) => (
                            <motion.span
                                key={index}
                                className="absolute bg-white"
                                style={{
                                    left: `${star.left}%`,
                                    top: `${star.top}%`,
                                    width: `${star.size}em`,
                                    height: `${star.size}em`,
                                    clipPath: STAR,
                                    WebkitClipPath: STAR,
                                }}
                                animate={
                                    reducedMotion
                                        ? undefined
                                        : {
                                              opacity: [0.2, 1, 0.2],
                                              scale: [0.6, 1, 0.6],
                                          }
                                }
                                transition={{
                                    duration: 2.4,
                                    delay: star.delay,
                                    repeat: Infinity,
                                }}
                            />
                        ))}
                    </div>

                    {/* Set ribbon and card count */}
                    <div className="absolute inset-x-0 top-[74%] flex flex-col items-center gap-[0.5em]">
                        <span className="w-full border-y border-white/20 bg-black/45 py-[0.25em] text-center font-mono text-[0.95em] font-bold uppercase tracking-[0.25em] text-white">
                            {t("gradesPage.booster.setName")}
                        </span>
                        <span className="rounded-full bg-[#ffcb05] px-[0.8em] py-[0.1em] text-[1em] font-black uppercase tracking-wider text-zinc-950 shadow-[0_0.15em_0.4em_rgba(0,0,0,0.5)]">
                            {t("gradesPage.booster.remainingShort", { count })}
                        </span>
                    </div>

                    {/* Bottom seal */}
                    <span
                        className="absolute inset-x-0 bottom-0 h-[7%]"
                        style={{
                            background: CRIMP,
                            boxShadow: "0 -0.1em 0.3em rgba(0,0,0,0.45)",
                        }}
                    />
                </>
            )}

            <span className="poke-pack-sheen absolute inset-0" />
            {/* Glare following the tilt, plain alpha (no blend modes) */}
            <span
                className="absolute inset-0"
                style={{
                    background:
                        "radial-gradient(farthest-corner circle at var(--pointer-x, 50%) var(--pointer-y, 50%), rgba(255,255,255,0.4), rgba(255,255,255,0.08) 35%, transparent 60%)",
                    opacity: "var(--card-opacity, 0)",
                }}
            />
        </div>
    );
}

/**
 * The sealed pack. Slide a finger along the dotted line, from either side, to
 * rip the strip off bit by bit; the tear never heals between two swipes. A
 * plain tap tears it in one go.
 */
function BoosterPack({
    accent,
    dark,
    count,
    tearing,
    onOpen,
}: {
    accent: string;
    dark: string;
    count: number;
    tearing: boolean;
    onOpen: () => void;
}) {
    const { t } = useTranslation();
    const reducedMotion = useReducedMotion();
    const width = Math.min(230, Math.round(window.innerWidth * 0.6));

    const progress = useMotionValue(0);
    const direction = useMotionValue(1);
    const [started, setStarted] = useState(false);
    // Flattened while tearing, so the pack holds still under the finger
    const tilt = useCardTilt(started || tearing);
    const directionLocked = useRef(false);
    const panned = useRef(false);
    const opened = useRef(false);
    const lastTick = useRef(0);

    const tear = useTransform([progress, direction], ([p, d]: number[]) =>
        tearGeometry(p, d)
    );
    const bodyClip = useTransform(tear, (geometry) => geometry.body);
    const attachedClip = useTransform(tear, (geometry) => geometry.attached);
    const flapClip = useTransform(tear, (geometry) => geometry.flap);
    const openingLeft = useTransform(tear, (geometry) => geometry.openingLeft);
    const openingWidth = useTransform(
        tear,
        (geometry) => geometry.openingWidth
    );
    const openingOpacity = useTransform(progress, [0, 0.05], [0, 1]);

    // The flap hinges on the tip of the tear and curls up as it grows
    const flapRotate = useTransform(
        [progress, direction],
        ([p, d]: number[]) => d * p * 22
    );
    const flapOriginX = useTransform(
        [progress, direction],
        ([p, d]: number[]) => (d > 0 ? p : 1 - p)
    );
    const flapY = useTransform(progress, (p) => p * -6);

    const open = useCallback(() => {
        if (opened.current) return;
        opened.current = true;
        onOpen();
    }, [onOpen]);

    const tearBy = (amount: number) => {
        const current = progress.get();
        const next = Math.min(1, current + amount);
        if (next <= current) return;
        progress.set(next);
        // A short buzz every few millimetres, like foil giving way
        const tick = Math.floor(next * 14);
        if (tick !== lastTick.current) {
            lastTick.current = tick;
            vibrate(6);
        }
        if (next >= 1) open();
    };

    const tearAll = async () => {
        if (opened.current) return;
        directionLocked.current = true;
        setStarted(true);
        if (reducedMotion) {
            progress.set(1);
            open();
            return;
        }
        await animate(progress, 1, {
            duration: 0.15 + 0.35 * (1 - progress.get()),
            ease: "easeIn",
        });
        open();
    };

    const flyDirection = direction.get();

    return (
        <motion.div
            className="relative"
            initial={{ scale: 0.85, opacity: 0, rotate: -3 }}
            animate={
                tearing
                    ? reducedMotion
                        ? { scale: 0.9, opacity: 0, rotate: 0 }
                        : {
                              scale: [1, 1.05, 1.08, 0.86],
                              opacity: [1, 1, 1, 0],
                              rotate: [0, -1.5, 1, -2],
                          }
                    : { scale: 1, opacity: 1, rotate: 0 }
            }
            transition={{
                duration: tearing ? 0.85 : 0.45,
                times: tearing && !reducedMotion ? [0, 0.3, 0.6, 1] : undefined,
                ease: "easeInOut",
            }}
        >
            {/* Halo behind the pack */}
            <span
                className="pointer-events-none absolute inset-[-12%] rounded-full opacity-40 blur-3xl"
                style={{ background: accent }}
            />

            <div style={{ perspective: 1000 }}>
                <div
                    ref={tilt.ref}
                    className="transition-transform duration-200 ease-out"
                >
                    <motion.button
                        type="button"
                        aria-label={t("gradesPage.booster.swipeToTear")}
                        className={`relative block touch-none select-none outline-none ${
                            started || tearing ? "" : "poke-pack-float"
                        }`}
                        style={{
                            width,
                            aspectRatio: "63 / 110",
                            fontSize: width / 20,
                        }}
                        disabled={tearing}
                        onPointerDown={() => {
                            panned.current = false;
                        }}
                        onClick={() => {
                            // A swipe must not also tear the whole pack on its click
                            if (panned.current) return;
                            requestGyroPermission();
                            tearAll();
                        }}
                        onPanStart={() => {
                            panned.current = true;
                        }}
                        onPan={(_, info) => {
                            if (opened.current) return;
                            if (!directionLocked.current) {
                                if (Math.abs(info.offset.x) < 6) return;
                                directionLocked.current = true;
                                direction.set(Math.sign(info.offset.x));
                                setStarted(true);
                            }
                            tearBy(
                                (direction.get() * info.delta.x) /
                                    (width * 0.85)
                            );
                        }}
                        onPanEnd={() => {
                            // Pointer up is a user gesture: iOS lets us ask for the
                            // gyroscope here, before any card mounts
                            requestGyroPermission();
                            if (!opened.current && progress.get() >= 0.8)
                                tearAll();
                        }}
                    >
                        {/* Invisible margin on both sides: a swipe can start a
                    little off the pack, fingers are not that precise */}
                        <span className="absolute inset-y-0 -inset-x-10" />

                        {/* Ground shadow */}
                        <span className="pointer-events-none absolute inset-x-[8%] -bottom-[4%] h-[6%] rounded-full bg-black/60 blur-md" />

                        <motion.div
                            className="absolute inset-0"
                            style={{
                                clipPath: bodyClip,
                                WebkitClipPath: bodyClip,
                            }}
                        >
                            <PackFace
                                accent={accent}
                                dark={dark}
                                count={count}
                            />
                        </motion.div>

                        {/* Light leaking out of the opening */}
                        <motion.span
                            className="pointer-events-none absolute h-[3em] -translate-y-full"
                            style={{
                                top: `${STRIP}%`,
                                left: openingLeft,
                                width: openingWidth,
                                opacity: openingOpacity,
                                background: `linear-gradient(0deg, ${accent}cc, ${accent}33 50%, transparent)`,
                            }}
                        />

                        <motion.div
                            className="pointer-events-none absolute inset-0"
                            style={{
                                clipPath: attachedClip,
                                WebkitClipPath: attachedClip,
                            }}
                        >
                            <PackFace
                                accent={accent}
                                dark={dark}
                                count={count}
                                stripOnly
                            />
                        </motion.div>

                        {/* The torn flap, flung away once the strip comes off */}
                        <motion.div
                            className="pointer-events-none absolute inset-0"
                            animate={
                                tearing && !reducedMotion
                                    ? {
                                          x: flyDirection * 90,
                                          y: -240,
                                          rotate: flyDirection * 40,
                                          opacity: 0,
                                      }
                                    : undefined
                            }
                            transition={{ duration: 0.55, ease: "easeIn" }}
                        >
                            <motion.div
                                className="absolute inset-0"
                                style={{
                                    clipPath: flapClip,
                                    WebkitClipPath: flapClip,
                                    rotate: flapRotate,
                                    y: flapY,
                                    originX: flapOriginX,
                                    originY: STRIP / 100,
                                }}
                            >
                                <PackFace
                                    accent={accent}
                                    dark={dark}
                                    count={count}
                                    stripOnly
                                />
                            </motion.div>
                        </motion.div>

                        {/* Bright torn edge */}
                        <motion.span
                            className="pointer-events-none absolute h-[2px] -translate-y-1/2 rounded-full bg-white"
                            style={{
                                top: `${STRIP}%`,
                                left: openingLeft,
                                width: openingWidth,
                                opacity: openingOpacity,
                                boxShadow: `0 0 8px 2px ${accent}`,
                            }}
                        />

                        {/* Hint: a spark running along the dotted line */}
                        {!started && !tearing && !reducedMotion && (
                            <motion.span
                                className="pointer-events-none absolute h-[0.5em] w-[3em] -translate-y-1/2 rounded-full"
                                style={{
                                    top: `${STRIP}%`,
                                    background:
                                        "linear-gradient(90deg, transparent, rgba(255,255,255,0.9))",
                                    boxShadow: `0 0 10px 2px ${accent}`,
                                }}
                                initial={{ left: "2%", opacity: 0 }}
                                animate={{
                                    left: ["2%", "82%"],
                                    opacity: [0, 1, 1, 0],
                                }}
                                transition={{
                                    duration: 1.3,
                                    repeat: Infinity,
                                    repeatDelay: 0.6,
                                    ease: "easeInOut",
                                }}
                            />
                        )}

                        {/* Cone of light escaping the torn pack */}
                        <motion.span
                            className="pointer-events-none absolute left-1/2 -translate-x-1/2 -translate-y-full"
                            style={{
                                top: `${STRIP}%`,
                                width: "130%",
                                height: "14rem",
                                background: `radial-gradient(ellipse 50% 70% at 50% 100%, ${accent}cc, ${accent}55 35%, transparent 70%)`,
                                transformOrigin: "bottom center",
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
                    </motion.button>
                </div>
            </div>

            <motion.p
                className="absolute left-1/2 top-full mt-6 w-[85vw] max-w-sm -translate-x-1/2 text-center font-mono text-[10px] uppercase tracking-widest text-white/60"
                animate={{ opacity: started || tearing ? 0 : 1 }}
            >
                {t("gradesPage.booster.swipeToTear")}
            </motion.p>
        </motion.div>
    );
}

/** Holo frozen at a flattering angle, for cards that don't tilt */
const STILL_HOLO = {
    "--pointer-x": "35%",
    "--pointer-y": "30%",
    "--pointer-from-center": "0.4",
    "--pointer-from-top": "0.3",
    "--pointer-from-left": "0.35",
    "--background-x": "46%",
    "--background-y": "43%",
    "--card-opacity": "0.8",
} as CSSProperties;

/** Width of the card being revealed, shared with the pile behind it */
const stageWidth = () => Math.min(300, Math.round(window.innerWidth * 0.72));

/** How many of the waiting cards are drawn behind the current one */
const MAX_PILE = 4;

/** Where a waiting card sits in the fan, `depth` cards behind the front */
const pileOffset = (depth: number) => ({
    x: depth * 9,
    y: -depth * 7,
    rotate: depth * 2.5,
});

/** How long the revealed card takes to leave, before the next one moves up */
const CARD_EXIT = 0.25;

/**
 * The cards still waiting in the pack, face down and fanned out behind the
 * current one. Keyed by deck position, so the pile slides forward as each
 * card is revealed.
 */
function CardPile({ remaining, first }: { remaining: number; first: number }) {
    const width = stageWidth();
    const shown = Math.min(remaining, MAX_PILE);

    return (
        <AnimatePresence>
            {Array.from({ length: shown }, (_, offset) => {
                const depth = offset + 1;
                return (
                    <motion.div
                        key={first + offset}
                        className="pointer-events-none absolute left-0 top-0"
                        style={{ zIndex: -depth }}
                        initial={{ opacity: 0, ...pileOffset(depth + 1) }}
                        animate={{
                            opacity: 1 - depth * 0.12,
                            ...pileOffset(depth),
                        }}
                        // Held until the front card is gone: the real card
                        // then takes its place, so the swap doesn't show
                        exit={{
                            opacity: 0,
                            transition: { duration: 0, delay: CARD_EXIT },
                        }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                    >
                        <CardBack width={width} />
                    </motion.div>
                );
            })}
        </AnimatePresence>
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
    const width = stageWidth();

    return (
        <div className="relative" style={{ perspective: 1200 }} onClick={onTap}>
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
        // Outer layer grows in with the card coming off the pile; the inner
        // one keeps pulsing on its own
        <motion.span
            className="pointer-events-none absolute inset-[-10%]"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            transition={{ duration: 0.6, ease: "easeOut" }}
        >
            <motion.span
                className="absolute inset-0 rounded-full blur-2xl"
                style={{ background: WAITING_GLOW }}
                animate={{
                    opacity: [0.3, 0.6, 0.3],
                    rotate: 360,
                    scale: [1, 1.06, 1],
                }}
                transition={{
                    opacity: { duration: 2, repeat: Infinity },
                    scale: { duration: 2, repeat: Infinity },
                    rotate: { duration: 6, repeat: Infinity, ease: "linear" },
                }}
            />
        </motion.span>
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
        vibrate([8, 30, 16]);
        tearTimeout.current = window.setTimeout(
            () => setPhase("cards"),
            reducedMotion ? 0 : 850
        );
    };

    // Rolled once per opening: tapping the entry card is a fresh pull, never
    // a replay of the same pack. Kept in state so re-renders don't re-roll.
    const [packSeed] = useState(() => (Math.random() * 0x100000000) >>> 0);

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
                    count={deck.length}
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

                    {/* Fixed size: the pile stays put while one card leaves
                        and the next comes in */}
                    <div
                        className="relative isolate"
                        style={{ width: stageWidth(), aspectRatio: "63 / 88" }}
                    >
                        <CardPile
                            remaining={deck.length - index - 1}
                            first={index + 1}
                        />

                        {faceUp && tierOf(card) >= 3 && !reducedMotion && (
                            <RevealRays key={`rays-${index}`} card={card} />
                        )}

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={index}
                                // Slides forward from the top of the pile
                                initial={pileOffset(1)}
                                animate={{ x: 0, y: 0, rotate: 0 }}
                                exit={{
                                    opacity: 0,
                                    x: -120,
                                    rotate: -8,
                                    transition: { duration: CARD_EXIT },
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
                    <div className="grid grid-cols-[repeat(2,8rem)] items-start justify-center gap-x-6 gap-y-4 sm:grid-cols-[repeat(3,8rem)]">
                        {newCards.map((entry, position) => (
                            <motion.div
                                key={position}
                                className="flex w-32 flex-col items-center gap-2 justify-self-center last:odd:col-span-2 sm:last:odd:col-span-1"
                                initial={{ opacity: 0, y: 20, rotate: -4 }}
                                animate={{ opacity: 1, y: 0, rotate: 0 }}
                                transition={{
                                    duration: 0.35,
                                    delay: position * 0.12,
                                }}
                            >
                                <div style={STILL_HOLO}>
                                    <PokemonCard card={entry} width={128} />
                                </div>
                                <span
                                    className="w-full truncate text-center font-mono text-[10px] uppercase leading-tight tracking-widest"
                                    style={{
                                        color: isFullArt(entry.treatment)
                                            ? entry.subject.accent
                                            : "rgba(255,255,255,0.55)",
                                    }}
                                >
                                    {cardTitle(entry, t)}
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
