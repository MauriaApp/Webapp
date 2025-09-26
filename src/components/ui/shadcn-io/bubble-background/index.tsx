"use client";

import * as React from "react";
import {
    motion,
    type SpringOptions,
    useMotionValue,
    useSpring,
} from "motion/react";
import { cn } from "@/lib/utils/cn";

type BubbleBackgroundProps = React.ComponentProps<"div"> & {
    interactive?: boolean;
    transition?: SpringOptions;
    colors?: {
        first: string;
        second: string;
        third: string;
        fourth: string;
        fifth: string;
        sixth: string;
    };
};

const BubbleBackground = React.forwardRef<
    HTMLDivElement,
    BubbleBackgroundProps
>(
    (
        {
            className,
            children,
            interactive = false,
            transition = { stiffness: 100, damping: 20 },
            colors = {
                first: "119,60,221", // violet lumineux
                second: "165,92,214", // violet-magenta
                third: "75,36,143", // violet profond
                fourth: "242,129,54", // orange accent (≈ hsl(24,88%,58%))
                fifth: "252,194,156", // orange pâle (glow doux)
                sixth: "135,90,242", // indigo-violet interactif
            },
            ...props
        },
        ref
    ) => {
        const containerRef = React.useRef<HTMLDivElement>(null);
        React.useImperativeHandle(
            ref,
            () => containerRef.current as HTMLDivElement
        );

        const mouseX = useMotionValue(0);
        const mouseY = useMotionValue(0);
        const springX = useSpring(mouseX, transition);
        const springY = useSpring(mouseY, transition);

        React.useEffect(() => {
            if (!interactive) return;
            const el = containerRef.current;
            if (!el) return;
            const onMove = (e: MouseEvent) => {
                const rect = el.getBoundingClientRect();
                mouseX.set(e.clientX - (rect.left + rect.width / 2));
                mouseY.set(e.clientY - (rect.top + rect.height / 2));
            };
            el.addEventListener("mousemove", onMove);
            return () => el.removeEventListener("mousemove", onMove);
        }, [interactive, mouseX, mouseY]);

        return (
            <div
                ref={containerRef}
                data-slot="bubble-background"
                aria-hidden
                className={cn(
                    // Plein écran, derrière tout
                    "fixed inset-0 -z-10 overflow-hidden bg-mauria-purple",
                    interactive ? "pointer-events-auto" : "pointer-events-none",
                    className
                )}
                {...props}
            >
                <style>{`
          :root{
            --first-color:${colors.first};
            --second-color:${colors.second};
            --third-color:${colors.third};
            --fourth-color:${colors.fourth};
            --fifth-color:${colors.fifth};
            --sixth-color:${colors.sixth};
          }
        `}</style>

                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="absolute top-0 left-0 w-0 h-0"
                >
                    <defs>
                        <filter id="goo">
                            <feGaussianBlur
                                in="SourceGraphic"
                                stdDeviation="10"
                                result="blur"
                            />
                            <feColorMatrix
                                in="blur"
                                mode="matrix"
                                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
                                result="goo"
                            />
                            <feBlend in="SourceGraphic" in2="goo" />
                        </filter>
                    </defs>
                </svg>

                <div
                    className="absolute inset-0"
                    style={{ filter: "url(#goo) blur(40px)" }}
                >
                    <motion.div
                        className="absolute rounded-full size-[80%] top-[10%] left-[10%] mix-blend-hard-light bg-[radial-gradient(circle_at_center,rgba(var(--first-color),0.8)_0%,rgba(var(--first-color),0)_50%)]"
                        animate={{ y: [-50, 50, -50] }}
                        transition={{
                            duration: 30,
                            ease: "easeInOut",
                            repeat: Infinity,
                        }}
                    />
                    <motion.div
                        className="absolute inset-0 flex justify-center items-center origin-[calc(50%-400px)]"
                        animate={{ rotate: 360 }}
                        transition={{
                            duration: 20,
                            ease: "linear",
                            repeat: Infinity,
                        }}
                    >
                        <div className="rounded-full size-[80%] mix-blend-hard-light bg-[radial-gradient(circle_at_center,rgba(var(--second-color),0.8)_0%,rgba(var(--second-color),0)_50%)]" />
                    </motion.div>
                    <motion.div
                        className="absolute inset-0 flex justify-center items-center origin-[calc(50%+400px)]"
                        animate={{ rotate: 360 }}
                        transition={{
                            duration: 40,
                            ease: "linear",
                            repeat: Infinity,
                        }}
                    >
                        <div className="absolute rounded-full size-[80%] bg-[radial-gradient(circle_at_center,rgba(var(--third-color),0.8)_0%,rgba(var(--third-color),0)_50%)] mix-blend-hard-light top-[calc(50%+200px)] left-[calc(50%-500px)]" />
                    </motion.div>
                    <motion.div
                        className="absolute rounded-full size-[80%] top-[10%] left-[10%] mix-blend-hard-light bg-[radial-gradient(circle_at_center,rgba(var(--fourth-color),0.8)_0%,rgba(var(--fourth-color),0)_50%)] opacity-70"
                        animate={{ x: [-50, 50, -50] }}
                        transition={{
                            duration: 40,
                            ease: "easeInOut",
                            repeat: Infinity,
                        }}
                    />
                    <motion.div
                        className="absolute inset-0 flex justify-center items-center origin-[calc(50%-800px)_calc(50%+200px)]"
                        animate={{ rotate: 360 }}
                        transition={{
                            duration: 20,
                            ease: "linear",
                            repeat: Infinity,
                        }}
                    >
                        <div className="absolute rounded-full size-[160%] mix-blend-hard-light bg-[radial-gradient(circle_at_center,rgba(var(--fifth-color),0.8)_0%,rgba(var(--fifth-color),0)_50%)] top-[calc(50%-80%)] left-[calc(50%-80%)]" />
                    </motion.div>

                    {interactive && (
                        <motion.div
                            className="absolute rounded-full size-full mix-blend-hard-light bg-[radial-gradient(circle_at_center,rgba(var(--sixth-color),0.8)_0%,rgba(var(--sixth-color),0)_50%)] opacity-70"
                            style={{ x: springX, y: springY }}
                        />
                    )}
                </div>

                {children}
            </div>
        );
    }
);

BubbleBackground.displayName = "BubbleBackground";
export { BubbleBackground, type BubbleBackgroundProps };
