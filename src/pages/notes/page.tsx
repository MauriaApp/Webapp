"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Info } from "lucide-react";

import RootLayout from "@/pages/layout";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { fetchNotes } from "@/utils/api";
import { mergeNotesData } from "@/utils/notes";
import { Alert, AlertTitle } from "@/components/ui/alert";

const MotionCard = motion(Card);

const listVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.06, delayChildren: 0.05 },
    },
};

const gradeVariants = {
    hidden: { opacity: 0, y: 16, scale: 0.98 },
    show: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
    },
    exit: {
        opacity: 0,
        y: -14,
        scale: 0.98,
        transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
    },
};

export default function NotesPage() {
    const now = new Date();
    let currentYear = now.getFullYear();
    const month = now.getMonth() + 1;
    if (month >= 9) currentYear++;

    const [onlyThisYear, setOnlyThisYear] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        fetchNotes().finally(() => setRefreshKey((k) => k + 1));
    }, []);

    const merged = useMemo(
        () => mergeNotesData(onlyThisYear, currentYear),
        [onlyThisYear, currentYear, refreshKey]
    );

    return (
        <RootLayout>
            <div className="mx-auto max-w-3xl space-y-4 pt-4">
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="flex items-center gap-2"
                >
                    <Switch
                        id="onlyThisYear"
                        checked={onlyThisYear}
                        onCheckedChange={setOnlyThisYear}
                    />
                    <Label htmlFor="onlyThisYear">
                        Afficher uniquement cette année
                    </Label>
                </motion.div>

                {merged.length === 0 ? (
                    <motion.div
                        key="empty-state"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, ease: "easeOut", delay: 0.05 }}
                    >
                        <Alert className="mb-4">
                            <Info className="h-4 w-4" />
                            <AlertTitle>Aucune note pour l'instant</AlertTitle>
                        </Alert>
                    </motion.div>
                ) : (
                    <motion.div
                        className="space-y-2"
                        variants={listVariants}
                        initial="hidden"
                        animate="show"
                    >
                        <AnimatePresence mode="popLayout">
                            {merged.map(({ note }) => (
                                <GradeCard
                                    key={(note as any).code}
                                    grade={(note as any).grade}
                                    course={(note as any).course}
                                    coef={(note as any).coef}
                                    date={(note as any).date}
                                />
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>
        </RootLayout>
    );
}

function GradeCard({
    grade,
    course,
    coef,
    date,
}: {
    grade: string;
    course: string;
    coef: string;
    date: string;
}) {
    return (
        <MotionCard
            layout
            variants={gradeVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className="transition-shadow hover:shadow-md"
        >
            <div className="flex p-4">
                <div className="mr-4 w-20">
                    <div className="text-2xl font-bold text-mauria-light-accent dark:text-mauria-dark-accent">
                        {grade}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        Coef {coef}
                    </div>
                </div>
                <div className="flex-1">
                    <div className="text-lg font-medium text-mauria-light-purple dark:text-white">
                        {course}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        {date}
                    </div>
                </div>
            </div>
        </MotionCard>
    );
}
