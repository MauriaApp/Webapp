"use client";

import { Button } from "@/components/ui/button";
import { ChevronDown, GraduationCap, Info } from "lucide-react";
import { GradeCard, GradeCardAnimate } from "./grade-card";
import {
    getGrades,
    getGradeBadgeInfoFromCode,
    getSubjectCoefficients,
    detectStudentClass,
    getGradeSemesters,
    getCurrentSemesterKey,
} from "@/lib/utils/grades";
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
import {
    memo,
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils/cn";
import { fadeIn, staggerGroup } from "@/lib/motion";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { getDateLocale } from "@/lib/utils/translations";
import { useTranslation } from "react-i18next";
import { GradePositionSlider } from "./grades-stats";
import { LineChart, Line, CartesianGrid, XAxis, YAxis } from "recharts";
import {
    ChartContainer,
    ChartTooltip,
    ChartConfig,
} from "@/components/ui/chart";

const AnimatedGradeCard = memo(GradeCardAnimate);
const StaticGradeCard = memo(GradeCard);

function parseGradeValue(value: string): number | null {
    if (!value || value.trim() === "") return null;
    const n = parseFloat(value.replace(",", "."));
    return isNaN(n) ? null : n;
}

const LV2_LABEL_KEY = "gradesPage.subjects.lv2";

function computeAverages(grades: Grade[]) {
    const coefficients = getSubjectCoefficients(grades);
    const subjectMap = new Map<
        string,
        {
            labelKey: string;
            studentSum: number;
            classSum: number;
            studentCoef: number;
            classCoef: number;
        }
    >();

    for (const grade of grades) {
        const g = parseGradeValue(grade.grade);
        const avg = parseGradeValue(grade.average);
        const isPartiel = grade.code.toUpperCase().includes("PART");
        const coef =
            (parseGradeValue(grade.coefficient) ?? 1) * (isPartiel ? 1 : 2);
        const info = getGradeBadgeInfoFromCode(grade.code);
        const labelKey = info?.labelKey || grade.code;

        if (!subjectMap.has(labelKey)) {
            subjectMap.set(labelKey, {
                labelKey,
                studentSum: 0,
                classSum: 0,
                studentCoef: 0,
                classCoef: 0,
            });
        }
        const s = subjectMap.get(labelKey)!;
        if (g !== null) {
            s.studentSum += g * coef;
            s.studentCoef += coef;
        }
        if (avg !== null) {
            s.classSum += avg * coef;
            s.classCoef += coef;
        }
    }

    const bySubject = Array.from(subjectMap.values()).map((s) => ({
        labelKey: s.labelKey,
        student: s.studentCoef > 0 ? s.studentSum / s.studentCoef : null,
        class: s.classCoef > 0 ? s.classSum / s.classCoef : null,
        subjectCoef: coefficients[s.labelKey] ?? null,
        excluded: false,
    }));

    const computeOverall = (subjects: typeof bySubject) => {
        let studentSum = 0,
            classSum = 0,
            studentTotalCoef = 0,
            classTotalCoef = 0;
        for (const s of subjects) {
            if (s.excluded) continue;
            const sc = s.subjectCoef ?? 1;
            if (s.student !== null) {
                studentSum += s.student * sc;
                studentTotalCoef += sc;
            }
            if (s.class !== null) {
                classSum += s.class * sc;
                classTotalCoef += sc;
            }
        }
        return {
            student:
                studentTotalCoef > 0 ? studentSum / studentTotalCoef : null,
            class: classTotalCoef > 0 ? classSum / classTotalCoef : null,
        };
    };

    // LV2 is optional: only counted if it improves the student's average
    const lv2Idx = bySubject.findIndex((s) => s.labelKey === LV2_LABEL_KEY);
    if (lv2Idx !== -1 && bySubject[lv2Idx].student !== null) {
        bySubject[lv2Idx].excluded = true;
        const avgWithout = computeOverall(bySubject);
        bySubject[lv2Idx].excluded = false;
        const avgWith = computeOverall(bySubject);
        if (
            avgWithout.student !== null &&
            avgWith.student !== null &&
            avgWith.student <= avgWithout.student
        ) {
            bySubject[lv2Idx].excluded = true;
        }
    }

    return { overall: computeOverall(bySubject), bySubject };
}

function computeAverageEvolution(grades: Grade[]) {
    const sorted = [...grades]
        .filter((g) => g.date)
        .sort((a, b) => {
            const toMs = (d: string) =>
                new Date(d.split("/").reverse().join("-")).getTime();
            return toMs(a.date) - toMs(b.date);
        });

    if (sorted.length === 0) return [];

    const points: Array<{
        date: string;
        student: number | null;
        class: number | null;
    }> = [];
    const dateToIdx = new Map<string, number>();

    for (let i = 0; i < sorted.length; i++) {
        const avg = computeAverages(sorted.slice(0, i + 1));
        const dateKey = sorted[i].date;
        const point = {
            date: dateKey,
            student: avg.overall.student,
            class: avg.overall.class,
        };

        if (dateToIdx.has(dateKey)) {
            points[dateToIdx.get(dateKey)!] = point;
        } else {
            dateToIdx.set(dateKey, points.length);
            points.push(point);
        }
    }

    return points;
}

function GradesEvolutionTooltip({
    active,
    payload,
    label,
    formatDate,
    t,
}: {
    active?: boolean;
    payload?: Array<{ dataKey: string; value: number; color: string }>;
    label?: string;
    formatDate: (d: string) => string;
    t: (k: string) => string;
}) {
    if (!active || !payload?.length || !label) return null;
    const studentAboveEntry = payload.find(
        (p) => p.dataKey === "studentAbove" && p.value != null
    );
    const studentBelowEntry = payload.find(
        (p) => p.dataKey === "studentBelow" && p.value != null
    );
    const studentEntry = studentAboveEntry ?? studentBelowEntry;
    const cls = payload.find((p) => p.dataKey === "class");
    return (
        <div className="rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl space-y-1">
            <p className="font-medium">{formatDate(label)}</p>
            {studentEntry?.value != null && (
                <div className="flex items-center gap-2">
                    <div
                        className="h-2 w-2 shrink-0 rounded-[2px]"
                        style={{ backgroundColor: studentEntry.color }}
                    />
                    <span className="text-muted-foreground">
                        {t("gradesPage.myAverage")}
                    </span>
                    <span className="ml-auto pl-3 font-mono font-medium tabular-nums">
                        {Number(studentEntry.value).toFixed(2)}
                    </span>
                </div>
            )}
            {cls?.value != null && (
                <div className="flex items-center gap-2">
                    <div
                        className="h-2 w-2 shrink-0 rounded-[2px]"
                        style={{ backgroundColor: cls.color }}
                    />
                    <span className="text-muted-foreground">
                        {t("gradesPage.classAverage")}
                    </span>
                    <span className="ml-auto pl-3 font-mono font-medium tabular-nums">
                        {Number(cls.value).toFixed(2)}
                    </span>
                </div>
            )}
        </div>
    );
}

function splitStudentByComparison(
    data: Array<{ date: string; student: number | null; class: number | null }>
) {
    return data.map((point, i, arr) => {
        const { student } = point;
        const cls = point.class;
        if (student === null)
            return { ...point, studentAbove: null, studentBelow: null };

        const isAbove = cls === null || student >= cls;
        const prev = i > 0 ? arr[i - 1] : null;
        const prevIsAbove =
            prev && prev.student !== null
                ? prev.class === null || prev.student >= prev.class
                : isAbove;
        const isTransition = isAbove !== prevIsAbove;

        return {
            ...point,
            studentAbove:
                isAbove || (!isAbove && isTransition) ? student : null,
            studentBelow:
                !isAbove || (isAbove && isTransition) ? student : null,
        };
    });
}

function GradesEvolutionChart({
    grades,
    subject,
    t,
}: {
    grades: Grade[];
    subject: string | null;
    t: (key: string, opts?: Record<string, string>) => string;
}) {
    const { i18n } = useTranslation();
    const rawData = useMemo(() => computeAverageEvolution(grades), [grades]);
    const data = useMemo(() => splitStudentByComparison(rawData), [rawData]);

    if (data.length < 2) return null;

    const chartConfig: ChartConfig = {
        studentAbove: {
            label: t("gradesPage.myAverage"),
            theme: {
                light: "hsl(142 71% 29%)",
                dark: "hsl(142 69% 52%)",
                oled: "hsl(142 65% 68%)",
            },
        },
        studentBelow: {
            label: t("gradesPage.myAverage"),
            theme: {
                light: "hsl(24 88% 52%)",
                dark: "hsl(24 88% 58%)",
                oled: "hsl(24 88% 58%)",
            },
        },
        class: {
            label: t("gradesPage.classAverage"),
            theme: {
                light: "hsl(210 16% 65%)",
                dark: "hsl(210 16% 55%)",
                oled: "hsl(210 8% 44%)",
            },
        },
    };

    const formatXDate = (dateStr: string) => {
        try {
            return format(
                new Date(dateStr.split("/").reverse().join("-")),
                "d MMM",
                {
                    locale: getDateLocale(i18n.language),
                }
            );
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="pt-2 pb-1">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                {subject
                    ? t("gradesPage.averageEvolutionIn", {
                          subject: t(subject),
                      })
                    : t("gradesPage.averageEvolutionGeneral")}
            </p>
            <ChartContainer
                config={chartConfig}
                className="h-36 w-full aspect-auto"
            >
                <LineChart
                    data={data}
                    margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
                >
                    <CartesianGrid vertical={false} />
                    <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={formatXDate}
                        tick={{ fontSize: 10 }}
                        interval="preserveStartEnd"
                        minTickGap={30}
                    />
                    <YAxis
                        domain={[0, 20]}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 10 }}
                        tickCount={5}
                    />
                    <ChartTooltip
                        content={({ active, payload, label }) => (
                            <GradesEvolutionTooltip
                                active={active}
                                payload={
                                    payload as Array<{
                                        dataKey: string;
                                        value: number;
                                        color: string;
                                    }>
                                }
                                label={label as string}
                                formatDate={formatXDate}
                                t={t}
                            />
                        )}
                    />
                    <Line
                        dataKey="studentAbove"
                        stroke="var(--color-studentAbove)"
                        strokeWidth={2}
                        dot={false}
                        legendType="none"
                    />
                    <Line
                        dataKey="studentBelow"
                        stroke="var(--color-studentBelow)"
                        strokeWidth={2}
                        dot={false}
                        legendType="none"
                    />
                    <Line
                        dataKey="class"
                        stroke="var(--color-class)"
                        strokeWidth={1.5}
                        dot={false}
                        strokeDasharray="4 2"
                        connectNulls
                    />
                </LineChart>
            </ChartContainer>
        </div>
    );
}

function AveragesComparison({
    grades,
    chartGrades,
    subject,
    t,
}: {
    grades: Grade[];
    chartGrades: Grade[];
    subject: string | null;
    t: (key: string, opts?: Record<string, string>) => string;
}) {
    const [expanded, setExpanded] = useState(false);
    const averages = useMemo(() => computeAverages(grades), [grades]);

    if (averages.overall.student === null && averages.overall.class === null)
        return null;

    const fmt = (v: number | null) => (v !== null ? v.toFixed(2) : "—");
    const diff =
        (averages.overall.student ?? 0) - (averages.overall.class ?? 0);
    const aboveClass = diff > 0;
    const belowClass = diff < 0;

    return (
        <Card className="border-none bg-white shadow-md dark:bg-mauria-card overflow-hidden">
            <CardContent className="p-3 space-y-2">
                <button
                    className="w-full flex items-center justify-between gap-2"
                    onClick={() => setExpanded((v) => !v)}
                >
                    <div className="flex items-center gap-4">
                        <div className="text-left">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {t("gradesPage.myAverage")}
                            </p>
                            <p
                                className={`text-xl font-bold ${aboveClass ? "text-green-700/70 dark:text-green-400/60 oled:text-green-300/65" : belowClass ? "text-amber-700/70 dark:text-amber-400/60 oled:text-amber-400/60" : "text-gray-400 dark:text-gray-500"}`}
                            >
                                {fmt(averages.overall.student)}
                            </p>
                        </div>
                        <Separator orientation="vertical" className="h-8" />
                        <div className="text-left">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {t("gradesPage.classAverage")}
                            </p>
                            <p className="text-xl font-bold text-gray-500 dark:text-gray-400">
                                {fmt(averages.overall.class)}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                        <span>{t("gradesPage.bySubject")}</span>
                        <ChevronDown
                            className={`h-4 w-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                        />
                    </div>
                </button>

                {expanded && (
                    <div className="space-y-1 pt-1">
                        <Separator />
                        {averages.bySubject.map((subject) => {
                            const d =
                                (subject.student ?? 0) - (subject.class ?? 0);
                            const isAbove = subject.student !== null && d >= 0;
                            const isBelow = subject.student !== null && d < 0;
                            return (
                                <div
                                    key={subject.labelKey}
                                    className="flex items-center justify-between py-1"
                                >
                                    <div className="flex items-baseline gap-1 min-w-0">
                                        <p
                                            className={`text-sm truncate ${subject.excluded ? "text-gray-300 dark:text-gray-600 line-through" : "text-gray-500 dark:text-gray-400"}`}
                                        >
                                            {t(subject.labelKey) ||
                                                subject.labelKey}
                                        </p>
                                        {subject.subjectCoef !== null &&
                                            !subject.excluded && (
                                                <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 shrink-0">
                                                    ×{subject.subjectCoef}
                                                </span>
                                            )}
                                        {subject.excluded && (
                                            <span className="text-[10px] italic text-gray-300 dark:text-gray-600 shrink-0">
                                                {t("gradesPage.lv2NotCounted")}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm font-medium shrink-0 ml-2">
                                        <span
                                            className={
                                                subject.excluded
                                                    ? "text-gray-300 dark:text-gray-600"
                                                    : isAbove
                                                      ? "text-green-700/70 dark:text-green-400/60 oled:text-green-300/65"
                                                      : isBelow
                                                        ? "text-amber-700/70 dark:text-amber-400/60 oled:text-amber-400/60"
                                                        : "text-gray-400 dark:text-gray-500"
                                            }
                                        >
                                            {fmt(subject.student)}
                                        </span>
                                        <span className="text-gray-300 dark:text-gray-600">
                                            /
                                        </span>
                                        <span
                                            className={
                                                subject.excluded
                                                    ? "text-gray-300 dark:text-gray-600"
                                                    : "text-gray-500 dark:text-gray-400"
                                            }
                                        >
                                            {fmt(subject.class)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                        <Separator className="mt-2" />
                        <GradesEvolutionChart
                            grades={chartGrades}
                            subject={subject}
                            t={t}
                        />
                    </div>
                )}
                <div className="flex items-start gap-1.5 pt-1">
                    <Info className="h-3 w-3 mt-0.5 shrink-0 text-gray-400 dark:text-gray-500" />
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-tight">
                        {t("gradesPage.averageDisclaimer")}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

type CarouselItem = { value: string | null; label: string };

/**
 * Horizontal chip picker. Native CSS scroll-snap does the snapping (momentum,
 * flicks, release all handled by the browser); JS only (a) centres the selected
 * chip once on mount and (b) adopts whichever chip ends up centred after a
 * user scroll settles. No programmatic-vs-user scroll feedback loop.
 */
function FilterCarousel({
    items,
    selected,
    onSelect,
}: {
    items: CarouselItem[];
    selected: string | null;
    onSelect: (v: string | null) => void;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const didInitRef = useRef(false);
    const [sidePadding, setSidePadding] = useState(0);

    const selectedIndex = Math.max(
        0,
        items.findIndex((i) => i.value === selected)
    );

    const centerIndex = useCallback((idx: number, behavior: ScrollBehavior) => {
        itemRefs.current[idx]?.scrollIntoView({
            behavior,
            inline: "center",
            block: "nearest",
        });
    }, []);

    // Half-width padding on both ends so the first/last chip can reach centre.
    useLayoutEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const update = () => setSidePadding(el.clientWidth / 2);
        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // Centre the selected chip once, as soon as the padding is laid out.
    useEffect(() => {
        if (sidePadding <= 0 || didInitRef.current) return;
        didInitRef.current = true;
        centerIndex(selectedIndex, "auto");
    }, [sidePadding, selectedIndex, centerIndex]);

    // Smoothly re-centre whenever the selection changes. Runs *after* the
    // commit (and on the next frame) so the scroll animation starts on a
    // settled DOM — otherwise the very first change would land instantly.
    const prevSelectedRef = useRef(selected);
    useEffect(() => {
        if (prevSelectedRef.current === selected) return;
        prevSelectedRef.current = selected;
        if (!didInitRef.current) return;
        const id = requestAnimationFrame(() =>
            centerIndex(selectedIndex, "smooth")
        );
        return () => cancelAnimationFrame(id);
    }, [selected, selectedIndex, centerIndex]);

    // After a user scroll settles, adopt the chip closest to the centre.
    const handleScroll = useCallback(() => {
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        idleTimerRef.current = setTimeout(() => {
            idleTimerRef.current = null;
            const container = containerRef.current;
            if (!container) return;
            const center = container.scrollLeft + container.clientWidth / 2;
            let bestIdx = selectedIndex;
            let bestDist = Infinity;
            for (let i = 0; i < items.length; i++) {
                const el = itemRefs.current[i];
                if (!el) continue;
                const dist = Math.abs(
                    el.offsetLeft + el.offsetWidth / 2 - center
                );
                if (dist < bestDist) {
                    bestDist = dist;
                    bestIdx = i;
                }
            }
            const value = items[bestIdx]?.value ?? null;
            if (value !== selected) onSelect(value);
        }, 120);
    }, [items, selected, selectedIndex, onSelect]);

    useEffect(
        () => () => {
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        },
        []
    );

    // Keep horizontal drags from bubbling to the pull-to-refresh handler.
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        let startX = 0;
        let startY = 0;
        let axis: "h" | "v" | null = null;
        const onStart = (e: TouchEvent) => {
            const touch = e.touches[0];
            if (!touch) return;
            startX = touch.clientX;
            startY = touch.clientY;
            axis = null;
        };
        const onMove = (e: TouchEvent) => {
            const touch = e.touches[0];
            if (!touch) return;
            if (!axis) {
                const dx = Math.abs(touch.clientX - startX);
                const dy = Math.abs(touch.clientY - startY);
                if (dx < 5 && dy < 5) return;
                axis = dx > dy ? "h" : "v";
            }
            if (axis === "h") e.stopPropagation();
        };
        el.addEventListener("touchstart", onStart, { passive: true });
        el.addEventListener("touchmove", onMove, { passive: false });
        return () => {
            el.removeEventListener("touchstart", onStart);
            el.removeEventListener("touchmove", onMove);
        };
    }, []);

    return (
        <div className="relative overflow-hidden">
            <div
                ref={containerRef}
                onScroll={handleScroll}
                className="flex snap-x snap-mandatory gap-2 overflow-x-auto py-1 [&::-webkit-scrollbar]:hidden"
                style={{ paddingInline: sidePadding, scrollbarWidth: "none" }}
            >
                {items.map((item, idx) => {
                    const isSelected = item.value === selected;
                    return (
                        <Button
                            key={item.value ?? "__all__"}
                            ref={(el) => {
                                itemRefs.current[idx] = el;
                            }}
                            type="button"
                            size="sm"
                            variant={isSelected ? "default" : "outline"}
                            aria-pressed={isSelected}
                            onClick={() => {
                                if (isSelected) {
                                    // Selection won't change → re-centre here;
                                    // otherwise the effect above handles it.
                                    requestAnimationFrame(() =>
                                        centerIndex(idx, "smooth")
                                    );
                                } else {
                                    onSelect(item.value);
                                }
                            }}
                            // `border` on both states keeps the width identical
                            // when the variant flips, so chips never shift.
                            className={cn(
                                "shrink-0 snap-center border",
                                isSelected && "border-transparent"
                            )}
                        >
                            {item.label}
                        </Button>
                    );
                })}
            </div>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-14 bg-gradient-to-r from-background to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-14 bg-gradient-to-l from-background to-transparent" />
        </div>
    );
}

export function GradesPage() {
    const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const { t, i18n } = useTranslation();
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
    // undefined = not chosen yet (falls back to the current semester);
    // null = "All"; string = a specific semester key
    const [semesterChoice, setSemesterChoice] = useState<
        string | null | undefined
    >(undefined);

    const {
        data: grades = [],
        refetch,
        isLoading,
        isFetching,
    } = useQuery<Grade[], Error>({
        queryKey: ["grades"],
        queryFn: async (): Promise<Grade[]> => {
            const res = await fetchGrades();
            // Throw (don't return []) on failure so React Query keeps the
            // cached data instead of wiping it — e.g. a failed
            // refetch-on-focus after the app was backgrounded.
            if (!res?.success) {
                throw new Error("Failed to fetch grades");
            }
            return res.data ?? [];
        },
        staleTime: 1000 * 60 * 5, // 5 min frais
        gcTime: 1000 * 60 * 60 * 24, // 24h cache
        refetchOnWindowFocus: true, // refresh background si focus fenêtre
        placeholderData: (previousData) => previousData,
    });

    const isBusy = isLoading || isFetching;

    const handleRefresh = () => {
        void refetch();
    };

    const semesters = useMemo(() => getGradeSemesters(grades), [grades]);

    const semesterKey = useMemo(() => {
        if (semesterChoice !== undefined) return semesterChoice;
        const current = getCurrentSemesterKey();
        // Default to the current semester, else the most recent one with grades
        if (semesters.some((s) => s.key === current)) return current;
        return semesters[semesters.length - 1]?.key ?? null;
    }, [semesterChoice, semesters]);

    const filteredGrades = useMemo(
        () => getGrades({ semesterKey, grades }),
        [semesterKey, grades]
    );

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
            (g) =>
                getGradeBadgeInfoFromCode(g.code)?.labelKey === selectedSubject
        );
    }, [filteredGrades, selectedSubject]);

    const hasKnownClass = useMemo(
        () => detectStudentClass(filteredGrades) !== null,
        [filteredGrades]
    );

    const semesterItems = useMemo<CarouselItem[]>(
        () => [
            { value: null, label: t("gradesPage.allSemesters") },
            ...semesters.map((s) => ({
                value: s.key,
                label: t("gradesPage.semesterLabel", {
                    sem: s.sem,
                    year: s.yearLabel,
                }),
            })),
        ],
        [semesters, t]
    );

    const subjectItems = useMemo<CarouselItem[]>(
        () => [
            { value: null, label: t("gradesPage.allSubjects") },
            ...availableSubjects.map((s) => ({ value: s, label: t(s) })),
        ],
        [availableSubjects, t]
    );

    // Remounts the results list on every filter change so the entrance
    // animation replays consistently (and not just from the 2nd change on).
    const filterKey = `${semesterKey ?? "all"}|${selectedSubject ?? "all"}`;

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
                    {availableSubjects.length > 0 && (
                        <FilterCarousel
                            items={subjectItems}
                            selected={selectedSubject}
                            onSelect={setSelectedSubject}
                        />
                    )}
                </motion.div>

                <motion.div variants={fadeIn} className="space-y-3 pb-4">
                    {filteredGrades.length > 0 && (
                        <motion.div variants={fadeIn}>
                            {hasKnownClass ? (
                                <AveragesComparison
                                    grades={filteredGrades}
                                    chartGrades={displayedGrades}
                                    subject={selectedSubject}
                                    t={t}
                                />
                            ) : (
                                <Card className="border-none bg-white shadow-md dark:bg-mauria-card overflow-hidden">
                                    <CardContent className="p-3 flex items-start gap-1.5">
                                        <Info className="h-3 w-3 mt-0.5 shrink-0 text-gray-400 dark:text-gray-500" />
                                        <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-tight">
                                            {t(
                                                "gradesPage.averagesNotSupported"
                                            )}
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                        </motion.div>
                    )}

                    <AnimatePresence mode="wait">
                        {displayedGrades.length === 0 ? (
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
                                            <GraduationCap className="w-8 h-8 text-muted-foreground" />
                                        </div>
                                        <h3 className="text-lg font-semibold mb-2">
                                            {t("gradesPage.noGrades")}
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {t(
                                                "gradesPage.noGradesPlaceholder"
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key={`list-${filterKey}`}
                                className="space-y-4"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{
                                    opacity: 0,
                                    transition: { duration: 0.15 },
                                }}
                            >
                                <AnimatePresence mode="popLayout">
                                    {displayedGrades.map((grade, index) =>
                                        index < 8 ? (
                                            <AnimatedGradeCard
                                                key={index}
                                                index={index}
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
                    </AnimatePresence>
                </motion.div>
            </motion.div>
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
                                              {
                                                  locale: getDateLocale(
                                                      i18n.language
                                                  ),
                                              }
                                          )
                                        : t("gradesPage.dateNotSpecified")}
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
