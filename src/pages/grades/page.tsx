"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { GradeCard, GradeCardAnimate } from "./grade-card";
import { useCurrentYear } from "@/contexts/currentYearContext";
import { getGrades } from "@/lib/utils/grades";
import { AnimatePresence, motion } from "framer-motion";
import { fetchGrades } from "@/lib/api/aurion";
import { useQuery } from "@tanstack/react-query";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { Grade } from "@/types/aurion";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import { memo, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useTranslation } from "react-i18next";

const AnimatedGradeCard = memo(GradeCardAnimate);
const StaticGradeCard = memo(GradeCard);

const listVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.06, delayChildren: 0.05 },
    },
};

export function GradesPage() {
    const { showCurrentYearOnly, toggleCurrentYearFilter } = useCurrentYear();
    const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const { t } = useTranslation();

    const {
        data: grades = [],
        refetch,
        isLoading,
        isFetching,
    } = useQuery<Grade[], Error>({
        queryKey: ["grades"],
        queryFn: (): Promise<Grade[]> =>
            fetchGrades().then((res) => res?.data || grades),
        staleTime: 1000 * 60 * 5, // 5 min frais
        gcTime: 1000 * 60 * 60 * 24, // 24h cache
        refetchOnWindowFocus: true, // refresh background si focus fenêtre
        placeholderData: (previousData) => previousData,
    });

    const isBusy = isLoading || isFetching;

    const handleRefresh = () => {
        void refetch();
    };

    const filteredGrades = getGrades({
        showCurrentYearOnly,
        grades: grades,
    });

    return (
        <PullToRefresh
            onRefresh={handleRefresh}
            className="mx-auto max-w-3xl space-y-4 pt-4"
            isPullable={!isBusy}
            pullingText={t("common.pullToRefresh")}
            refreshingText={t("common.refreshing")}
        >
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="flex items-center gap-2 mb-4"
            >
                <Switch
                    id="onlyThisYear"
                    checked={showCurrentYearOnly}
                    onCheckedChange={toggleCurrentYearFilter}
                />
                <Label htmlFor="onlyThisYear">
                    {t("gradesPage.onlyCurrentYear")}
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
                        <AlertTitle>{t("gradesPage.noGrades")}</AlertTitle>
                    </Alert>
                </motion.div>
            ) : (
                <motion.div
                    className="space-y-4 p-1"
                    variants={listVariants}
                    initial="hidden"
                    animate="show"
                >
                    <AnimatePresence mode="popLayout">
                        {filteredGrades.map((grade, index) =>
                            index < 8 ? (
                                <AnimatedGradeCard
                                    key={index}
                                    grade={grade}
                                    onGradeClick={(grade) => {
                                        setSelectedGrade(grade);
                                        setDrawerOpen(true);
                                    }}
                                />
                            ) : (
                                <StaticGradeCard
                                    key={index}
                                    grade={grade}
                                    onGradeClick={(grade) => {
                                        setSelectedGrade(grade);
                                        setDrawerOpen(true);
                                    }}
                                />
                            )
                        )}
                    </AnimatePresence>
                </motion.div>
            )}
            <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                <DrawerContent aria-describedby={undefined}>
                    <DrawerHeader>
                        <DrawerTitle>{t("gradesPage.details")}</DrawerTitle>
                    </DrawerHeader>
                    {selectedGrade && (
                        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto mb-6">
                            <div>
                                <h3 className="font-semibold text-lg">
                                    {selectedGrade.name}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {selectedGrade.code}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 ">
                                <div>
                                    <p className="text-sm font-medium">
                                        {t("gradesPage.grade")}
                                    </p>
                                    <p className="text-2xl font-bold">
                                        {selectedGrade.grade}
                                    </p>
                                </div>
                            </div>
                            <Separator />

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium">
                                        {t("gradesPage.average")}
                                    </p>
                                    <p>{selectedGrade.average}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">
                                        {t("gradesPage.median")}
                                    </p>
                                    <p>{selectedGrade.median}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium">
                                        {t("gradesPage.min")}
                                    </p>
                                    <p>{selectedGrade.min}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">
                                        {t("gradesPage.max")}
                                    </p>
                                    <p>{selectedGrade.max}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium">
                                        {t("gradesPage.standardDeviation")}
                                    </p>
                                    <p>{selectedGrade.standardDeviation}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">
                                        {t("gradesPage.coefficient")}
                                    </p>
                                    <p className="text-lg">
                                        {selectedGrade.coefficient}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <p className="text-sm font-medium">
                                    {t("gradesPage.date")}
                                </p>
                                <p>
                                    {selectedGrade.date
                                        ? format(
                                              new Date(
                                                  selectedGrade.date
                                                      .split("/")
                                                      .reverse()
                                                      .join("-")
                                              ),
                                              "EEEE d MMM yyyy",
                                              { locale: fr }
                                          )
                                        : "Non spécifiée"}
                                </p>
                            </div>

                            {selectedGrade.comment && (
                                <div>
                                    <p className="text-sm font-medium">
                                        {t("gradesPage.comment")}
                                    </p>
                                    <p className="text-sm">
                                        {selectedGrade.comment}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </DrawerContent>
            </Drawer>
        </PullToRefresh>
    );
}
