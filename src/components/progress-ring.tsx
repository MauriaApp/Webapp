import { cn } from "@/lib/utils/cn";

/**
 * Radial progress ring rendered as an SVG circle with a stroke-dashoffset
 * animation.  `value` is clamped to [0, 100].
 */
export function ProgressRing({
    value,
    size = 28,
    strokeWidth = 3,
    className,
    trackClassName,
}: {
    value: number;
    size?: number;
    strokeWidth?: number;
    className?: string;
    trackClassName?: string;
}) {
    const clamped = Math.max(0, Math.min(100, value));
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - clamped / 100);

    return (
        <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className={cn("origin-center -rotate-90", className)}
        >
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                strokeWidth={strokeWidth}
                className={cn("stroke-white/20", trackClassName)}
            />
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                stroke="currentColor"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={{
                    transition: "stroke-dashoffset 0.2s ease-out",
                }}
            />
        </svg>
    );
}
