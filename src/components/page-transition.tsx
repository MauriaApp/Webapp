import type { ComponentType, ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";

import { cn } from "@/lib/utils/cn";
import { pageFade } from "@/lib/motion";

type AllowedTags = "div" | "main" | "section";

type PageTransitionProps<T extends AllowedTags> = {
    as?: T;
    children: ReactNode;
    className?: string;
} & Omit<
    HTMLMotionProps<T>,
    "className" | "children" | "initial" | "animate" | "exit" | "transition"
>;

export function PageTransition<T extends AllowedTags = "div">({
    as = "div" as T,
    children,
    className,
    ...props
}: PageTransitionProps<T>) {
    const MotionComponent = motion[as] as ComponentType<HTMLMotionProps<T>>;

    return (
        <MotionComponent
            initial={pageFade.initial}
            animate={pageFade.animate}
            exit={pageFade.exit}
            transition={pageFade.transition}
            className={cn("w-full", className)}
            {...props}
        >
            {children}
        </MotionComponent>
    );
}
