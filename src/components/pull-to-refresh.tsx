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
    pullingText = "Tirez pour actualiser",
    refreshingText = "Actualisation…",
    ...rest
}: Props) {
    return (
        <ReactPullToRefresh
            onRefresh={onRefresh}
            isPullable={isPullable}
            className={className}
            pullingContent={
                <div className="w-full py-2 text-left text-sm text-muted-foreground flex items-center gap-2 [&_svg]:!size-5">
                    <ArrowUpToLine />
                    <span>{pullingText}</span>
                </div>
            }
            refreshingContent={
                <div className="w-full py-2 text-left text-sm text-muted-foreground flex items-center gap-2 [&_svg]:!size-5">
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
