import { cn } from "@/lib/utils/cn";
import { ArrowUpToLine, Loader2 } from "lucide-react";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useIsFetching } from "@tanstack/react-query";
import ReactPullToRefresh from "react-simple-pull-to-refresh";
import {
    requestAurionBlink,
    useJuniaStatus,
} from "@/lib/hooks/use-junia-status";

type Props = {
    children: React.ReactNode;
    onRefresh: () => Promise<unknown> | unknown;
    isPullable?: boolean;
    className?: string;
    pullingText?: string;
    refreshingText?: string;
} & Record<string, unknown>;

export function PullToRefresh({
    children,
    onRefresh,
    isPullable = true,
    className,
    pullingText,
    refreshingText,
    ...rest
}: Props) {
    const aurionDown = useJuniaStatus()?.aurionDown ?? false;
    // Aurion down + fetch already running (it takes ~a minute to time out):
    // stay pullable, but only replay the top bar blink, never a second fetch.
    const isFetching = useIsFetching() > 0;
    const blinkOnly = aurionDown && isFetching;
    const [isClosing, setIsClosing] = useState(false);
    const closingTimerRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (closingTimerRef.current !== null) {
                window.clearTimeout(closingTimerRef.current);
            }
        };
    }, []);

    const scheduleClosingReset = useCallback(() => {
        setIsClosing(true);
        if (closingTimerRef.current !== null) {
            window.clearTimeout(closingTimerRef.current);
        }
        closingTimerRef.current = window.setTimeout(() => {
            setIsClosing(false);
            closingTimerRef.current = null;
        }, 240);
    }, []);

    const handleRefresh = useCallback(() => {
        if (aurionDown) requestAurionBlink();
        if (blinkOnly) {
            scheduleClosingReset();
            return Promise.resolve();
        }

        const escalateError = (error: unknown) => {
            setTimeout(() => {
                throw error;
            }, 0);
        };
        const isPromiseLike = (
            value: unknown
        ): value is PromiseLike<unknown> => {
            return (
                typeof value === "object" &&
                value !== null &&
                "then" in value &&
                typeof (value as { then?: unknown }).then === "function"
            );
        };

        try {
            const maybePromise = onRefresh();
            if (isPromiseLike(maybePromise)) {
                Promise.resolve(maybePromise).catch(escalateError);
            }
        } catch (error) {
            escalateError(error);
        }

        scheduleClosingReset();

        return Promise.resolve();
    }, [onRefresh, scheduleClosingReset, aurionDown, blinkOnly]);

    return (
        <ReactPullToRefresh
            onRefresh={handleRefresh}
            isPullable={isPullable || blinkOnly}
            className={cn("min-h-[calc(100vh-16rem)]", className)}
            pullingContent={
                <div className="w-full py-2 text-left text-sm text-muted-foreground flex items-center gap-2 [&_svg]:size-5!">
                    <ArrowUpToLine />
                    <span>{pullingText}</span>
                </div>
            }
            refreshingContent={
                <div
                    className={cn(
                        "w-full py-2 text-left text-sm text-muted-foreground flex items-center gap-2 [&_svg]:size-5! transition-opacity duration-200 ease-out",
                        isClosing && "opacity-0"
                    )}
                >
                    <Loader2 className="animate-spin" />
                    <span>{refreshingText}</span>
                </div>
            }
            {...rest}
        >
            {children}
        </ReactPullToRefresh>
    );
}
