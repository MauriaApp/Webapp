"use client";

import { useMemo } from "react";
import { Info } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { getAbsences, getAbsencesDurations } from "@/utils/absences";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { AbsenceCard } from "./absences-card";
import { useCurrentYear } from "@/contexts/currentYearContext";
import { AnimatePresence, motion } from "framer-motion";

const listVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.06 },
    },
};
export function AbsencesPage() {
    const { showCurrentYearOnly, toggleCurrentYearFilter } = useCurrentYear();

    const absences = getAbsences({ showCurrentYearOnly });

    const { total, justified, unjustified } = useMemo(() => {
        return getAbsencesDurations(absences, showCurrentYearOnly);
    }, [absences, showCurrentYearOnly]);

    return (
        <div className="mx-auto max-w-3xl space-y-4 pt-4">
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="flex items-center gap-2"
            >
                <Switch
                    id="onlyThisYear"
                    checked={showCurrentYearOnly}
                    onCheckedChange={toggleCurrentYearFilter}
                />
                <Label htmlFor="onlyThisYear">
                    Afficher uniquement cette année
                </Label>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    duration: 0.3,
                    ease: [0.16, 1, 0.3, 1],
                    delay: 0.05,
                }}
            >
                <Card className="mb-6">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total
                        </CardTitle>
                        <div className="text-4xl font-bold tracking-tight text-primary">
                            {total}
                        </div>
                    </CardHeader>

                    <Separator />

                    <CardContent className="pt-4">
                        <div className="flex items-start gap-6">
                            <div className="flex-1">
                                <div className="text-sm font-medium text-muted-foreground">
                                    Justifiées
                                </div>
                                <div className="mt-1 text-2xl font-semibold text-green-600">
                                    {justified}
                                </div>
                            </div>

                            <div className="h-10 w-px bg-border" />

                            <div className="flex-1">
                                <div className="text-sm font-medium text-muted-foreground">
                                    Non-justifiées
                                </div>
                                <div className="mt-1 text-2xl font-semibold text-amber-600">
                                    {unjustified}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            <AnimatePresence mode="popLayout">
                {absences.length === 0 ? (
                    <motion.div
                        key="empty-state"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                    >
                        <Alert className="mb-4">
                            <Info className="h-4 w-4" />
                            <AlertTitle>Aucune absence trouvée</AlertTitle>
                        </Alert>
                    </motion.div>
                ) : (
                    <motion.div
                        key="list"
                        className="space-y-4"
                        variants={listVariants}
                        initial="hidden"
                        animate="show"
                        exit="hidden"
                    >
                        <AnimatePresence mode="popLayout">
                            {absences.map((absence, index) => (
                                <AbsenceCard key={index} absence={absence} />
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
