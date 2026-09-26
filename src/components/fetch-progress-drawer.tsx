"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    Activity,
    BookOpen,
    Calendar,
    DoorOpen,
    FileText,
    GraduationCap,
    HeartHandshake,
    Loader,
    Megaphone,
    Printer,
    Radar,
    Sparkles,
    User,
    UtensilsCrossed,
    type LucideIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import { Progress } from "@/components/ui/progress";
import type { FetchEntry } from "@/lib/hooks/use-fetch-progress";

// Delay before closing once the last fetch is done, so its row can leave.
const CLOSE_DELAY_MS = 600;

/** Icon and label (`fetchDrawer.queries.*`) per query key. */
const QUERIES: Record<string, { icon: LucideIcon; label: string }> = {
    planning: { icon: Calendar, label: "planning" },
    grades: { icon: GraduationCap, label: "grades" },
    absences: { icon: User, label: "absences" },
    documents: { icon: FileText, label: "documents" },
    colles: { icon: BookOpen, label: "colles" },
    dailyMenu: { icon: UtensilsCrossed, label: "menu" },
    castelRuMenu: { icon: UtensilsCrossed, label: "menu" },
    juniaStatus: { icon: Activity, label: "status" },
    importantMessages: { icon: Megaphone, label: "messages" },
    updates: { icon: Sparkles, label: "updates" },
    associations: { icon: HeartHandshake, label: "associations" },
    findmyroom: { icon: DoorOpen, label: "rooms" },
    palantir: { icon: Radar, label: "palantir" },
    print: { icon: Printer, label: "print" },
};

const OTHER = { icon: Loader, label: "other" };

export function FetchProgressDrawer({
    fetches,
    open,
    onOpenChange,
}: {
    fetches: FetchEntry[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { t } = useTranslation();

    // Everything is fetched: nothing left to show.
    const empty = fetches.length === 0;
    useEffect(() => {
        if (!open || !empty) return;
        const id = window.setTimeout(() => onOpenChange(false), CLOSE_DELAY_MS);
        return () => window.clearTimeout(id);
    }, [open, empty, onOpenChange]);

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="pb-safe max-h-[85vh]">
                <DrawerHeader className="px-6 pt-6 pb-3">
                    <DrawerTitle>{t("fetchDrawer.title")}</DrawerTitle>
                    <DrawerDescription>
                        {t("fetchDrawer.description")}
                    </DrawerDescription>
                </DrawerHeader>
                <ul className="flex flex-col overflow-y-auto px-6 pb-6">
                    <AnimatePresence initial={false}>
                        {fetches.map((fetch) => {
                            const { icon: Icon, label } =
                                QUERIES[fetch.name] ?? OTHER;
                            return (
                                <motion.li
                                    key={fetch.id}
                                    layout
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{
                                        duration: 0.3,
                                        ease: [0.16, 1, 0.3, 1],
                                    }}
                                    className="overflow-hidden"
                                >
                                    <div className="flex items-center gap-3 py-2">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mauria-purple/10 text-mauria-purple dark:bg-white/10 dark:text-white">
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                                            <div className="flex items-center justify-between gap-2 text-sm">
                                                <span className="truncate font-medium">
                                                    {t(
                                                        `fetchDrawer.queries.${label}`
                                                    )}
                                                </span>
                                                <span className="tabular-nums text-muted-foreground">
                                                    {t("fetchDrawer.percent", {
                                                        value: fetch.progress,
                                                    })}
                                                </span>
                                            </div>
                                            <Progress
                                                value={fetch.progress}
                                                className="h-2"
                                            />
                                        </div>
                                    </div>
                                </motion.li>
                            );
                        })}
                    </AnimatePresence>
                </ul>
            </DrawerContent>
        </Drawer>
    );
}
