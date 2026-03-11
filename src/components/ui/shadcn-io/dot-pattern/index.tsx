"use client";

import { cn } from "@/lib/utils/cn";
import React, { useEffect, useRef } from "react";

export interface DotPatternProps {
    className?: string;
    dotSize?: number;
    gap?: number;
    glowRadius?: number;
}

type Dot = { x: number; y: number; phase: number };

function resolveHslToRgb(
    cssVarValue: string,
    fallback: [number, number, number]
): [number, number, number] {
    if (typeof window === "undefined") return fallback;
    const el = document.createElement("span");
    el.style.color = `hsl(${cssVarValue})`;
    el.style.display = "none";
    document.body.appendChild(el);
    try {
        const match = getComputedStyle(el).color.match(/\d+/g);
        if (match) return [+match[0], +match[1], +match[2]];
    } finally {
        el.remove();
    }
    return fallback;
}

export const DotPattern: React.FC<DotPatternProps> = ({
    className,
    dotSize = 1.5,
    gap = 24,
    glowRadius = 100,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef<number>(0);
    const mouseRef = useRef<{ x: number; y: number }>({ x: -9999, y: -9999 });
    const dotsRef = useRef<Dot[]>([]);
    const baseRgbRef = useRef<[number, number, number]>([150, 150, 150]);
    const glowRgbRef = useRef<[number, number, number]>([255, 120, 60]);
    const tRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const resolveColors = () => {
            const style = getComputedStyle(document.documentElement);
            const borderRaw = style.getPropertyValue("--mauria-border").trim();
            const particlesRaw = style
                .getPropertyValue("--mauria-particles")
                .trim();
            baseRgbRef.current = resolveHslToRgb(borderRaw, [150, 150, 150]);
            glowRgbRef.current = resolveHslToRgb(particlesRaw, [255, 120, 60]);
        };

        const buildDots = () => {
            const { width, height } = canvas;
            const dots: Dot[] = [];
            for (let y = 0; y <= height; y += gap) {
                for (let x = 0; x <= width; x += gap) {
                    dots.push({ x, y, phase: (x / gap + y / gap) * 0.3 });
                }
            }
            dotsRef.current = dots;
        };

        const resize = () => {
            canvas.width = container.offsetWidth;
            canvas.height = container.offsetHeight;
            buildDots();
        };

        const draw = () => {
            const { width, height } = canvas;
            ctx.clearRect(0, 0, width, height);
            const t = tRef.current;
            const { x: mx, y: my } = mouseRef.current;
            const [br, bg, bb] = baseRgbRef.current;
            const [gr, gg, gb] = glowRgbRef.current;

            for (const dot of dotsRef.current) {
                const dx = dot.x - mx;
                const dy = dot.y - my;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const prox = Math.max(0, 1 - dist / glowRadius);

                const wave = (Math.sin(t * 1.5 + dot.phase) + 1) * 0.5;
                const baseAlpha = 0.2 + wave * 0.15;
                const alpha = Math.min(1, baseAlpha + prox * 0.45);

                const r = Math.round(br + (gr - br) * prox);
                const g = Math.round(bg + (gg - bg) * prox);
                const b = Math.round(bb + (gb - bb) * prox);
                const size = dotSize + prox * dotSize * 1.5;

                ctx.beginPath();
                ctx.arc(dot.x, dot.y, size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
                ctx.fill();
            }

            tRef.current += 0.016;
            animRef.current = requestAnimationFrame(draw);
        };

        resolveColors();
        resize();
        draw();

        const onMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
                mouseRef.current = { x, y };
            } else {
                mouseRef.current = { x: -9999, y: -9999 };
            }
        };

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("resize", resize);

        const observer = new MutationObserver(resolveColors);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class", "style", "data-theme"],
        });

        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("resize", resize);
            cancelAnimationFrame(animRef.current);
            observer.disconnect();
        };
    }, [dotSize, gap, glowRadius]);

    return (
        <div
            ref={containerRef}
            className={cn("pointer-events-none", className)}
            aria-hidden="true"
        >
            <canvas ref={canvasRef} className="size-full" />
        </div>
    );
};

DotPattern.displayName = "DotPattern";
