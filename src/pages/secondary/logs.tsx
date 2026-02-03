"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { clearStorageLogs, getStorageLogs, logAppLaunch } from "@/lib/utils/storage";

type StorageLogEntry = {
    ts: string;
    action: "set" | "override" | "remove" | "clear" | "launch";
    key?: string;
    size?: number;
    details?: string;
};

function formatLogLine(entry: StorageLogEntry) {
    if (entry.action === "launch") {
        return `[${formatTimestamp(entry.ts)}] ${
            entry.details ?? "----- LANCEMENT DE L'APP -----"
        }`;
    }
    const parts = [`[${formatTimestamp(entry.ts)}]`, entry.action.toUpperCase()];
    if (entry.key) parts.push(entry.key);
    if (entry.size !== undefined) parts.push(`size=${entry.size}`);
    if (entry.details) parts.push(entry.details);
    return parts.join(" ");
}

function formatTimestamp(ts: string) {
    const date = new Date(ts);
    if (Number.isNaN(date.getTime())) return ts;
    const pad = (value: number) => String(value).padStart(2, "0");
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export function LogsPage() {
    const [logs, setLogs] = useState<StorageLogEntry[]>([]);

    useEffect(() => {
        const refresh = () => {
            const nextLogs = getStorageLogs();
            setLogs(nextLogs);
        };
        refresh();
        const interval = window.setInterval(refresh, 1000);
        return () => {
            window.clearInterval(interval);
        };
    }, []);

    return (
        <div className="mt-4 space-y-6 sm:px-6 lg:px-0">
            <div className="mx-auto w-full max-w-4xl space-y-4">
                <Card className="border-border bg-card">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between gap-4">
                            <CardTitle className="text-2xl font-semibold text-foreground">
                                Logs
                            </CardTitle>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    clearStorageLogs();
                                    logAppLaunch();
                                    setLogs(getStorageLogs());
                                }}
                            >
                                Clear
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[60vh] rounded-lg border border-border/70 bg-muted/10 p-4">
                            {logs.length === 0 ? (
                                <div className="text-sm text-muted-foreground">
                                    Aucun log localStorage pour le moment.
                                </div>
                            ) : (
                                <pre className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                                    {logs.map(formatLogLine).join("\n")}
                                </pre>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
