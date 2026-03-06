"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { GradeCard, GradeCardAnimate } from "./grade-card";
import { useCurrentYear } from "@/contexts/currentYearContext";
import { getGrades, getGradeBadgeInfoFromCode } from "@/lib/utils/grades";
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
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { GradePositionSlider } from "./grades-stats";
import { haptic } from "@/lib/utils/haptic";

const AnimatedGradeCard = memo(GradeCardAnimate);
const StaticGradeCard = memo(GradeCard);

function SubjectFilterCarousel({
    subjects,
    selected,
    onSelect,
    t,
}: {
    subjects: string[];
    selected: string | null;
    onSelect: (v: string | null) => void;
    t: (key: string) => string;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const snapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const programmaticScrollRef = useRef(false);
    const [sidePadding, setSidePadding] = useState(0);

    const allItems = useMemo(() => [null, ...subjects] as (string | null)[], [subjects]);

    useLayoutEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const update = () => setSidePadding(el.offsetWidth / 2);
        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const scrollToIndex = useCallback((idx: number, smooth = true) => {
        const container = containerRef.current;
        const item = itemRefs.current[idx];
        if (!container || !item) return;
        programmaticScrollRef.current = true;
        const target = item.offsetLeft + item.offsetWidth / 2 - container.offsetWidth / 2;
        container.scrollTo({ left: target, behavior: smooth ? "smooth" : "instant" });
        // Release after animation completes
        setTimeout(() => { programmaticScrollRef.current = false; }, 600);
    }, []);

    // Intercept horizontal touch events at the native level to prevent PullToRefresh from stealing them
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        let startX = 0;
        let startY = 0;
        let decided = false;
        const onTouchStart = (e: TouchEvent) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            decided = false;
        };
        const onTouchMove = (e: TouchEvent) => {
            if (decided) {
                e.stopPropagation();
                return;
            }
            const dx = Math.abs(e.touches[0].clientX - startX);
            const dy = Math.abs(e.touches[0].clientY - startY);
            if (dx > 5 || dy > 5) {
                decided = true;
                if (dx > dy) e.stopPropagation();
            }
        };
        el.addEventListener("touchstart", onTouchStart, { passive: true });
        el.addEventListener("touchmove", onTouchMove, { passive: false });
        return () => {
            el.removeEventListener("touchstart", onTouchStart);
            el.removeEventListener("touchmove", onTouchMove);
        };
    }, []);

    // Scroll to selected only on initial layout (when sidePadding is first computed)
    const initializedRef = useRef(false);
    useEffect(() => {
        if (sidePadding > 0 && !initializedRef.current) {
            initializedRef.current = true;
            const idx = allItems.indexOf(selected);
            if (idx >= 0) scrollToIndex(idx, false);
        }
    }, [sidePadding, allItems, selected, scrollToIndex]);

    const handleScroll = useCallback(() => {
        if (programmaticScrollRef.current) return;

        const container = containerRef.current;
        if (!container) return;
        const center = container.scrollLeft + container.offsetWidth / 2;

        let closestIdx = 0;
        let closestDist = Infinity;
        itemRefs.current.forEach((item, idx) => {
            if (!item) return;
            const dist = Math.abs(item.offsetLeft + item.offsetWidth / 2 - center);
            if (dist < closestDist) {
                closestDist = dist;
                closestIdx = idx;
            }
        });

        onSelect(allItems[closestIdx] ?? null);

        if (snapTimer.current) clearTimeout(snapTimer.current);
        snapTimer.current = setTimeout(() => scrollToIndex(closestIdx, true), 150);
    }, [allItems, onSelect, scrollToIndex]);

    return (
        <div className="relative overflow-hidden">
            <div
                ref={containerRef}
                onScroll={handleScroll}
                className="flex gap-2 overflow-x-auto py-1"
                style={{
                    paddingInline: sidePadding,
                    scrollbarWidth: "none",
                }}
            >
                {allItems.map((item, idx) => (
                    <Button
                        key={item ?? "__all__"}
                        ref={(el) => {
                            itemRefs.current[idx] = el;
                        }}
                        size="sm"
                        variant={selected === item ? "default" : "outline"}
                        onClick={() => {
                            haptic("Light");
                            onSelect(item);
                            scrollToIndex(idx);
                        }}
                        className="flex-shrink-0"
                    >
                        {item ? t(item) : t("gradesPage.allSubjects")}
                    </Button>
                ))}
            </div>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-14 bg-gradient-to-r from-background to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-14 bg-gradient-to-l from-background to-transparent" />
        </div>
    );
}

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
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
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

    const availableSubjects = useMemo(() => {
        const keys = new Set<string>();
        for (const grade of filteredGrades) {
            const info = getGradeBadgeInfoFromCode(grade.code);
            if (info?.labelKey) keys.add(info.labelKey);
        }
        return Array.from(keys).sort();
    }, [filteredGrades]);

    const displayedGrades = useMemo(() => {
        if (!selectedSubject) return filteredGrades;
        return filteredGrades.filter(
            (g) => getGradeBadgeInfoFromCode(g.code)?.labelKey === selectedSubject
        );
    }, [filteredGrades, selectedSubject]);

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
                className="space-y-3 mb-4"
            >
                <div className="flex items-center gap-2">
                    <Switch
                        id="onlyThisYear"
                        checked={showCurrentYearOnly}
                        onCheckedChange={toggleCurrentYearFilter}
                    />
                    <Label htmlFor="onlyThisYear">
                        {t("gradesPage.onlyCurrentYear")}
                    </Label>
                </div>
                {availableSubjects.length > 0 && (
                    <SubjectFilterCarousel
                        subjects={availableSubjects}
                        selected={selectedSubject}
                        onSelect={setSelectedSubject}
                        t={t}
                    />
                )}
            </motion.div>

            {displayedGrades.length === 0 ? (
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
                        {displayedGrades.map((grade, index) =>
                            index < 8 ? (
                                <AnimatedGradeCard
                                    key={index}
                                    grade={grade}
                                    onGradeClick={(grade) => {
                                        haptic("Light");
                                        setSelectedGrade(grade);
                                        setDrawerOpen(true);
                                    }}
                                />
                            ) : (
                                <StaticGradeCard
                                    key={index}
                                    grade={grade}
                                    onGradeClick={(grade) => {
                                        haptic("Light");
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
                                <h3 className="font-semibold text-lg text-black dark:text-white">
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
                            <GradePositionSlider grade={selectedGrade} />
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
