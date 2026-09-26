import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Grade } from "@/types/aurion";
import { Button } from "@/components/ui/button";
import { GRADE_SCALE } from "@/lib/utils/grade-rarity";
import { formatTicketSerial, useGradeReveal } from "./use-grade-reveal";

/** Share of the foil that has to go before the ticket opens itself */
const SCRATCH_THRESHOLD = 0.45;
const BRUSH_RADIUS = 26;
/** Alpha sampling step, in device pixels: cheap enough to run while scratching */
const SAMPLE_STEP = 8;

const vibrate = (pattern: number | number[]) => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(pattern);
    }
};

/** Deterministic PRNG, so a ticket keeps its barcode across openings */
const mulberry32 = (seed: number) => () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** Four-pointed twinkle, as printed all over real scratch tickets */
const STAR_CLIP =
    "polygon(50% 0%, 61% 39%, 100% 50%, 61% 61%, 50% 100%, 39% 61%, 0% 50%, 39% 39%)";

/** The "up to 20/20!" price flash, a 16-spike starburst */
const STARBURST_CLIP = `polygon(${Array.from({ length: 32 }, (_, index) => {
    const angle = (index / 32) * Math.PI * 2;
    const radius = index % 2 === 0 ? 50 : 41;
    return `${(50 + radius * Math.cos(angle)).toFixed(2)}% ${(50 + radius * Math.sin(angle)).toFixed(2)}%`;
}).join(", ")})`;

/** Chunky gold logo lettering, extruded downwards */
const LOGO_SHADOW =
    "0 1px 0 #d97706, 0 2px 0 #b45309, 0 3px 0 #92400e, 0 4px 0 #78350f, 0 7px 12px rgba(0,0,0,0.55)";

/** Security print under the foil, the fine rings of a banknote */
const GUILLOCHE =
    "repeating-radial-gradient(circle at 18% 30%, rgba(5,150,105,0.08) 0 1px, transparent 1px 7px), repeating-radial-gradient(circle at 82% 72%, rgba(217,119,6,0.08) 0 1px, transparent 1px 7px)";

/** Half-circle cut-outs on one edge, the two halves of the tear-off line */
const perforationMask = (edge: "top" | "bottom") => {
    const y = edge === "top" ? "0" : "100%";
    return `radial-gradient(circle 11px at 0 ${y}, transparent 98%, #000 100%) left / 51% 100% no-repeat, radial-gradient(circle 11px at 100% ${y}, transparent 98%, #000 100%) right / 51% 100% no-repeat`;
};

const GOLD_COIN =
    "radial-gradient(circle at 32% 28%, #fffbeb, #fde047 30%, #eab308 62%, #a16207)";

/** Glints twinkling on the untouched foil, begging to be scratched */
function FoilGlints({ cleared }: { cleared: boolean }) {
    const glints = useMemo(
        () =>
            Array.from({ length: 6 }, () => ({
                left: 8 + Math.random() * 84,
                top: 12 + Math.random() * 76,
                size: 10 + Math.random() * 8,
                delay: Math.random() * 2.4,
                pause: 1.2 + Math.random() * 1.6,
            })),
        []
    );

    return (
        <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-300"
            style={{ opacity: cleared ? 0 : 1 }}
        >
            {glints.map((glint, index) => (
                <motion.span
                    key={index}
                    className="absolute bg-white"
                    style={{
                        left: `${glint.left}%`,
                        top: `${glint.top}%`,
                        width: glint.size,
                        height: glint.size,
                        clipPath: STAR_CLIP,
                        filter: "drop-shadow(0 0 3px #fff)",
                    }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{
                        scale: [0, 1, 0],
                        opacity: [0, 1, 0],
                        rotate: [0, 90],
                    }}
                    transition={{
                        duration: 1.1,
                        delay: glint.delay,
                        repeat: Infinity,
                        repeatDelay: glint.pause,
                        ease: "easeInOut",
                    }}
                />
            ))}
        </div>
    );
}

type Flake = { id: number; x: number; y: number; drift: number; spin: number };

/** The silver foil: an opaque canvas the user erases with the pointer. */
function ScratchFoil({
    label,
    cleared,
    onCleared,
}: {
    label: string;
    cleared: boolean;
    onCleared: () => void;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const lastPoint = useRef<{ x: number; y: number } | null>(null);
    const coinRef = useRef<HTMLSpanElement>(null);
    const strokes = useRef(0);
    const done = useRef(false);
    // Foil shavings falling off the coin while scratching
    const [flakes, setFlakes] = useState<Flake[]>([]);
    const flakeId = useRef(0);

    const paintFoil = useCallback(
        (canvas: HTMLCanvasElement) => {
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            const { width, height } = canvas;
            ctx.globalCompositeOperation = "source-over";
            ctx.clearRect(0, 0, width, height);

            const silver = ctx.createLinearGradient(0, 0, width, height);
            silver.addColorStop(0, "#9aa1ab");
            silver.addColorStop(0.35, "#e3e7ec");
            silver.addColorStop(0.55, "#b9c0c9");
            silver.addColorStop(0.8, "#eef1f5");
            silver.addColorStop(1, "#98a0aa");
            ctx.fillStyle = silver;
            ctx.fillRect(0, 0, width, height);

            // Brushed-metal speckles
            const random = mulberry32(1337);
            ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
            for (let i = 0; i < Math.round((width * height) / 600); i++) {
                ctx.fillRect(random() * width, random() * height, 2, 1);
            }
            ctx.fillStyle = "rgba(90, 98, 110, 0.18)";
            for (let i = 0; i < Math.round((width * height) / 900); i++) {
                ctx.fillRect(random() * width, random() * height, 1, 2);
            }

            // Diagonal sheen
            const sheen = ctx.createLinearGradient(0, height, width, 0);
            sheen.addColorStop(0, "rgba(255, 255, 255, 0)");
            sheen.addColorStop(0.45, "rgba(255, 255, 255, 0.35)");
            sheen.addColorStop(0.6, "rgba(255, 255, 255, 0)");
            ctx.fillStyle = sheen;
            ctx.fillRect(0, 0, width, height);

            const scale = width / 320;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            // Printed stars all over the foil, on a slant
            ctx.save();
            ctx.translate(width / 2, height / 2);
            ctx.rotate(-0.35);
            ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
            ctx.font = `700 ${Math.round(11 * scale)}px sans-serif`;
            const stepX = 34 * scale;
            const stepY = 22 * scale;
            const reach = Math.max(width, height);
            for (let row = -reach / stepY; row <= reach / stepY; row++) {
                for (let col = -reach / stepX; col <= reach / stepX; col++) {
                    const offset = (Math.round(row) % 2) * (stepX / 2);
                    ctx.fillText("✦", col * stepX + offset, row * stepY);
                }
            }
            ctx.restore();

            // Central label on a dark printed pill
            const text = label.toUpperCase();
            ctx.font = `800 ${Math.round(15 * scale)}px ui-monospace, monospace`;
            const pillWidth = ctx.measureText(text).width + 30 * scale;
            const pillHeight = 34 * scale;
            ctx.fillStyle = "rgba(55, 62, 74, 0.85)";
            ctx.beginPath();
            ctx.roundRect(
                (width - pillWidth) / 2,
                (height - pillHeight) / 2,
                pillWidth,
                pillHeight,
                pillHeight / 2
            );
            ctx.fill();
            ctx.fillStyle = "#f4f6f8";
            ctx.fillText(text, width / 2, height / 2 + scale);
        },
        [label]
    );

    useLayoutEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.max(1, Math.round(rect.width * ratio));
        canvas.height = Math.max(1, Math.round(rect.height * ratio));
        paintFoil(canvas);
    }, [paintFoil]);

    const finish = useCallback(() => {
        if (done.current) return;
        done.current = true;
        vibrate(14);
        onCleared();
    }, [onCleared]);

    /** Ratio of fully erased pixels, sampled on a coarse grid */
    const measure = useCallback((canvas: HTMLCanvasElement) => {
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return 0;

        const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let total = 0;
        let clearedPixels = 0;
        for (let y = 0; y < canvas.height; y += SAMPLE_STEP) {
            for (let x = 0; x < canvas.width; x += SAMPLE_STEP) {
                total++;
                if (data[(y * canvas.width + x) * 4 + 3]! < 24) clearedPixels++;
            }
        }
        return total === 0 ? 0 : clearedPixels / total;
    }, []);

    const scratch = useCallback(
        (event: React.PointerEvent<HTMLCanvasElement>) => {
            const canvas = canvasRef.current;
            if (!canvas || done.current) return;

            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            if (!ctx) return;

            const rect = canvas.getBoundingClientRect();
            const scale = canvas.width / rect.width;
            const x = (event.clientX - rect.left) * scale;
            const y = (event.clientY - rect.top) * scale;
            const radius = BRUSH_RADIUS * scale;

            ctx.globalCompositeOperation = "destination-out";
            ctx.lineWidth = radius * 2;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.beginPath();
            const from = lastPoint.current ?? { x, y };
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(x, y);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
            lastPoint.current = { x, y };

            strokes.current++;
            if (strokes.current % 3 === 0) {
                const flake: Flake = {
                    id: flakeId.current++,
                    x: event.clientX - rect.left,
                    y: event.clientY - rect.top,
                    drift: (Math.random() - 0.5) * 50,
                    spin: (Math.random() - 0.5) * 720,
                };
                setFlakes((current) => [...current.slice(-30), flake]);
            }

            // Reading back pixels is the expensive part: only every few strokes
            if (
                strokes.current % 6 === 0 &&
                measure(canvas) >= SCRATCH_THRESHOLD
            ) {
                finish();
            }
        },
        [finish, measure]
    );

    // The coin doing the scratching follows the pointer, straight through the
    // DOM: this runs on every pointer move
    const moveCoin = (
        event: React.PointerEvent<HTMLCanvasElement>,
        visible: boolean
    ) => {
        const coin = coinRef.current;
        if (!coin) return;
        const rect = event.currentTarget.getBoundingClientRect();
        // Above the finger on touch screens, or it would hide the coin
        const lift = event.pointerType === "touch" ? 34 : 0;
        coin.style.transform = `translate(${event.clientX - rect.left}px, ${event.clientY - rect.top - lift}px) rotate(-24deg)`;
        coin.style.opacity = visible ? "1" : "0";
    };

    return (
        <>
            <canvas
                ref={canvasRef}
                className="absolute inset-0 size-full cursor-none rounded-[9px] transition-opacity duration-500"
                style={{
                    touchAction: "none",
                    opacity: cleared ? 0 : 1,
                    pointerEvents: cleared ? "none" : "auto",
                }}
                onPointerDown={(event) => {
                    event.currentTarget.setPointerCapture(event.pointerId);
                    lastPoint.current = null;
                    moveCoin(event, true);
                    scratch(event);
                }}
                onPointerMove={(event) => {
                    moveCoin(event, true);
                    if (event.buttons === 0) return;
                    scratch(event);
                }}
                onPointerUp={(event) => {
                    lastPoint.current = null;
                    if (event.pointerType === "touch") moveCoin(event, false);
                }}
                onPointerLeave={(event) => moveCoin(event, false)}
                onPointerCancel={(event) => {
                    lastPoint.current = null;
                    moveCoin(event, false);
                }}
            />
            <FoilGlints cleared={cleared} />
            {!cleared && (
                <span
                    ref={coinRef}
                    className="pointer-events-none absolute left-0 top-0 z-10 -ml-[17px] -mt-[17px] flex size-[34px] items-center justify-center rounded-full opacity-0 transition-opacity duration-150"
                    style={{
                        background: GOLD_COIN,
                        boxShadow:
                            "inset 0 0 0 2px rgba(161,98,7,0.6), 0 4px 10px rgba(0,0,0,0.45)",
                    }}
                >
                    <span className="size-5 rounded-full border border-amber-700/50" />
                </span>
            )}
            {flakes.map((flake) => (
                <motion.span
                    key={flake.id}
                    className="pointer-events-none absolute size-1.5 rounded-[1px]"
                    style={{
                        left: flake.x,
                        top: flake.y,
                        background: "linear-gradient(135deg, #eef1f5, #8b939e)",
                    }}
                    initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
                    animate={{
                        x: flake.drift,
                        y: 60 + Math.abs(flake.drift),
                        opacity: 0,
                        rotate: flake.spin,
                    }}
                    transition={{ duration: 0.7, ease: "easeIn" }}
                    onAnimationComplete={() =>
                        setFlakes((current) =>
                            current.filter((entry) => entry.id !== flake.id)
                        )
                    }
                />
            ))}
        </>
    );
}

/** Where the grade sits on the /20 scale, clamped to 0…1 */
const gradeRatio = (value: number | null): number =>
    value === null ? 0 : Math.min(1, Math.max(0, value / GRADE_SCALE));

/** How many coins the grade is worth: a 4/20 drips, a 20/20 pours. */
const coinCountForGrade = (value: number | null): number =>
    Math.round(gradeRatio(value) ** 2 * 42);

/** Payout animation: coins raining over the ticket once it is scratched. */
function CoinRain({
    count,
    intensity,
    seed,
}: {
    count: number;
    /** 0…1: a great grade keeps pouring long after a mediocre one stopped */
    intensity: number;
    seed: number;
}) {
    const coins = useMemo(() => {
        const random = mulberry32(seed ^ 0x9e3779b9);
        const spin = () => (random() > 0.5 ? 1 : -1) * (360 + random() * 720);
        return Array.from({ length: count }, () => {
            const size = 14 + random() * 14;
            // No delay: they all leave the moment the ticket opens, the spread
            // comes from how high above the screen they start
            const startY = -10 - random() * 45 * (1 + intensity * 2.5);
            // Constant fall speed, so a longer drop simply lasts longer
            const speed = 55 + random() * 35;
            return {
                left: random() * 100,
                size,
                thickness: Math.max(3, size * 0.16),
                startY,
                duration: (115 - startY) / speed,
                drift: (random() - 0.5) * 70,
                spinX: spin(),
                spinY: spin(),
                spinZ: spin(),
            };
        });
    }, [count, intensity, seed]);

    return (
        <div
            className="pointer-events-none absolute inset-0 overflow-hidden"
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
                    initial={{ y: `${coin.startY}vh`, opacity: 0 }}
                    animate={{
                        y: "115vh",
                        x: coin.drift,
                        rotateX: coin.spinX,
                        rotateY: coin.spinY,
                        rotateZ: coin.spinZ,
                        opacity: [0, 1, 1, 0.85],
                    }}
                    transition={{ duration: coin.duration, ease: "easeIn" }}
                >
                    {/* Stacked discs: the coin keeps a body when seen edge-on */}
                    {[-0.5, -0.25, 0, 0.25, 0.5].map((offset) => (
                        <span
                            key={offset}
                            className="absolute inset-0 rounded-full"
                            style={{
                                transform: `translateZ(${offset * coin.thickness}px)`,
                                background:
                                    offset === 0.5 || offset === -0.5
                                        ? "radial-gradient(circle at 32% 28%, #fde68a, #f59e0b 55%, #b45309)"
                                        : "#b45309",
                                boxShadow:
                                    offset === 0.5
                                        ? "inset 0 0 0 1px rgba(255, 255, 255, 0.45)"
                                        : undefined,
                            }}
                        />
                    ))}
                </motion.span>
            ))}
        </div>
    );
}

/** Full-screen scratch ticket for an unopened grade. */
export function ScratchCard({
    grade,
    onClose,
}: {
    grade: Grade;
    onClose: () => void;
}) {
    const { t } = useTranslation();
    const reducedMotion = useReducedMotion();
    const {
        value,
        rarity,
        bigWin,
        delta,
        above,
        trendColor,
        subjectLabel,
        dateLabel,
        seed,
    } = useGradeReveal(grade);

    // Nothing to scratch for (unparseable grade or reduced motion): hand it over
    const [revealed, setRevealed] = useState(
        () => value === null || Boolean(reducedMotion)
    );

    useEffect(() => {
        if (!revealed) return;
        vibrate(bigWin ? [18, 60, 32] : 14);
    }, [revealed, bigWin]);

    const coinCount = coinCountForGrade(value);

    const bars = useMemo(() => {
        const random = mulberry32(seed);
        return Array.from({ length: 34 }, () => 1 + Math.round(random() * 2));
    }, [seed]);

    return (
        <motion.div
            className="fixed inset-0 z-100 flex flex-col items-center justify-center overflow-hidden px-6"
            style={{
                paddingTop: "var(--safe-area-top)",
                paddingBottom: "var(--safe-area-bottom)",
                backgroundColor: "#04110c",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: "easeInOut" }}
            onClick={revealed ? onClose : undefined}
        >
            {/* Tobacconist-counter backdrop: felt green, slow light rays, vignette */}
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    backgroundImage:
                        "repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0 10px, transparent 10px 20px), radial-gradient(ellipse at 50% 40%, #10371f 0%, #04110c 72%)",
                }}
            />
            <div
                className="fdj-rays pointer-events-none absolute left-1/2 top-1/2 size-[170vmax] -translate-x-1/2 -translate-y-1/2 transition-opacity duration-700"
                style={{
                    background: `repeating-conic-gradient(${revealed ? rarity.glow : "rgba(250,204,21,0.22)"} 0deg 6deg, transparent 6deg 18deg)`,
                    maskImage:
                        "radial-gradient(circle, black 0%, transparent 42%)",
                    WebkitMaskImage:
                        "radial-gradient(circle, black 0%, transparent 42%)",
                    opacity: revealed ? 0.55 : 0.2,
                }}
            />
            <div
                className="pointer-events-none absolute inset-0 transition-opacity duration-700"
                style={{
                    opacity: revealed ? 1 : 0,
                    background: `radial-gradient(ellipse at center, ${rarity.glow} -50%, transparent 60%)`,
                }}
            />
            <div
                className="pointer-events-none absolute inset-0"
                style={{ boxShadow: "inset 0 0 160px 40px rgba(0,0,0,0.85)" }}
            />

            <motion.div
                className="relative w-full max-w-sm"
                onClick={(event) => event.stopPropagation()}
                initial={
                    reducedMotion
                        ? false
                        : { y: 90, rotate: -7, scale: 0.9, opacity: 0 }
                }
                animate={
                    revealed && bigWin && !reducedMotion
                        ? {
                              y: 0,
                              scale: 1,
                              opacity: 1,
                              rotate: [0, -1.5, 1.5, -1, 1, 0],
                          }
                        : { y: 0, rotate: 0, scale: 1, opacity: 1 }
                }
                transition={{
                    type: "spring",
                    stiffness: 170,
                    damping: 18,
                    rotate: { duration: 0.45, ease: "easeOut" },
                }}
            >
                {/* Cast shadow on the counter */}
                <div className="pointer-events-none absolute inset-x-6 bottom-0 top-10 translate-y-5 rounded-3xl bg-black/70 blur-2xl" />

                {/* Printed body: emerald sunburst, gold logo, price flash */}
                <div
                    className="relative overflow-hidden rounded-t-2xl px-4 pb-5 pl-6 pt-3"
                    style={{
                        background:
                            "repeating-conic-gradient(from 0deg at 50% 12%, rgba(255,255,255,0.07) 0deg 7deg, transparent 7deg 14deg), radial-gradient(ellipse at 50% 8%, #34d399 0%, #059669 32%, #065f46 68%, #053d2e 100%)",
                        mask: perforationMask("bottom"),
                        WebkitMask: perforationMask("bottom"),
                    }}
                >
                    {/* Holographic security strip */}
                    <span className="fdj-holo pointer-events-none absolute inset-y-0 left-0 w-2.5" />

                    <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-emerald-100/70">
                            {t("gradesPage.clickToScratchShort")}
                        </span>
                        <span className="shrink-0 rounded-full bg-emerald-950/40 px-2 py-0.5 font-mono text-[9px] font-bold tracking-widest text-emerald-50/85 ring-1 ring-white/15">
                            {formatTicketSerial(seed)}
                        </span>
                    </div>

                    <div className="mt-2 flex items-center gap-3">
                        <div className="min-w-0 flex-1">
                            <p
                                className="text-[28px] font-black uppercase italic leading-[0.95] tracking-tight text-yellow-300"
                                style={{ textShadow: LOGO_SHADOW }}
                            >
                                {t("gradesPage.scratchCard.ticketName")}
                            </p>
                            <p className="mt-2.5 truncate text-sm font-semibold text-white">
                                {grade.name}
                            </p>
                            <p className="truncate font-mono text-[10px] uppercase tracking-wider text-emerald-100/75">
                                {[subjectLabel, dateLabel]
                                    .filter(Boolean)
                                    .join(" — ")}
                            </p>
                        </div>
                        <motion.div
                            className="relative flex size-20 shrink-0 flex-col items-center justify-center text-center"
                            style={{
                                clipPath: STARBURST_CLIP,
                                background:
                                    "radial-gradient(circle at 40% 35%, #f87171, #dc2626 55%, #991b1b)",
                            }}
                            animate={
                                reducedMotion
                                    ? undefined
                                    : {
                                          rotate: [-8, 8, -8],
                                          scale: [1, 1.07, 1],
                                      }
                            }
                            transition={{
                                duration: 2.4,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        >
                            <span className="text-[9px] font-bold uppercase leading-none text-yellow-100">
                                {t("gradesPage.scratchCard.upTo")}
                            </span>
                            <span
                                className="text-lg font-black leading-tight text-white"
                                style={{ textShadow: "0 1px 0 #7f1d1d" }}
                            >
                                {`${GRADE_SCALE}/${GRADE_SCALE}`}
                            </span>
                        </motion.div>
                    </div>

                    {/* Scratch zone in an embossed gold frame */}
                    <div
                        className="relative mt-4 rounded-xl p-[3px]"
                        style={{
                            background:
                                "linear-gradient(135deg, #fef3c7, #d97706 35%, #fde68a 60%, #b45309)",
                            boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
                        }}
                    >
                        <div
                            className="relative overflow-hidden rounded-[9px]"
                            style={{
                                backgroundColor: "#fffdf5",
                                backgroundImage: GUILLOCHE,
                            }}
                        >
                            <div className="flex min-h-44 flex-col items-center justify-center gap-2 px-4 py-5">
                                <div className="flex items-baseline gap-1">
                                    <span
                                        className="font-mono text-6xl font-bold"
                                        style={{
                                            color: rarity.color,
                                            textShadow: `0 2px 18px ${rarity.glow}`,
                                        }}
                                    >
                                        {grade.grade}
                                    </span>
                                    <span className="font-mono text-xl text-zinc-400">
                                        {`/${GRADE_SCALE}`}
                                    </span>
                                </div>
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
                            </div>

                            <AnimatePresence>
                                {revealed && (
                                    <motion.span
                                        key="stamp"
                                        className="pointer-events-none absolute right-2 top-2 -rotate-12 rounded-sm border-2 px-2 py-0.5 font-mono text-[11px] font-black uppercase tracking-[0.18em]"
                                        style={{
                                            color: trendColor,
                                            borderColor: trendColor,
                                            opacity: 0.85,
                                        }}
                                        initial={{ scale: 2.2, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 0.85 }}
                                        transition={{
                                            duration: 0.3,
                                            delay: 0.25,
                                        }}
                                    >
                                        {t(
                                            above
                                                ? "gradesPage.scratchCard.winner"
                                                : "gradesPage.scratchCard.loser"
                                        )}
                                    </motion.span>
                                )}
                            </AnimatePresence>

                            {value !== null && !reducedMotion && (
                                <ScratchFoil
                                    label={t(
                                        "gradesPage.scratchCard.scratchHere"
                                    )}
                                    cleared={revealed}
                                    onCleared={() => setRevealed(true)}
                                />
                            )}
                        </div>
                    </div>

                    {/* Gleam across the printed body once it pays out */}
                    {revealed && !reducedMotion && (
                        <motion.span
                            className="pointer-events-none absolute inset-y-0 left-0 w-1/2 -skew-x-12"
                            style={{
                                background: bigWin
                                    ? "linear-gradient(90deg, transparent, rgba(250,204,21,0.45), rgba(255,255,255,0.8), rgba(250,204,21,0.45), transparent)"
                                    : "linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)",
                                mixBlendMode: "overlay",
                            }}
                            initial={{ x: "-120%" }}
                            animate={{ x: "260%" }}
                            transition={{
                                duration: 0.9,
                                delay: 0.2,
                                ease: "easeInOut",
                                repeat: bigWin ? 1 : 0,
                                repeatDelay: 0.4,
                            }}
                        />
                    )}
                </div>

                {/* Tear-off stub: barcode, serial and the small print */}
                <div
                    className="relative rounded-b-2xl px-5 pb-4 pt-3"
                    style={{
                        backgroundColor: "#f7f2e6",
                        backgroundImage:
                            "repeating-linear-gradient(90deg, rgba(16,55,31,0.04) 0 2px, transparent 2px 6px)",
                        mask: perforationMask("top"),
                        WebkitMask: perforationMask("top"),
                    }}
                >
                    <span className="pointer-events-none absolute inset-x-4 top-0 border-t-2 border-dashed border-emerald-900/25" />
                    <div className="flex h-8 items-end justify-center gap-[2px]">
                        {bars.map((width, index) => (
                            <span
                                key={index}
                                className="h-full bg-zinc-900"
                                style={{
                                    width,
                                    opacity: index % 3 === 0 ? 0.9 : 0.6,
                                }}
                            />
                        ))}
                    </div>
                    <p className="mt-1 text-center font-mono text-[9px] tracking-[0.3em] text-zinc-600">
                        {formatTicketSerial(seed)}
                    </p>
                    <p className="mt-1.5 text-center font-mono text-[10px] leading-tight text-zinc-700">
                        {t("gradesPage.scratchCard.smallPrint")}
                    </p>
                </div>

                <div className="relative mt-5 flex justify-center">
                    <Button
                        className="rounded-full bg-amber-400 px-6 font-bold uppercase tracking-wider text-emerald-950 shadow-[0_0_20px_rgba(251,191,36,0.35)] hover:bg-amber-300"
                        onClick={revealed ? onClose : () => setRevealed(true)}
                    >
                        {t(
                            revealed
                                ? "gradesPage.caseOpening.continue"
                                : "gradesPage.scratchCard.revealAll"
                        )}
                    </Button>
                </div>
            </motion.div>

            {revealed && !reducedMotion && coinCount > 0 && (
                <CoinRain
                    count={coinCount}
                    intensity={gradeRatio(value)}
                    seed={seed}
                />
            )}
        </motion.div>
    );
}
