"use client";

import React, { useEffect, useState } from "react";

function cn(...cls: Array<string | undefined | false>) {
    return cls.filter(Boolean).join(" ");
}

export interface MeteorsProps {
    number?: number;
    minDelay?: number;
    maxDelay?: number;
    minDuration?: number;
    maxDuration?: number;
    angle?: number; // degrees. 215 = top-right to bottom-left
    className?: string;
}

export const Meteors: React.FC<MeteorsProps> = ({
    number = 20,
    minDelay = 0.2,
    maxDelay = 1.2,
    minDuration = 2,
    maxDuration = 10,
    angle = 215,
    className,
}) => {
    const [meteorStyles, setMeteorStyles] = useState<
        Array<React.CSSProperties>
    >([]);

    useEffect(() => {
        const styles = Array.from({ length: number }, () => {
            const delay = Math.random() * (maxDelay - minDelay) + minDelay;
            const dur =
                Math.random() * (maxDuration - minDuration) + minDuration;
            const leftPx = Math.floor(Math.random() * window.innerWidth);
            const topPct = Math.random() * 120 - 10; // distribute meteors across and slightly beyond the viewport

            return {
                ["--angle" as any]: `${angle}deg`,
                top: `${topPct}%`,
                left: `calc(0% + ${leftPx}px)`,
                animationDelay: `${delay}s`,
                animationDuration: `${dur}s`,
            } as React.CSSProperties;
        });

        setMeteorStyles(styles);
    }, [number, minDelay, maxDelay, minDuration, maxDuration, angle]);

    return (
        <>
            {meteorStyles.map((style, idx) => (
                <span
                    key={idx}
                    style={style}
                    className={cn(
                        "pointer-events-none absolute size-0.5 rotate-(--angle) animate-meteor rounded-full bg-mauria-accent shadow-[0_0_0_1px_#ffffff10]",
                        className
                    )}
                >
                    <div className="pointer-events-none absolute top-1/2 -z-10 h-px w-[50px] -translate-y-1/2 bg-linear-to-r from-mauria-accent to-transparent" />
                </span>
            ))}
        </>
    );
};

export default Meteors;
