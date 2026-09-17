"use client";

import { memo, useMemo, useState } from "react";
import { CalendarOff, Loader2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAbsencesDurations, getAbsences, getAbsenceSemesters, getCurrentSemesterKey, isAbsenceJustified } from "@/lib/utils/absences";
import { Separator } from "@/components/ui/separator";
import { AbsenceCard, AbsenceCardAnimate } from "./absences-card";
import { AnimatePresence, motion } from "framer-motion";
import { fetchAbsences } from "@/lib/api/aurion";
import { useQuery } from "@tanstack/react-query";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { Absence } from "@/types/aurion";
import { useTranslation } from "react-i18next";
import { fadeIn, staggerGroup } from "@/lib/motion";
import { CarouselItem, FilterCarousel } from "@/components/filter-carousel";

const AnimatedAbsenceCard = memo(AbsenceCardAnimate);
const StaticAbsenceCard = memo(AbsenceCard);

type StatusFilter = "justified" | "unjustified";

export function AbsencesPage() {
    const { t } = useTranslation();
    const [selectedStatus, setSelectedStatus] = useState<StatusFilter | null>(
        null
    );
    // undefined = not chosen yet (falls back to the current semester);
    // null = "All"; string = a specific semester key
    const [semesterChoice, setSemesterChoice] = useState<
        string | null | undefined
    >(undefined);

    const {
        data: absences = [],
        refetch,
        isLoading,
        isFetching,
    } = useQuery<Absence[], Error>({
        queryKey: ["absences"],
        queryFn: async (): Promise<Absence[]> => {
            const res = await fetchAbsences();
            // Throw (don't fall back) on failure so React Query keeps the
            // cached data instead of wiping it — e.g. a failed
            // refetch-on-focus after the app was backgrounded.
            if (!res?.success) {
                throw new Error("Failed to fetch absences");
            }
            return res.data ?? [];
        },
        staleTime: 1000 * 60 * 5, // 5 min frais
        gcTime: 1000 * 60 * 60 * 24, // 24h cache
        refetchOnWindowFocus: true, // refresh background si focus fenêtre
        placeholderData: (previousData) => previousData,
    });

    const isBusy = isLoading || isFetching;

    const handleRefresh = () => refetch();

    const semesters = useMemo(() => getAbsenceSemesters(absences), [absences]);

    const semesterKey = useMemo(() => {
        if (semesterChoice !== undefined) return semesterChoice;
        const current = getCurrentSemesterKey();
        // Default to the current semester, else the most recent one with absences
        if (semesters.some((s) => s.key === current)) return current;
        return semesters[semesters.length - 1]?.key ?? null;
    }, [semesterChoice, semesters]);

    const filteredAbsences = useMemo(
        () => getAbsences({ semesterKey, absences }),
        [semesterKey, absences]
    );

    const displayedAbsences = useMemo(() => {
        if (!selectedStatus) return filteredAbsences;
        return filteredAbsences.filter(
            (absence) => isAbsenceJustified(absence) === (selectedStatus === "justified")
        );
    }, [filteredAbsences, selectedStatus]);

    const { total, justified, unjustified } = useMemo(
        () => getAbsencesDurations(filteredAbsences),
        [filteredAbsences]
    );

    const semesterItems = useMemo<CarouselItem[]>(
        () => [
            { value: null, label: t("common.allSemesters") },
            ...semesters.map((s) => ({
                value: s.key,
                label: t("common.semesterLabel", {
                    sem: s.sem,
                    year: s.yearLabel,
                }),
            })),
        ],
        [semesters, t]
    );

    const statusItems = useMemo<CarouselItem[]>(
        () => [
            { value: null, label: t("absencesPage.allStatuses") },
            { value: "justified", label: t("absencesPage.statusJustified") },
            {
                value: "unjustified",
                label: t("absencesPage.statusUnjustified"),
            },
        ],
        [t]
    );

    // Remounts the results list on every filter change so the entrance
    // animation replays consistently (and not just from the 2nd change on).
    const filterKey = `${semesterKey ?? "all"}|${selectedStatus ?? "all"}`;

    return (
        <PullToRefresh
            onRefresh={handleRefresh}
            className="space-y-4 pt-4"
            isPullable={!isBusy}
            pullingText={t("common.pullToRefresh")}
            refreshingText={t("common.refreshing")}
        >
            <motion.div variants={staggerGroup} initial="hidden" animate="show">
                <motion.div variants={fadeIn} className="space-y-3 mb-4">
                    {semesters.length > 1 && (
                        <FilterCarousel
                            items={semesterItems}
                            selected={semesterKey}
                            onSelect={setSemesterChoice}
                        />
                    )}
                    <FilterCarousel
                        items={statusItems}
                        selected={selectedStatus}
                        onSelect={(v) =>
                            setSelectedStatus(v as StatusFilter | null)
                        }
                    />
                </motion.div>
                <motion.div variants={fadeIn}>
                    <Card className="mb-6 border-none bg-white shadow-md dark:bg-mauria-card">
                        <CardHeader className=" flex-row items-center space-y-0 space-x-4">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {t("absencesPage.total")}
                            </CardTitle>
                            <div className="text-4xl font-bold tracking-tight text-primary">
                                {total}
                            </div>
                        </CardHeader>

                        <Separator className="w-[90%] mx-auto" />

                        <CardContent className="pt-4">
                            <div className="flex items-start gap-6">
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-muted-foreground">
                                        {t("absencesPage.justified")}
                                    </div>
                                    <div className="mt-1 text-2xl font-semibold text-green-700/70 dark:text-green-400/60 oled:text-green-300/65">
                                        {justified}
                                    </div>
                                </div>

                                <div className="h-10 w-px bg-border" />

                                <div className="flex-1">
                                    <div className="text-sm font-medium text-muted-foreground">
                                        {t("absencesPage.unjustified")}
                                    </div>
                                    <div className="mt-1 text-2xl font-semibold text-amber-700/70 dark:text-amber-400/60 oled:text-amber-400/60">
                                        {unjustified}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
                <AnimatePresence mode="popLayout">
                    {displayedAbsences.length === 0 ? (
                        <motion.div
                            key={`empty-${filterKey}`}
                            variants={fadeIn}
                            initial="hidden"
                            animate="show"
                            exit="exit"
                        >
                            <div className="text-center py-12">
                                <div className="bg-mauria-card rounded-xl shadow-md p-8 max-w-md mx-auto">
                                    <div className="w-16 h-16 bg-muted-foreground/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                        {isBusy ? (
                                            <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                                        ) : (
                                            <CalendarOff className="w-8 h-8 text-muted-foreground" />
                                        )}
                                    </div>
                                    <h3 className="text-lg font-semibold mb-2">
                                        {isBusy
                                            ? t("common.loading")
                                            : t("absencesPage.noAbsences")}
                                    </h3>
                                    {!isBusy && (
                                        <p className="text-muted-foreground">
                                            {t(
                                                "absencesPage.noAbsencesPlaceholder"
                                            )}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={`list-${filterKey}`}
                            className="space-y-4 pb-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <AnimatePresence mode="popLayout">
                                {displayedAbsences.map((absence, index) =>
                                    index < 8 ? (
                                        <AnimatedAbsenceCard
                                            key={index}
                                            index={index}
                                            absence={absence}
                                        />
                                    ) : (
                                        <StaticAbsenceCard
                                            key={index}
                                            absence={absence}
                                        />
                                    )
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </PullToRefresh>
    );
}
