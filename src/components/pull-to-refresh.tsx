import { cn } from "@/lib/utils/cn";
import { ArrowUpToLine, Loader2 } from "lucide-react";
import React from "react";
import ReactPullToRefresh from "react-simple-pull-to-refresh";

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
    const [isClosing, setIsClosing] = React.useState(false);
    const closingTimerRef = React.useRef<number | null>(null);

    React.useEffect(() => {
        return () => {
            if (closingTimerRef.current !== null) {
                window.clearTimeout(closingTimerRef.current);
            }
        };
    }, []);

    const scheduleClosingReset = React.useCallback(() => {
        setIsClosing(true);
        if (closingTimerRef.current !== null) {
            window.clearTimeout(closingTimerRef.current);
        }
        closingTimerRef.current = window.setTimeout(() => {
            setIsClosing(false);
            closingTimerRef.current = null;
        }, 240);
    }, []);

    const handleRefresh = React.useCallback(() => {
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
                void maybePromise.catch(escalateError);
            }
        } catch (error) {
            escalateError(error);
        }

        scheduleClosingReset();

        return Promise.resolve();
    }, [onRefresh, scheduleClosingReset]);

    return (
        <ReactPullToRefresh
            onRefresh={handleRefresh}
            isPullable={isPullable}
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
