"use client";

import { cn } from "@/lib/utils/cn";
import React, { useEffect, useRef } from "react";
import { createNoise2D } from "simplex-noise";

export interface TopographyProps {
    className?: string;
    lineCount?: number;
    speed?: number;
    amplitude?: number;
    opacity?: number;
}

export const Topography: React.FC<TopographyProps> = ({
    className,
    lineCount = 16,
    speed = 0.0008,
    amplitude = 22,
    opacity = 0.5,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef<number>(0);
    const colorRef = useRef<string>("");
    const tRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const noise2D = createNoise2D();

        const resolveColor = () => {
            const raw = getComputedStyle(document.documentElement)
                .getPropertyValue("--mauria-border")
                .trim();
            colorRef.current = raw ? `hsl(${raw})` : "hsl(220 13% 91%)";
        };

        const resize = () => {
            canvas.width = container.offsetWidth;
            canvas.height = container.offsetHeight;
        };

        const draw = () => {
            const { width, height } = canvas;
            ctx.clearRect(0, 0, width, height);
            ctx.globalAlpha = opacity;
            ctx.strokeStyle = colorRef.current;
            ctx.lineWidth = 1;

            const t = tRef.current;
            const gap = height / (lineCount + 1);

            for (let i = 1; i <= lineCount; i++) {
                const yBase = gap * i;
                ctx.beginPath();
                for (let x = 0; x <= width; x += 3) {
                    const n = noise2D(x * 0.002, i * 0.25 + t);
                    const y = yBase + n * amplitude;
                    if (x === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
            }

            tRef.current += speed;
            animRef.current = requestAnimationFrame(draw);
        };

        resolveColor();
        resize();
        draw();

        window.addEventListener("resize", resize);
        const observer = new MutationObserver(resolveColor);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class", "style", "data-theme"],
        });

        return () => {
            window.removeEventListener("resize", resize);
            cancelAnimationFrame(animRef.current);
            observer.disconnect();
        };
    }, [lineCount, speed, amplitude, opacity]);

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

Topography.displayName = "Topography";
