"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UpdateDrawer } from "@/components/update-drawer";
import { fetchUpdates } from "@/lib/api/supa";
import { useQuery } from "@tanstack/react-query";
import { UpdatesEntry } from "@/types/data";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { fadeIn, staggerGroup } from "@/lib/motion";

export function VersionsPage() {
    const { t } = useTranslation();
    const [selected, setSelected] = useState<UpdatesEntry | null>(null);

    const { data: updates, isLoading } = useQuery({
        queryKey: ["updates"],
        queryFn: fetchUpdates,
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 60 * 24,
        refetchOnMount: true,
    });

    return (
        <motion.div
            variants={staggerGroup}
            initial="hidden"
            animate="show"
            className="space-y-3 pt-4 pb-4"
        >
            {isLoading && (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                </div>
            )}

            {!isLoading && (!updates || updates.length === 0) && (
                <div className="text-center py-12 text-muted-foreground">
                    {t("versionsPage.noVersions")}
                </div>
            )}

            <AnimatePresence mode="popLayout">
                {updates?.map((update) => (
                    <motion.div key={update.version} variants={fadeIn}>
                        <Card
                            className="border-none bg-white shadow-md dark:bg-mauria-card overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
                            onClick={() => setSelected(update)}
                        >
                            <CardContent className="p-3 flex items-center gap-3">
                                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted-foreground/10 flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <div className="flex-1 min-w-0 space-y-0.5">
                                    <p className="text-sm font-medium truncate">
                                        {t("versionsPage.version")}{" "}
                                        {update.version}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {update.date}
                                    </p>
                                </div>
                                <Badge variant="secondary">
                                    v{update.version}
                                </Badge>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </AnimatePresence>

            {selected && (
                <UpdateDrawer
                    update={selected}
                    open={true}
                    onOpenChange={(open) => {
                        if (!open) setSelected(null);
                    }}
                />
            )}
        </motion.div>
    );
}
