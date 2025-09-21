import type { ComponentType, ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";

import { cn } from "@/lib/utils/cn";

type AllowedTags = "div" | "main" | "section";

type PageTransitionProps<T extends AllowedTags> = {
    as?: T;
    children: ReactNode;
    className?: string;
} & Omit<HTMLMotionProps<T>, "className" | "children">;

export function PageTransition<T extends AllowedTags = "div">({
    as = "div" as T,
    children,
    className,
    ...props
}: PageTransitionProps<T>) {
    const MotionComponent = motion[as] as ComponentType<HTMLMotionProps<T>>;

    return (
        <MotionComponent
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className={cn("w-full", className)}
            {...props}
        >
            {children}
        </MotionComponent>
    );
}
