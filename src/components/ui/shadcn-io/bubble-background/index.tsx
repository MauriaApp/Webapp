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
    colors?: Partial<
        Record<
            "first" | "second" | "third" | "fourth" | "fifth" | "sixth",
            string
        >
    >;
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
            colors,
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

        const { style, ...restProps } = props;

        const colorOverrides = React.useMemo(() => {
            if (!colors) {
                return undefined;
            }

            const entries: Record<string, string> = {};
            if (colors.first)
                entries["--bubble-color-first"] = colors.first;
            if (colors.second)
                entries["--bubble-color-second"] = colors.second;
            if (colors.third)
                entries["--bubble-color-third"] = colors.third;
            if (colors.fourth)
                entries["--bubble-color-fourth"] = colors.fourth;
            if (colors.fifth)
                entries["--bubble-color-fifth"] = colors.fifth;
            if (colors.sixth)
                entries["--bubble-color-sixth"] = colors.sixth;

            return entries as React.CSSProperties;
        }, [colors]);

        const mergedStyle = React.useMemo(() => {
            if (!colorOverrides && !style) {
                return undefined;
            }
            return { ...colorOverrides, ...style } as React.CSSProperties;
        }, [colorOverrides, style]);

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
                style={mergedStyle}
                {...restProps}
            >
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
                        className="absolute rounded-full size-[80%] top-[10%] left-[10%] mix-blend-hard-light bg-[radial-gradient(circle_at_center,rgba(var(--bubble-color-first),0.8)_0%,rgba(var(--bubble-color-first),0)_50%)]"
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
                        <div className="rounded-full size-[80%] mix-blend-hard-light bg-[radial-gradient(circle_at_center,rgba(var(--bubble-color-second),0.8)_0%,rgba(var(--bubble-color-second),0)_50%)]" />
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
                        <div className="absolute rounded-full size-[80%] bg-[radial-gradient(circle_at_center,rgba(var(--bubble-color-third),0.8)_0%,rgba(var(--bubble-color-third),0)_50%)] mix-blend-hard-light top-[calc(50%+200px)] left-[calc(50%-500px)]" />
                    </motion.div>
                    <motion.div
                        className="absolute rounded-full size-[80%] top-[10%] left-[10%] mix-blend-hard-light bg-[radial-gradient(circle_at_center,rgba(var(--bubble-color-fourth),0.8)_0%,rgba(var(--bubble-color-fourth),0)_50%)] opacity-70"
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
                        <div className="absolute rounded-full size-[160%] mix-blend-hard-light bg-[radial-gradient(circle_at_center,rgba(var(--bubble-color-fifth),0.8)_0%,rgba(var(--bubble-color-fifth),0)_50%)] top-[calc(50%-80%)] left-[calc(50%-80%)]" />
                    </motion.div>

                    {interactive && (
                        <motion.div
                            className="absolute rounded-full size-full mix-blend-hard-light bg-[radial-gradient(circle_at_center,rgba(var(--bubble-color-sixth),0.8)_0%,rgba(var(--bubble-color-sixth),0)_50%)] opacity-70"
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
