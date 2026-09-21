import { useEffect, useRef } from "react";

/**
 * The black hole behind the Palantir page: an accretion disk of orbiting
 * particles around a pure black shadow edged by a thin photon ring, with
 * matter spiralling in, shooting stars crossing the void, and sparks
 * drifting up through the starfield.
 *
 * One canvas, one rAF loop, mounted only when the experimental theme is on —
 * everyone else never runs a line of this. Everything is drawn with arcs,
 * radial gradients and ellipses: no conic gradients (Safari only got those in
 * 16), no images, no shaders.
 *
 * Positioned absolutely *inside* the page. Mauria's header sets z-10 but is
 * not positioned, so its z-index is inert and this canvas would paint over
 * it if it reached that high — stacking decides, so the backdrop stays flush
 * with the page top.
 */

type Orbiter = {
    /** Orbit radius, as a fraction of the disk radius. */
    radius: number;
    angle: number;
    speed: number;
    /** Arc length drawn behind the particle. */
    trail: number;
    alpha: number;
    width: number;
};

/** A particle caught falling in: it still orbits, but the orbit decays. */
type Faller = {
    radius: number;
    angle: number;
    alpha: number;
    width: number;
};

type Ember = {
    x: number;
    y: number;
    rise: number;
    sway: number;
    phase: number;
    size: number;
    alpha: number;
};

type Meteor = {
    x: number;
    y: number;
    /** Per-tick velocity, in CSS pixels. */
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
};

/** The disk is seen at a low angle: vertical radii are squashed by this. */
const SQUASH = 0.26;

/** The disk is rolled slightly off-level — it isn't quite horizontal. */
const TILT = -0.12;

const TAU = Math.PI * 2;

const makeOrbiters = (count: number): Orbiter[] =>
    Array.from({ length: count }, () => {
        // Bias towards the inner edge, where a real disk is densest.
        const radius = 0.5 + Math.pow(Math.random(), 1.7) * 0.5;
        return {
            radius,
            angle: Math.random() * TAU,
            // Keplerian-ish: the closer in, the faster it goes round.
            speed: 0.00025 / Math.pow(radius, 1.5),
            trail: 0.1 + Math.random() * 0.3,
            alpha: 0.25 + Math.random() * 0.75,
            width: 0.6 + Math.random() * 1.8,
        };
    });

const makeFallers = (count: number): Faller[] =>
    Array.from({ length: count }, () => ({
        radius: 0.55 + Math.random() * 0.5,
        angle: Math.random() * TAU,
        alpha: 0.3 + Math.random() * 0.5,
        width: 0.7 + Math.random() * 1.1,
    }));

const makeEmbers = (count: number, w: number, h: number): Ember[] =>
    Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        rise: 0.15 + Math.random() * 0.45,
        sway: 6 + Math.random() * 18,
        phase: Math.random() * TAU,
        size: 0.6 + Math.random() * 1.6,
        alpha: 0.2 + Math.random() * 0.6,
    }));

export function PalantirBackdrop({ compact = false }: { compact?: boolean }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const backdropRef = useRef<HTMLDivElement>(null);
    // Read inside the loop so a re-render never restarts the animation.
    const compactRef = useRef(compact);
    compactRef.current = compact;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const reduced = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        let width = 0;
        let height = 0;
        // How much of the canvas the first screenful shows. The page grows
        // with the results list, but the hole must keep its place on screen —
        // anchoring it to the full canvas height would teleport it down the
        // moment results push the page taller.
        let viewHeight = 0;
        let orbiters: Orbiter[] = [];
        let fallers: Faller[] = [];
        let embers: Ember[] = [];
        let meteor: Meteor | null = null;
        let meteorCooldown = 2500;
        let time = 0;
        // Smoothed towards their targets so the hole glides when results come.
        let centerY = 0.42;
        let scale = 1;

        // Parallax tilt, trading-card style: the mouse on desktop, the phone's
        // orientation in the hand. The target is smoothed in the draw loop and
        // handed to the CSS as --pv-px / --pv-py, and every star layer then
        // shifts by its own depth.
        let tiltTargetX = 0;
        let tiltTargetY = 0;
        let tiltX = 0;
        let tiltY = 0;
        const clampTilt = (v: number) => Math.max(-1, Math.min(1, v));

        const onPointerMove = (e: PointerEvent) => {
            if (e.pointerType !== "mouse") return;
            tiltTargetX = clampTilt((e.clientX / window.innerWidth - 0.5) * 2);
            tiltTargetY = clampTilt(
                (e.clientY / window.innerHeight - 0.5) * 2
            );
        };
        const onTilt = (e: DeviceOrientationEvent) => {
            tiltTargetX = clampTilt((e.gamma ?? 0) / 15);
            tiltTargetY = clampTilt(((e.beta ?? 0) - 45) / 15);
        };
        const enableOrientation = () =>
            window.addEventListener("deviceorientation", onTilt);

        let orientationAsk: (() => void) | null = null;
        if (!reduced) {
            window.addEventListener("pointermove", onPointerMove);
            // iOS gates orientation behind a permission only a user gesture
            // can ask for; ask once on the first touch, stay quiet if
            // refused. Android fires the event with no gate.
            const D =
                DeviceOrientationEvent as unknown as {
                    requestPermission?: () => Promise<string>;
                };
            if (typeof D.requestPermission === "function") {
                orientationAsk = () => {
                    D.requestPermission?.()
                        .then((state) => {
                            if (state === "granted") enableOrientation();
                        })
                        .catch(() => {});
                };
                window.addEventListener("touchend", orientationAsk, {
                    once: true,
                });
            } else {
                enableOrientation();
            }
        }

        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const rect = canvas.getBoundingClientRect();
            width = rect.width;
            height = rect.height;
            if (!width || !height) return;
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            // Document coords, so this does not move when the page scrolls.
            const top = rect.top + window.scrollY;
            viewHeight = Math.max(
                1,
                Math.min(height, window.innerHeight - top)
            );

            // Fewer particles on a phone than on a desktop viewport.
            const count = Math.round(
                Math.min(260, Math.max(90, (width * height) / 5200))
            );
            if (count !== orbiters.length) orbiters = makeOrbiters(count);
            fallers = makeFallers(
                Math.round(Math.min(16, Math.max(8, width / 60)))
            );
            embers = makeEmbers(
                Math.round(Math.min(46, Math.max(18, width / 26))),
                width,
                height
            );
        };

        /** The event horizon: a pure black shadow with a thin photon ring. */
        const drawHorizon = (cx: number, cy: number, r: number) => {
            // The shadow: absolutely black — the one thing light never leaves.
            ctx.globalCompositeOperation = "source-over";
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, TAU);
            ctx.fillStyle = "#000";
            ctx.fill();

            // The photon ring: a thin, faint rim of bent light. It is the
            // only light the hole allows near it — the shadow stays black.
            // It breathes: never still, never loud.
            ctx.globalCompositeOperation = "lighter";
            ctx.beginPath();
            ctx.arc(cx, cy, r * 1.02, 0, TAU);
            ctx.strokeStyle = `rgba(215,205,255,${(
                0.4 + 0.1 * Math.sin(time * 0.0011)
            ).toFixed(3)})`;
            ctx.lineWidth = 1.2;
            ctx.stroke();
        };

        const draw = () => {
            const targetY = compactRef.current ? 0.28 : 0.42;
            const targetScale = compactRef.current ? 0.6 : 1;
            centerY += (targetY - centerY) * 0.05;
            scale += (targetScale - scale) * 0.05;

            const cx = width / 2;
            // Anchored to the first screenful, not to the page: see resize().
            const cy = viewHeight * centerY;
            const disk = Math.min(width * 0.44, viewHeight * 0.44) * scale;
            const stone = disk * 0.34;

            ctx.clearRect(0, 0, width, height);

            const drawOrbiter = (p: Orbiter, far: boolean) => {
                // The far half of the orbit is the top of the squashed ellipse.
                if (Math.sin(p.angle) < 0 !== far) return;

                const r = disk * p.radius;
                // A nod to relativistic beaming: the side coming towards the
                // viewer reads brighter than the one going away.
                const beaming = 0.35 + 0.65 * (0.5 + 0.5 * Math.cos(p.angle));
                // Inner orbits run hot (amber), outer ones cool to violet.
                const heat = 1 - (p.radius - 0.5) / 0.5;
                // Density waves: two trailing arms wind through the disk, and
                // a particle rides brighter while it sits inside one.
                const arm =
                    p.angle + Math.log(p.radius) * 3.5 - time * 0.00012;
                const inArm = 0.5 + 0.5 * Math.cos(2 * arm);
                const wave = 0.7 + 0.6 * inArm * inArm * inArm;
                ctx.beginPath();
                ctx.ellipse(
                    cx,
                    cy,
                    r,
                    r * SQUASH,
                    0,
                    p.angle - p.trail,
                    p.angle
                );
                ctx.strokeStyle = `rgba(${Math.round(170 + 85 * heat)},${Math.round(
                    110 + 110 * heat
                )},${Math.round(255 - 110 * heat)},${
                    p.alpha * beaming * wave * (far ? 0.55 : 1)
                })`;
                ctx.lineWidth = p.width;
                ctx.lineCap = "round";
                ctx.stroke();
            };

            // Matter spiralling in: brightening as the orbit decays, gone
            // at the ring. Like the orbiters, the far half of the orbit
            // passes behind the shadow, the near half in front of it.
            const drawFaller = (f: Faller, far: boolean) => {
                if (Math.sin(f.angle) < 0 !== far) return;
                const r = disk * f.radius;
                const infall = 1 - Math.min(1, (f.radius - 0.36) / 0.64);
                const heat = 0.5 + 0.5 * infall;
                ctx.beginPath();
                ctx.ellipse(cx, cy, r, r * SQUASH, 0, f.angle - 0.09, f.angle);
                ctx.strokeStyle = `rgba(${Math.round(170 + 85 * heat)},${Math.round(
                    110 + 110 * heat
                )},${Math.round(255 - 110 * heat)},${
                    f.alpha * (0.35 + 0.65 * infall)
                })`;
                ctx.lineWidth = f.width;
                ctx.lineCap = "round";
                ctx.stroke();
            };

            // Everything that orbits is drawn in a frame rolled around the
            // hole; the shadow and its ring — perfect circles — stay upright.
            const beginTilt = () => {
                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate(TILT);
                ctx.translate(-cx, -cy);
            };

            ctx.globalCompositeOperation = "lighter";
            beginTilt();
            for (const p of orbiters) drawOrbiter(p, true);
            for (const f of fallers) drawFaller(f, true);
            ctx.restore();

            drawHorizon(cx, cy, stone);

            beginTilt();
            for (const p of orbiters) drawOrbiter(p, false);
            for (const f of fallers) drawFaller(f, false);
            ctx.restore();

            // A shooting star crossing the void, head first.
            if (meteor) {
                const fade = Math.sin((meteor.life / meteor.maxLife) * Math.PI);
                const tailX = meteor.x - meteor.vx * 14;
                const tailY = meteor.y - meteor.vy * 14;
                const tail = ctx.createLinearGradient(
                    meteor.x,
                    meteor.y,
                    tailX,
                    tailY
                );
                tail.addColorStop(0, `rgba(240,236,255,${0.85 * fade})`);
                tail.addColorStop(1, "rgba(160,140,255,0)");
                ctx.beginPath();
                ctx.moveTo(meteor.x, meteor.y);
                ctx.lineTo(tailX, tailY);
                ctx.strokeStyle = tail;
                ctx.lineWidth = 1.4;
                ctx.lineCap = "round";
                ctx.stroke();
            }

            // Drifting sparks, last so they read in front of everything.
            for (const e of embers) {
                const x = e.x + Math.sin(time * 0.0007 + e.phase) * e.sway;
                ctx.beginPath();
                ctx.arc(x, e.y, e.size, 0, TAU);
                ctx.fillStyle = `rgba(210,196,255,${e.alpha})`;
                ctx.fill();
            }

            ctx.globalCompositeOperation = "source-over";
        };

        let frame = 0;
        const loop = () => {
            time += 16;
            // Ease the parallax toward its target and hand it to the CSS.
            tiltX += (tiltTargetX - tiltX) * 0.08;
            tiltY += (tiltTargetY - tiltY) * 0.08;
            backdropRef.current?.style.setProperty(
                "--pv-px",
                tiltX.toFixed(4)
            );
            backdropRef.current?.style.setProperty(
                "--pv-py",
                tiltY.toFixed(4)
            );
            for (const p of orbiters) {
                p.angle += p.speed * 16;
                if (p.angle > TAU) p.angle -= TAU;
            }
            for (const f of fallers) {
                // Keplerian spin that quickens as the orbit decays, and an
                // infall that accelerates the closer the ring comes.
                f.angle += (0.00025 / Math.pow(f.radius, 1.5)) * 16;
                if (f.angle > TAU) f.angle -= TAU;
                f.radius -= (0.000033 / f.radius) * 16;
                if (f.radius <= 0.36) {
                    f.radius = 0.85 + Math.random() * 0.25;
                    f.angle = Math.random() * TAU;
                }
            }
            for (const e of embers) {
                e.y -= e.rise;
                if (e.y < -4) {
                    e.y = height + 4;
                    e.x = Math.random() * width;
                }
            }
            if (meteor) {
                meteor.x += meteor.vx;
                meteor.y += meteor.vy;
                meteor.life += 1;
                if (
                    meteor.life >= meteor.maxLife ||
                    meteor.x < -60 ||
                    meteor.x > width + 60 ||
                    meteor.y > height + 60
                ) {
                    meteor = null;
                    // Long, irregular silences between two shooting stars.
                    meteorCooldown = 4000 + Math.random() * 9000;
                }
            } else {
                meteorCooldown -= 16;
                if (meteorCooldown <= 0) {
                    const dir = Math.random() > 0.5 ? 1 : -1;
                    meteor = {
                        x: dir > 0 ? -30 : width + 30,
                        y: Math.random() * height * 0.45,
                        vx: dir * (2.4 + Math.random() * 1.8),
                        vy: 0.7 + Math.random() * 0.7,
                        life: 0,
                        maxLife: 50 + Math.random() * 40,
                    };
                }
            }
            draw();
            frame = requestAnimationFrame(loop);
        };

        const observer = new ResizeObserver(() => {
            resize();
            if (reduced) draw();
        });
        observer.observe(canvas);

        resize();
        if (reduced) {
            // One static frame: the hole is there, it just doesn't spin.
            draw();
        } else {
            frame = requestAnimationFrame(loop);
        }

        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
            window.removeEventListener("pointermove", onPointerMove);
            window.removeEventListener("deviceorientation", onTilt);
            if (orientationAsk) {
                window.removeEventListener("touchend", orientationAsk);
            }
        };
    }, []);

    return (
        <div className="pv-backdrop" ref={backdropRef} aria-hidden="true">
            <div className="pv-stars pv-stars-far" />
            <div className="pv-stars pv-stars-near" />
            <div className="pv-stars pv-stars-dust" />
            <div className="pv-nebula" />
            <canvas ref={canvasRef} className="pv-canvas" />
            <div className="pv-grain" />
            <div className="pv-vignette" />
        </div>
    );
}
