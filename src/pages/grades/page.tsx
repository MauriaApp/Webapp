"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { GradeCard } from "./grade-card";
import { useCurrentYear } from "@/contexts/currentYearContext";
import { getGrades } from "@/utils/grades";
import { AnimatePresence, motion } from "framer-motion";
import { fetchGrades } from "@/utils/api/aurion";
import { useQuery } from "@tanstack/react-query";
import ReactPullToRefresh from "react-simple-pull-to-refresh";
import { Grade } from "@/types/aurion";

const listVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.06, delayChildren: 0.05 },
    },
};

export function GradesPage() {
    const { showCurrentYearOnly, toggleCurrentYearFilter } = useCurrentYear();

    const {
        data: grades = [],
        refetch,
        isLoading,
    } = useQuery<Grade[], Error>({
        queryKey: ["grades"],
        queryFn: () => fetchGrades().then((res) => res?.data || []),
        staleTime: 1000 * 60 * 5, // 5 min frais
        gcTime: 1000 * 60 * 60 * 24, // 24h cache
        refetchOnWindowFocus: true, // refresh background si focus fenêtre
    });

    const handleRefresh = async () => {
        await refetch();
    };

    const filteredGrades = getGrades({
        showCurrentYearOnly,
        grades: grades,
    });

    return (
        <ReactPullToRefresh
            onRefresh={handleRefresh}
            className="mx-auto max-w-3xl space-y-4 pt-4"
            isPullable={!isLoading}
        >
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

            {filteredGrades.length === 0 ? (
                <motion.div
                    key="empty-state"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        duration: 0.25,
                        ease: "easeOut",
                        delay: 0.05,
                    }}
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
                        {filteredGrades.map((grade, index) => (
                            <GradeCard key={index} grade={grade} />
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}
        </ReactPullToRefresh>
    );
}
