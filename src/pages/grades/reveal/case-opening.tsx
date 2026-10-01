import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowUp, KeyRound, Package, Star } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Grade } from "@/types/aurion";
import { Button } from "@/components/ui/button";
import {
    GRADE_RARITIES,
    GRADE_SCALE,
    formatGradeValue,
    getRarityForGrade,
    randomGradeValue,
    type GradeRarity,
} from "@/lib/utils/grade-rarity";
import { playSound } from "@/lib/utils/sfx";
import { useGradeReveal, type GradeReveal } from "./use-grade-reveal";

const ITEM_WIDTH = 104;
const ITEM_HEIGHT = 136;
const ITEM_GAP = 6;
const PITCH = ITEM_WIDTH + ITEM_GAP;
const REEL_LENGTH = 64;
const WINNER_INDEX = 58;
const SPIN_DURATION = 6.2;
/** Closer ticks than this blur into one buzz at full reel speed */
const MIN_TICK_GAP_MS = 30;
/** Shake, latches, lid: how long the case takes to open before the reel */
const UNLOCK_MS = 1100;
/** How long the winner sits on the reel before the drop screen */
const LANDED_HOLD_MS = 1000;

/**
 * case: sealed, waiting for the unlock button
 * unlocking: the lid flies off
 * spin: the reel runs
 * landed: the reel stopped on the winner
 * drop: the item showcase
 */
type Phase = "case" | "unlocking" | "spin" | "landed" | "drop";

type ReelItem = { value: number; rarity: GradeRarity };

const GOLD = GRADE_RARITIES[GRADE_RARITIES.length - 1]!;

const makeItem = (value: number): ReelItem => ({
    value,
    rarity: getRarityForGrade(value),
});

const vibrate = (pattern: number | number[]) => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(pattern);
    }
};

/**
 * Weapon-drop sparks thrown off the winning item: hot streaks that arc down
 * under gravity. The rarer the grade, the bigger the shower.
 */
function DropSparks({ rarity }: { rarity: GradeRarity }) {
    const tier = GRADE_RARITIES.indexOf(rarity);

    const sparks = useMemo(() => {
        const count = 8 + tier * 5;
        return Array.from({ length: count }, (_, index) => {
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.6;
            const speed = 90 + Math.random() * (60 + tier * 25);
            return {
                dx: Math.cos(angle) * speed,
                dy: Math.sin(angle) * speed,
                length: 6 + Math.random() * 10,
                duration: 0.7 + Math.random() * 0.5,
                delay: Math.random() * 0.12,
                color: index % 3 === 0 ? "#fde68a" : rarity.color,
            };
        });
    }, [tier, rarity.color]);

    return (
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-10">
            {sparks.map((spark, index) => (
                <motion.span
                    key={index}
                    className="absolute left-0 top-0 w-[2px] rounded-full"
                    style={{
                        height: spark.length,
                        background: spark.color,
                        boxShadow: `0 0 6px 1px ${spark.color}`,
                    }}
                    initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
                    animate={{
                        // Out along the angle, then gravity takes over
                        x: [0, spark.dx * 0.7, spark.dx],
                        y: [0, spark.dy * 0.6, spark.dy + 90],
                        rotate: [
                            (Math.atan2(spark.dy, spark.dx) * 180) / Math.PI +
                                90,
                            180,
                        ],
                        opacity: [1, 1, 0],
                    }}
                    transition={{
                        duration: spark.duration,
                        delay: spark.delay,
                        ease: "easeOut",
                    }}
                />
            ))}
        </div>
    );
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

/**
 * Rays spinning behind the case or the drop: 16 rays split into 4
 * interleaved groups, each turning at a slightly different speed so the
 * beams slowly drift apart and together. A 90deg period never shows a seam.
 */
const RAY_LAYERS = [
    { ray: 7, period: 90, from: 0, duration: 30, turn: 360, opacity: 1 },
    { ray: 7, period: 90, from: 22.5, duration: 33, turn: 360, opacity: 1 },
    { ray: 7, period: 90, from: 45, duration: 27, turn: 360, opacity: 1 },
    { ray: 7, period: 90, from: 67.5, duration: 36, turn: 360, opacity: 1 },
];

function SpinningRays({ color, opacity }: { color: string; opacity: number }) {
    const reducedMotion = useReducedMotion();
    const mask = "radial-gradient(circle, black 12%, transparent 62%)";

    return (
        <>
            {RAY_LAYERS.map((layer) => (
                <motion.span
                    key={layer.from}
                    className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[230%] rounded-full"
                    style={{
                        x: "-50%",
                        y: "-50%",
                        background: `repeating-conic-gradient(from ${layer.from}deg, ${color} 0deg ${layer.ray}deg, transparent ${layer.ray}deg ${layer.period}deg)`,
                        maskImage: mask,
                        WebkitMaskImage: mask,
                    }}
                    initial={{ opacity: 0, rotate: 0 }}
                    animate={{
                        opacity: opacity * layer.opacity,
                        rotate: reducedMotion ? 0 : layer.turn,
                    }}
                    transition={{
                        opacity: { duration: 0.6 },
                        rotate: {
                            duration: layer.duration,
                            repeat: Infinity,
                            ease: "linear",
                        },
                    }}
                />
            ))}
        </>
    );
}

/**
 * The "skin" of an item: a grade has no weapon, so the grade is the artwork,
 * on a finish tinted to its rarity. Gold gets its own shining finish.
 */
function ItemArt({
    rarity,
    value,
    large,
}: {
    rarity: GradeRarity;
    value: string;
    large?: boolean;
}) {
    const reducedMotion = useReducedMotion();

    if (rarity.id === GOLD.id) {
        return (
            <div
                className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden"
                style={{
                    background:
                        "radial-gradient(circle at 50% 42%, #fef3c7, #e4ae39 45%, #6b4c0e 100%)",
                }}
            >
                <span
                    className="absolute inset-0"
                    style={{
                        backgroundImage:
                            "repeating-conic-gradient(from 0deg at 50% 42%, rgba(255,255,255,0.22) 0deg 6deg, transparent 6deg 18deg)",
                    }}
                />
                {/* Light sweeping across the gold leaf (the drop card
                    already runs its own sweep) */}
                {!large && !reducedMotion && (
                    <span
                        className="absolute inset-y-0 left-0 w-1/2"
                        style={{
                            background:
                                "linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)",
                            animation: "cs2-sweep 2.4s ease-in-out infinite",
                        }}
                    />
                )}
                <span
                    className={`relative font-mono font-black leading-none text-white ${
                        large ? "text-6xl" : "text-[1.85rem]"
                    }`}
                    style={{
                        textShadow:
                            "0 0 14px rgba(255,255,255,0.9), 0 2px 0 #7c5a12, 0 3px 6px rgba(107,76,14,0.8)",
                    }}
                >
                    {value}
                </span>
                <span
                    className={`relative font-mono font-bold tracking-widest text-[#5b3f08] ${
                        large ? "text-lg" : "text-[10px]"
                    }`}
                >
                    {`/${GRADE_SCALE}`}
                </span>
            </div>
        );
    }

    return (
        <div
            className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden"
            style={{
                background: `radial-gradient(ellipse 85% 70% at 50% 112%, ${rarity.color}bb, ${rarity.color}22 55%, transparent 80%), linear-gradient(180deg, #2c303b, #15171d)`,
            }}
        >
            {/* Finish: diagonal pattern tinted to the rarity */}
            <span
                className="absolute inset-0 opacity-70"
                style={{
                    backgroundImage: `repeating-linear-gradient(135deg, ${rarity.color}24 0 2px, transparent 2px 9px)`,
                }}
            />
            <span
                className="absolute inset-x-[18%] inset-y-[22%] rounded-full blur-xl"
                style={{ background: rarity.glow, opacity: 0.4 }}
            />
            <span
                className={`relative font-mono font-black leading-none text-white ${
                    large ? "text-6xl" : "text-[1.85rem]"
                }`}
                style={{
                    textShadow: `0 0 18px ${rarity.glow}, 0 2px 0 rgba(0,0,0,0.55)`,
                }}
            >
                {value}
            </span>
            <span
                className={`relative font-mono tracking-widest text-white/50 ${
                    large ? "text-lg" : "text-[10px]"
                }`}
            >
                {`/${GRADE_SCALE}`}
            </span>
        </div>
    );
}

function ReelItemCard({
    item,
    dimmed,
    won,
}: {
    item: ReelItem;
    dimmed: boolean;
    won: boolean;
}) {
    const { t } = useTranslation();
    const { rarity } = item;

    return (
        <div
            className="relative flex shrink-0 flex-col overflow-hidden rounded-[3px] transition-[opacity,transform,box-shadow] duration-300"
            style={{
                width: ITEM_WIDTH,
                height: ITEM_HEIGHT,
                opacity: dimmed ? 0.2 : 1,
                transform: won ? "scale(1.05)" : undefined,
                background: "#1b1e25",
                boxShadow: won
                    ? `0 0 0 1px ${rarity.color}, 0 0 28px -2px ${rarity.glow}`
                    : "inset 0 0 0 1px rgba(255,255,255,0.05)",
            }}
        >
            <div className="relative flex-1">
                <ItemArt rarity={rarity} value={formatGradeValue(item.value)} />
            </div>
            <span
                className="h-[3px] shrink-0"
                style={{
                    background: rarity.color,
                    boxShadow: `0 0 8px ${rarity.glow}`,
                }}
            />
            <span className="shrink-0 truncate px-1.5 py-1 font-mono text-[8px] uppercase tracking-wider text-zinc-400">
                {/* Short name on the narrow reel cards, the drop keeps the
                    full one */}
                {t(rarity.shortLabelKey)}
            </span>
        </div>
    );
}

/** What the case can drop, one tile per rarity, like the CS2 case preview */
function CaseContents() {
    const { t } = useTranslation();

    return (
        <div className="w-full max-w-md">
            <p className="mb-2 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
                {t("gradesPage.caseOpening.contains")}
            </p>
            <div className="flex justify-center gap-1.5">
                {GRADE_RARITIES.map((rarity, index) => (
                    <div
                        key={rarity.id}
                        className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[3px] bg-[#1b1e25] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"
                    >
                        <div className="relative h-9">
                            {rarity.id === GOLD.id ? (
                                <div
                                    className="absolute inset-0 flex items-center justify-center"
                                    style={{
                                        background:
                                            "radial-gradient(circle, #fef3c7, #e4ae39 55%, #6b4c0e)",
                                    }}
                                >
                                    <Star className="size-4 fill-white text-white" />
                                </div>
                            ) : (
                                <div
                                    className="absolute inset-0"
                                    style={{
                                        background: `radial-gradient(ellipse 90% 80% at 50% 115%, ${rarity.color}cc, transparent 75%), repeating-linear-gradient(135deg, ${rarity.color}24 0 2px, transparent 2px 7px), #20232b`,
                                    }}
                                />
                            )}
                        </div>
                        <span
                            className="h-[2px]"
                            style={{
                                background: rarity.color,
                                boxShadow: `0 0 6px ${rarity.glow}`,
                            }}
                        />
                        <span className="py-0.5 text-center font-mono text-[8px] tracking-tight text-zinc-400">
                            {rarityRange(index)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/** Case size, in CSS pixels: handle + lid + body */
const CASE_HANDLE = 16;
const CASE_LID = 48;
const CASE_BODY = 112;
const CASE_HEIGHT = CASE_HANDLE + CASE_LID + CASE_BODY;
/** Room around the case in the canvas: the lid flies up, the shadow drops */
const PAD_X = 24;
const PAD_TOP = 120;
const PAD_BOTTOM = 60;

const FLOAT_PERIOD_MS = 2600;
const FLOAT_AMP = 6;
const SHAKE_X = [0, -6, 6, -5, 5, -3, 3, 0];
const SHAKE_DEG = [0, -1.5, 1.5, -1, 1, -0.5, 0.5, 0];

const easeIn = (x: number) => x * x * x;
const easeOut = (x: number) => 1 - (1 - x) ** 3;
const easeInOut = (x: number) =>
    x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** Linear interpolation through evenly spaced keyframes */
const keyframes = (values: number[], progress: number) => {
    const position = clamp01(progress) * (values.length - 1);
    const index = Math.min(values.length - 2, Math.floor(position));
    const k = position - index;
    return values[index]! + (values[index + 1]! - values[index]!) * k;
};

const metalGradient = (
    ctx: CanvasRenderingContext2D,
    top: number,
    height: number
) => {
    const gradient = ctx.createLinearGradient(0, top, 0, top + height);
    gradient.addColorStop(0, "#f4f4f5");
    gradient.addColorStop(0.45, "#a1a1aa");
    gradient.addColorStop(1, "#52525b");
    return gradient;
};

/** Diagonal brushed finish, clipped to the current path */
const hatch = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number
) => {
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = "rgba(255,255,255,0.035)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let offset = -height; offset < width + height; offset += 12) {
        ctx.moveTo(x + offset, y);
        ctx.lineTo(x + offset + height, y + height);
    }
    ctx.stroke();
    ctx.restore();
};

/** Letter-spaced text, done by hand: canvas letterSpacing is not everywhere */
const spacedText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    centerX: number,
    y: number,
    spacing: number
) => {
    const widths = [...text].map((char) => ctx.measureText(char).width);
    const total =
        widths.reduce((sum, width) => sum + width, 0) +
        spacing * (text.length - 1);
    let x = centerX - total / 2;
    [...text].forEach((char, index) => {
        ctx.fillText(char, x, y);
        x += widths[index]! + spacing;
    });
    return total;
};

type CaseState = {
    /** ms since the unlock started, null while sealed */
    openedFor: number | null;
    float: number;
};

const LABEL_HEIGHT = 18;

const stickerWidthFor = (width: number) => width * 0.64;

/** The sticker's case name, drawn once into its own canvas */
function renderLabel(
    label: string,
    font: string,
    width: number,
    dpr: number
): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(LABEL_HEIGHT * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return canvas;

    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#fcd34d";
    ctx.textBaseline = "middle";
    let size = 11;
    ctx.font = `900 ${size}px ${font}`;
    const measure = () =>
        [...label].reduce((sum, char) => sum + ctx.measureText(char).width, 0) +
        size * 0.3 * (label.length - 1);
    while (size > 7 && measure() > width) {
        size -= 0.5;
        ctx.font = `900 ${size}px ${font}`;
    }
    spacedText(ctx, label, width / 2, LABEL_HEIGHT / 2, size * 0.3);
    return canvas;
}

function drawCase(
    ctx: CanvasRenderingContext2D,
    width: number,
    labelImage: HTMLCanvasElement,
    { openedFor, float }: CaseState
) {
    const t = openedFor ?? -1;
    const shake = t < 0 ? 0 : easeInOut(clamp01(t / 500));
    const shakeX = t < 0 ? 0 : keyframes(SHAKE_X, shake);
    const shakeDeg = t < 0 ? 0 : keyframes(SHAKE_DEG, shake);

    const x0 = PAD_X;
    const y0 = PAD_TOP + float;
    const lidTop = y0 + CASE_HANDLE;
    const bodyTop = lidTop + CASE_LID;

    ctx.save();
    // Shake around the case center
    ctx.translate(x0 + width / 2 + shakeX, y0 + CASE_HEIGHT / 2);
    ctx.rotate((shakeDeg * Math.PI) / 180);
    ctx.translate(-(x0 + width / 2), -(y0 + CASE_HEIGHT / 2));

    // Body, with its drop shadow
    const body = new Path2D();
    body.roundRect(x0, bodyTop, width, CASE_BODY, [0, 0, 12, 12]);
    const bodyFill = ctx.createLinearGradient(
        0,
        bodyTop,
        0,
        bodyTop + CASE_BODY
    );
    bodyFill.addColorStop(0, "#4d5d40");
    bodyFill.addColorStop(0.55, "#2f3a29");
    bodyFill.addColorStop(1, "#1c2318");
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.65)";
    ctx.shadowBlur = 34;
    ctx.shadowOffsetY = 22;
    ctx.fillStyle = bodyFill;
    ctx.fill(body);
    ctx.restore();

    ctx.save();
    ctx.clip(body);
    ctx.beginPath();
    ctx.rect(x0, bodyTop, width, CASE_BODY);
    hatch(ctx, x0, bodyTop, width, CASE_BODY);
    // Inner shading: dark seam on top, heavy bottom
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(x0, bodyTop, width, 2);
    const bottomShade = ctx.createLinearGradient(
        0,
        bodyTop + CASE_BODY - 16,
        0,
        bodyTop + CASE_BODY
    );
    bottomShade.addColorStop(0, "rgba(0,0,0,0)");
    bottomShade.addColorStop(1, "rgba(0,0,0,0.5)");
    ctx.fillStyle = bottomShade;
    ctx.fillRect(x0, bodyTop + CASE_BODY - 16, width, 16);
    // Metal corners
    ctx.fillStyle = metalGradient(ctx, bodyTop + CASE_BODY - 12, 12);
    ctx.fillRect(x0, bodyTop + CASE_BODY - 12, 12, 12);
    ctx.fillRect(x0 + width - 12, bodyTop + CASE_BODY - 12, 12, 12);
    ctx.restore();

    // Sticker: case name over the rarity stripe
    const stickerX = x0 + width * 0.18;
    const stickerWidth = stickerWidthFor(width);
    const stickerHeight = 36;
    const stickerY = bodyTop + (CASE_BODY - stickerHeight) / 2;
    const sticker = new Path2D();
    sticker.roundRect(stickerX, stickerY, stickerWidth, stickerHeight, 6);
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fill(sticker);
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1;
    ctx.stroke(sticker);

    // Pre-rendered: Firefox snaps glyphs to whole pixels even on a canvas,
    // a pasted image is interpolated at the fractional position instead
    ctx.drawImage(
        labelImage,
        stickerX + 8,
        stickerY + 13 - LABEL_HEIGHT / 2,
        stickerWidth - 16,
        LABEL_HEIGHT
    );

    const stripeX = stickerX + 8;
    const stripeWidth = stickerWidth - 16;
    const stripe = new Path2D();
    stripe.roundRect(stripeX, stickerY + 25, stripeWidth, 4, 2);
    ctx.save();
    ctx.clip(stripe);
    GRADE_RARITIES.forEach((rarity, index) => {
        ctx.fillStyle = rarity.color;
        const segment = stripeWidth / GRADE_RARITIES.length;
        ctx.fillRect(
            stripeX + index * segment,
            stickerY + 25,
            segment + 0.5,
            4
        );
    });
    ctx.restore();

    // Latches over the seam, flipping open one after the other
    [width * 0.16, width * 0.84 - 16].forEach((offset, index) => {
        const flip =
            t < 0 ? 0 : easeOut(clamp01((t - 250 - index * 100) / 200));
        const scaleY = Math.cos((flip * 160 * Math.PI) / 180);
        const height = 20;
        const bottom = bodyTop + 12 + flip * 4;
        ctx.save();
        ctx.translate(x0 + offset, bottom);
        ctx.scale(1, scaleY || 0.001);
        const latch = new Path2D();
        latch.roundRect(0, -height, 16, height, 3);
        ctx.shadowColor = "rgba(0,0,0,0.6)";
        ctx.shadowBlur = 3;
        ctx.shadowOffsetY = 2;
        ctx.fillStyle = metalGradient(ctx, -height, height);
        ctx.fill(latch);
        ctx.shadowColor = "transparent";
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.fillRect(0, -3, 16, 3);
        ctx.restore();
    });

    // Lid and handle, thrown off once the latches are open
    const lift = t < 0 ? 0 : easeIn(clamp01((t - 550) / 450));
    if (lift < 1) {
        const pivotX = x0 + width / 2;
        const pivotY = y0 + (CASE_HANDLE + CASE_LID) / 2;
        ctx.save();
        ctx.globalAlpha = 1 - lift;
        ctx.translate(pivotX, pivotY - 90 * lift);
        ctx.rotate((-14 * lift * Math.PI) / 180);
        ctx.translate(-pivotX, -pivotY);

        // Handle: an open loop on top of the lid
        const handleWidth = width * 0.34;
        const handleX = x0 + (width - handleWidth) / 2;
        ctx.strokeStyle = "#71717a";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(handleX + 2.5, lidTop);
        ctx.arcTo(handleX + 2.5, y0 + 2.5, handleX + 14, y0 + 2.5, 10);
        ctx.arcTo(
            handleX + handleWidth - 2.5,
            y0 + 2.5,
            handleX + handleWidth - 2.5,
            lidTop,
            10
        );
        ctx.lineTo(handleX + handleWidth - 2.5, lidTop);
        ctx.stroke();

        const lid = new Path2D();
        lid.roundRect(x0, lidTop, width, CASE_LID, [12, 12, 0, 0]);
        const lidFill = ctx.createLinearGradient(
            0,
            lidTop,
            0,
            lidTop + CASE_LID
        );
        lidFill.addColorStop(0, "#5b6d4c");
        lidFill.addColorStop(1, "#3c4a33");
        ctx.fillStyle = lidFill;
        ctx.fill(lid);

        ctx.save();
        ctx.clip(lid);
        ctx.beginPath();
        ctx.rect(x0, lidTop, width, CASE_LID);
        hatch(ctx, x0, lidTop, width, CASE_LID);
        // Ridges
        ctx.fillStyle = "rgba(0,0,0,0.18)";
        for (let y = lidTop; y < lidTop + CASE_LID; y += 9) {
            ctx.fillRect(x0, y, width, 2);
        }
        ctx.fillStyle = "rgba(255,255,255,0.18)";
        ctx.fillRect(x0, lidTop, width, 2);
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.fillRect(x0, lidTop + CASE_LID - 2, width, 2);
        ctx.fillStyle = metalGradient(ctx, lidTop, 12);
        ctx.fillRect(x0, lidTop, 12, 12);
        ctx.fillRect(x0 + width - 12, lidTop, 12, 12);
        ctx.restore();

        ctx.restore();
    }

    ctx.restore();
}

/**
 * The weapon case: olive crate with a carry handle, two latches and the
 * Mauria sticker. Opening shakes it, flips the latches and throws the lid.
 *
 * Drawn on a canvas rather than in the DOM: Firefox snaps animated DOM
 * transforms to whole pixels, so the slow float stepped instead of drifting.
 * A canvas draws at fractional coordinates.
 */
function WeaponCase({ opening }: { opening: boolean }) {
    const { t } = useTranslation();
    const reducedMotion = useReducedMotion();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const width = Math.min(256, Math.round(window.innerWidth * 0.7));
    const label = t("gradesPage.caseOpening.caseName").toUpperCase();
    const openedAt = useRef<number | null>(null);
    const animated = opening && !reducedMotion;

    if (animated && openedAt.current === null) {
        openedAt.current = performance.now();
    }

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;

        const cssWidth = width + PAD_X * 2;
        const cssHeight = CASE_HEIGHT + PAD_TOP + PAD_BOTTOM;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.round(cssWidth * dpr);
        canvas.height = Math.round(cssHeight * dpr);
        const labelImage = renderLabel(
            label,
            getComputedStyle(canvas).fontFamily,
            stickerWidthFor(width) - 16,
            dpr
        );

        let frame = 0;
        const render = (now: number) => {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            const float = reducedMotion
                ? 0
                : -FLOAT_AMP *
                  (0.5 - 0.5 * Math.cos((2 * Math.PI * now) / FLOAT_PERIOD_MS));
            drawCase(ctx, width, labelImage, {
                openedFor:
                    openedAt.current === null ? null : now - openedAt.current,
                float,
            });
            if (!reducedMotion) frame = requestAnimationFrame(render);
        };
        frame = requestAnimationFrame(render);
        return () => cancelAnimationFrame(frame);
    }, [width, label, reducedMotion]);

    return (
        <div className="relative" style={{ width, height: CASE_HEIGHT }}>
            {/* Light escaping above the seam, behind the lid */}
            <motion.span
                className="pointer-events-none absolute left-1/2 h-56 w-[120%] -translate-x-1/2 -translate-y-full"
                style={{
                    top: CASE_HANDLE + CASE_LID,
                    background:
                        "radial-gradient(ellipse 50% 80% at 50% 100%, rgba(253,230,138,0.9), rgba(245,158,11,0.35) 40%, transparent 70%)",
                    transformOrigin: "bottom center",
                }}
                initial={{ opacity: 0, scaleY: 0 }}
                animate={
                    animated
                        ? { opacity: [0, 1, 0], scaleY: [0, 1.1, 1] }
                        : { opacity: 0, scaleY: 0 }
                }
                transition={{ duration: 0.8, delay: 0.55, ease: "easeOut" }}
            />

            <canvas
                ref={canvasRef}
                aria-hidden
                className="pointer-events-none absolute font-mono"
                style={{
                    left: -PAD_X,
                    top: -PAD_TOP,
                    width: width + PAD_X * 2,
                    height: CASE_HEIGHT + PAD_TOP + PAD_BOTTOM,
                }}
            />

            {/* The seam lighting up as the latches give */}
            <motion.span
                className="pointer-events-none absolute inset-x-[4%] h-1 -translate-y-1/2 rounded-full bg-white"
                style={{
                    top: CASE_HANDLE + CASE_LID,
                    boxShadow: "0 0 18px 6px rgba(251,191,36,0.85)",
                }}
                initial={{ opacity: 0, scaleX: 0.2 }}
                animate={
                    animated
                        ? { opacity: [0, 1, 1, 0], scaleX: [0.2, 1, 1.1, 1] }
                        : { opacity: 0, scaleX: 0.2 }
                }
                transition={{
                    duration: 0.9,
                    delay: 0.3,
                    times: [0, 0.3, 0.7, 1],
                }}
            />
        </div>
    );
}

/** The CS2 drop screen: the won item on show, under spinning rays. */
function DropShowcase({
    grade,
    reveal,
    onClose,
}: {
    grade: Grade;
    reveal: GradeReveal;
    onClose: () => void;
}) {
    const { t } = useTranslation();
    const reducedMotion = useReducedMotion();
    const { rarity, delta, above, trendColor, subjectLabel, dateLabel } =
        reveal;
    const width = Math.min(260, Math.round(window.innerWidth * 0.68));
    const title = [subjectLabel, grade.name].filter(Boolean).join(" | ");

    return (
        <motion.div
            key="drop"
            className="relative flex w-full flex-col items-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-400">
                {t("gradesPage.caseOpening.received")}
            </p>

            <div className="relative" style={{ width }}>
                <SpinningRays color={`${rarity.color}55`} opacity={1} />
                <span
                    className="pointer-events-none absolute inset-x-[5%] -bottom-6 h-10 rounded-full blur-2xl"
                    style={{ background: rarity.glow }}
                />

                {!reducedMotion &&
                    [0, 0.18].map((delay) => (
                        <motion.span
                            key={delay}
                            className="pointer-events-none absolute left-1/2 top-1/2 size-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
                            style={{ borderColor: rarity.color }}
                            initial={{ scale: 0.2, opacity: 0.9 }}
                            animate={{ scale: 6, opacity: 0 }}
                            transition={{
                                duration: 1,
                                delay: 0.15 + delay,
                                ease: "easeOut",
                            }}
                        />
                    ))}
                {!reducedMotion && <DropSparks rarity={rarity} />}

                <motion.div
                    className="relative overflow-hidden rounded-md bg-[#1b1e25]"
                    style={{
                        boxShadow: `0 0 0 1px ${rarity.color}, 0 0 44px -4px ${rarity.glow}, 0 20px 40px rgba(0,0,0,0.6)`,
                    }}
                    initial={
                        reducedMotion
                            ? { opacity: 0 }
                            : { opacity: 0, scale: 0.5, y: 40 }
                    }
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 18,
                    }}
                >
                    <div className="relative aspect-[4/3]">
                        <ItemArt rarity={rarity} value={grade.grade} large />
                        {reveal.bigWin && !reducedMotion && (
                            <span
                                className="pointer-events-none absolute inset-y-0 left-0 w-1/3"
                                style={{
                                    background:
                                        "linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent)",
                                    animation:
                                        "cs2-sweep 2.8s ease-in-out infinite",
                                }}
                            />
                        )}
                    </div>
                    <span
                        className="block h-1"
                        style={{
                            background: rarity.color,
                            boxShadow: `0 0 10px ${rarity.glow}`,
                        }}
                    />
                    <div className="px-3 py-2">
                        <p className="truncate text-sm font-semibold text-white">
                            {title}
                        </p>
                        <p
                            className="font-mono text-[10px] font-bold uppercase tracking-[0.2em]"
                            style={{ color: rarity.color }}
                        >
                            {t(rarity.labelKey)}
                        </p>
                    </div>
                </motion.div>
            </div>

            <motion.div
                className="mt-4 flex flex-col items-center gap-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.4 }}
            >
                {delta !== null && (
                    <div
                        className="flex items-center gap-2 rounded-sm px-3 py-1.5"
                        style={{
                            backgroundColor: `${trendColor}1f`,
                            boxShadow: `inset 0 0 0 1px ${trendColor}66`,
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
                    </div>
                )}

                {dateLabel && (
                    <p className="font-mono text-xs uppercase tracking-wider text-zinc-500">
                        {dateLabel}
                    </p>
                )}

                <Button
                    className="rounded-sm bg-amber-400 px-6 font-bold uppercase tracking-wider text-zinc-950 hover:bg-amber-300"
                    onClick={onClose}
                >
                    {t("gradesPage.caseOpening.continue")}
                </Button>
            </motion.div>
        </motion.div>
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
    const tickerGlowRef = useRef<HTMLDivElement>(null);
    const lastTick = useRef<number | null>(null);
    const lastBuzz = useRef(0);
    const lastTickSound = useRef(0);
    const [containerWidth, setContainerWidth] = useState(0);
    const [phase, setPhase] = useState<Phase>("case");

    // Covert / gold get the full CS2 treatment: flash, rings and a shake
    const reveal = useGradeReveal(grade);
    const { value: wonValue, rarity: wonRarity, bigWin } = reveal;

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
    // Nothing to spin for (unparseable grade or reduced motion): the unlock
    // goes straight to the drop
    const canSpin = containerWidth > 0 && !reducedMotion && wonValue !== null;
    const landed = phase === "landed" || phase === "drop";

    const unlock = () => {
        if (phase !== "case") return;
        vibrate([10, 40, 18]);
        setPhase(canSpin ? "unlocking" : "drop");
    };

    useEffect(() => {
        if (phase === "unlocking") {
            const timer = window.setTimeout(() => setPhase("spin"), UNLOCK_MS);
            return () => window.clearTimeout(timer);
        }
        if (phase === "landed") {
            playSound("cs2Reveal");
            vibrate(bigWin ? [20, 40, 60] : 20);
            const timer = window.setTimeout(
                () => setPhase("drop"),
                LANDED_HOLD_MS
            );
            return () => window.clearTimeout(timer);
        }
    }, [phase, bigWin]);

    // Every item crossing the ticker flashes it, like the CS2 reel "tick".
    // Straight through the DOM: this fires dozens of times per spin.
    const onReelUpdate = (latest: { x?: unknown }) => {
        if (typeof latest.x !== "number") return;
        const tick = Math.floor((containerWidth / 2 - latest.x) / PITCH);
        if (tick === lastTick.current) return;
        const first = lastTick.current === null;
        lastTick.current = tick;
        if (first) return;

        tickerGlowRef.current?.animate(
            [
                { opacity: 1, transform: "translateX(-50%) scaleX(1)" },
                { opacity: 0, transform: "translateX(-50%) scaleX(3)" },
            ],
            { duration: 220, easing: "ease-out" }
        );
        // At full speed this would be one long buzz: cap the tick rate
        const now = performance.now();
        if (now - lastTickSound.current > MIN_TICK_GAP_MS) {
            lastTickSound.current = now;
            playSound("cs2Tick", 0.6);
        }
        if (now - lastBuzz.current > 60) {
            lastBuzz.current = now;
            vibrate(4);
        }
    };

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
            onClick={phase === "drop" ? onClose : undefined}
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
                    opacity: landed ? 1 : 0,
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
                {(phase === "unlocking" || phase === "landed") &&
                    !reducedMotion && (
                        <motion.div
                            key={`flash-${phase}`}
                            className="pointer-events-none absolute inset-0 bg-white"
                            initial={{ opacity: 0 }}
                            animate={{
                                opacity:
                                    phase === "landed"
                                        ? [0, bigWin ? 0.75 : 0.4, 0]
                                        : [0, 0, 0.5, 0],
                            }}
                            exit={{ opacity: 0 }}
                            transition={
                                phase === "landed"
                                    ? { duration: 0.6, times: [0, 0.1, 1] }
                                    : {
                                          duration: UNLOCK_MS / 1000,
                                          times: [0, 0.6, 0.75, 1],
                                      }
                            }
                        />
                    )}
            </AnimatePresence>

            <motion.div
                className="relative flex w-full max-w-2xl flex-col items-center"
                animate={
                    phase === "landed" && bigWin && !reducedMotion
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

                {/* Always mounted, so the reel width is known before it runs */}
                <div
                    ref={containerRef}
                    className="relative flex w-full flex-col items-center"
                >
                    <AnimatePresence mode="wait">
                        {(phase === "case" || phase === "unlocking") && (
                            <motion.div
                                key="case"
                                className="flex w-full flex-col items-center gap-8"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{
                                    opacity: 0,
                                    transition: { duration: 0.2 },
                                }}
                                transition={{ duration: 0.4 }}
                            >
                                <div className="relative mt-4">
                                    <SpinningRays
                                        color="rgba(251,191,36,0.10)"
                                        opacity={1}
                                    />
                                    <WeaponCase
                                        opening={phase === "unlocking"}
                                    />
                                </div>

                                <motion.div
                                    className="flex w-full flex-col items-center gap-5"
                                    animate={{
                                        opacity: phase === "unlocking" ? 0 : 1,
                                    }}
                                >
                                    <CaseContents />
                                    <Button
                                        className="relative gap-2 rounded-sm bg-amber-400 px-6 font-bold uppercase tracking-wider text-zinc-950 hover:bg-amber-300"
                                        disabled={phase !== "case"}
                                        onClick={unlock}
                                    >
                                        {!reducedMotion && (
                                            // A ring pushed out by the same
                                            // distance on every side, not scaled:
                                            // a wide button would grow sideways
                                            <motion.span
                                                className="pointer-events-none absolute rounded-md border-2 border-amber-300"
                                                initial={{
                                                    top: 0,
                                                    right: 0,
                                                    bottom: 0,
                                                    left: 0,
                                                }}
                                                animate={{
                                                    top: [0, -10],
                                                    right: [0, -10],
                                                    bottom: [0, -10],
                                                    left: [0, -10],
                                                    opacity: [0.8, 0],
                                                }}
                                                transition={{
                                                    duration: 1.4,
                                                    repeat: Infinity,
                                                    ease: "easeOut",
                                                }}
                                            />
                                        )}
                                        <KeyRound className="size-4" />
                                        {t("gradesPage.caseOpening.unlock")}
                                    </Button>
                                </motion.div>
                            </motion.div>
                        )}

                        {(phase === "spin" || phase === "landed") && (
                            <motion.div
                                key="reel"
                                className="relative w-full py-2"
                                initial={{ opacity: 0, scaleY: 0.6 }}
                                animate={{ opacity: 1, scaleY: 1 }}
                                exit={{
                                    opacity: 0,
                                    scale: 0.95,
                                    transition: { duration: 0.25 },
                                }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                            >
                                <CornerBrackets />
                                <div
                                    className="relative w-full overflow-hidden bg-black/40 py-2 shadow-[inset_0_0_30px_rgba(0,0,0,0.85)] [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]"
                                    style={{ height: ITEM_HEIGHT + 16 }}
                                >
                                    <motion.div
                                        className="flex"
                                        style={{ gap: ITEM_GAP }}
                                        initial={{ x: 0 }}
                                        animate={{ x: targetX }}
                                        transition={{
                                            duration: SPIN_DURATION,
                                            ease: [0.08, 0.84, 0.12, 1],
                                        }}
                                        onUpdate={onReelUpdate}
                                        onAnimationComplete={() =>
                                            setPhase("landed")
                                        }
                                    >
                                        {items.map((item, index) => (
                                            <ReelItemCard
                                                key={index}
                                                item={item}
                                                won={
                                                    landed &&
                                                    index === WINNER_INDEX
                                                }
                                                dimmed={
                                                    landed &&
                                                    index !== WINNER_INDEX
                                                }
                                            />
                                        ))}
                                    </motion.div>

                                    {landed && (
                                        <motion.span
                                            className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 blur-md"
                                            style={{
                                                width: ITEM_WIDTH,
                                                background: `linear-gradient(180deg, transparent, ${wonRarity.glow}, transparent)`,
                                            }}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: [0, 0.9, 0.3] }}
                                            transition={{
                                                duration: 0.8,
                                                ease: "easeOut",
                                            }}
                                        />
                                    )}

                                    <div className="pointer-events-none absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-amber-400 shadow-[0_0_12px_3px_rgba(245,158,11,0.75)]" />
                                    <div
                                        ref={tickerGlowRef}
                                        className="pointer-events-none absolute inset-y-0 left-1/2 w-2 bg-amber-300 opacity-0 blur-[3px]"
                                        style={{
                                            transform: "translateX(-50%)",
                                        }}
                                    />
                                    <div
                                        className="pointer-events-none absolute left-1/2 top-0 size-0 -translate-x-1/2"
                                        style={{
                                            borderLeft: "7px solid transparent",
                                            borderRight:
                                                "7px solid transparent",
                                            borderTop: "10px solid #fbbf24",
                                        }}
                                    />
                                    <div
                                        className="pointer-events-none absolute bottom-0 left-1/2 size-0 -translate-x-1/2"
                                        style={{
                                            borderLeft: "7px solid transparent",
                                            borderRight:
                                                "7px solid transparent",
                                            borderBottom: "10px solid #fbbf24",
                                        }}
                                    />
                                </div>
                            </motion.div>
                        )}

                        {phase === "drop" && (
                            <DropShowcase
                                key="drop"
                                grade={grade}
                                reveal={reveal}
                                onClose={onClose}
                            />
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </motion.div>
    );
}
