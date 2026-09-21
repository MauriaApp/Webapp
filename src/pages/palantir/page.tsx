"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, DoorOpen, Loader2, Search, User, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import type FullCalendar from "@fullcalendar/react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CarouselItem, FilterCarousel } from "@/components/filter-carousel";
import { PlanningCalendar } from "@/components/planning-calendar";
import { AurionDownState } from "@/components/aurion-down-state";
import { useJuniaStatus } from "@/lib/hooks/use-junia-status";
import { fadeIn, staggerGroup } from "@/lib/motion";
import {
    fetchPalantirPlanning,
    fetchPalantirStatus,
    searchPalantir,
} from "@/lib/api/palantir";
import { PalantirEntity, PalantirEntityKind } from "@/types/palantir";
import { Lesson } from "@/types/aurion";

const DEBOUNCE_MS = 300;

const kindIcons = {
    room: DoorOpen,
    teacher: User,
    group: Users,
} as const;

export function PalantirPage() {
    const { t } = useTranslation();
    const aurionDown = useJuniaStatus()?.aurionDown ?? false;

    const [rawQuery, setRawQuery] = useState("");
    const [query, setQuery] = useState("");
    const [kind, setKind] = useState<PalantirEntityKind | null>(null);
    const [selected, setSelected] = useState<PalantirEntity | null>(null);
    const calendarRef = useRef<FullCalendar>(null);

    // Typing shouldn't fire a request per keystroke: the index is in the API's
    // memory, but the round trip still isn't free.
    useEffect(() => {
        const timeout = window.setTimeout(
            () => setQuery(rawQuery.trim()),
            DEBOUNCE_MS
        );
        return () => window.clearTimeout(timeout);
    }, [rawQuery]);

    const { data: search, isFetching: searching } = useQuery({
        queryKey: ["palantir", "search", query, kind],
        queryFn: () => searchPalantir(query, kind ? [kind] : undefined),
        enabled: query.length > 0,
        staleTime: 1000 * 60 * 5,
    });

    // The index is rebuilt once a week by whoever searches first. While that
    // runs, poll so the progress bar advances; stop as soon as it is ready.
    const { data: polledStatus } = useQuery({
        queryKey: ["palantir", "status"],
        queryFn: fetchPalantirStatus,
        refetchInterval: (q) =>
            q.state.data?.state === "building" ? 2000 : false,
        staleTime: 0,
    });

    const status = polledStatus ?? search?.status ?? null;
    const building = status?.state === "building";
    // A stale index keeps being served while the new one is built, so only a
    // completely empty one is worth blocking the results list for.
    const indexEmpty = status?.state === "empty";

    const { data: lessons = [], isFetching: loadingPlanning } = useQuery<
        Lesson[]
    >({
        queryKey: ["palantir", "planning", selected?.kind, selected?.id],
        queryFn: async () => {
            if (!selected) return [];
            return (await fetchPalantirPlanning(selected.kind, selected.id)) ?? [];
        },
        enabled: Boolean(selected),
        staleTime: 1000 * 60 * 5,
    });

    const kindItems = useMemo<CarouselItem[]>(
        () => [
            { value: null, label: t("palantirPage.kinds.all") },
            { value: "room", label: t("palantirPage.kinds.room") },
            { value: "teacher", label: t("palantirPage.kinds.teacher") },
            { value: "group", label: t("palantirPage.kinds.group") },
        ],
        [t]
    );

    const results = search?.results ?? [];
    const progress =
        status && status.total > 0
            ? Math.round((status.done / status.total) * 100)
            : 0;

    if (selected) {
        return (
            <motion.div
                variants={staggerGroup}
                initial="hidden"
                animate="show"
                className="space-y-4 py-4"
            >
                <motion.div variants={fadeIn} className="space-y-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelected(null)}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        {t("palantirPage.back")}
                    </Button>
                    <div>
                        <h2 className="text-lg font-semibold leading-tight">
                            {selected.label}
                        </h2>
                        {selected.detail && (
                            <p className="text-sm text-muted-foreground">
                                {selected.detail}
                            </p>
                        )}
                    </div>
                </motion.div>

                {loadingPlanning ? (
                    <motion.div
                        variants={fadeIn}
                        className="flex flex-col items-center gap-2 py-16 text-muted-foreground"
                    >
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <p className="text-sm">
                            {selected.kind === "group"
                                ? t("palantirPage.loadingGroup")
                                : t("palantirPage.loading")}
                        </p>
                    </motion.div>
                ) : lessons.length === 0 ? (
                    <motion.p
                        variants={fadeIn}
                        className="py-16 text-center text-sm text-muted-foreground"
                    >
                        {t("palantirPage.noLessons")}
                    </motion.p>
                ) : (
                    <motion.section
                        variants={fadeIn}
                        className="rounded-lg overflow-hidden shadow-lg"
                    >
                        <PlanningCalendar
                            ref={calendarRef}
                            eventSources={[lessons]}
                        />
                    </motion.section>
                )}
            </motion.div>
        );
    }

    return (
        <motion.div
            variants={staggerGroup}
            initial="hidden"
            animate="show"
            className="space-y-4 py-4"
        >
            <motion.div variants={fadeIn} className="space-y-1">
                <h2 className="text-xl font-bold">{t("palantirPage.title")}</h2>
                <p className="text-sm text-muted-foreground">
                    {t("palantirPage.subtitle")}
                </p>
            </motion.div>

            <motion.div variants={fadeIn} className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    value={rawQuery}
                    onChange={(e) => setRawQuery(e.target.value)}
                    placeholder={t("palantirPage.placeholder")}
                    className="pl-9"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                />
            </motion.div>

            <motion.div variants={fadeIn}>
                <FilterCarousel
                    items={kindItems}
                    selected={kind}
                    onSelect={(value) =>
                        setKind(value as PalantirEntityKind | null)
                    }
                />
            </motion.div>

            {building && (
                <motion.div variants={fadeIn}>
                    <Card>
                        <CardContent className="space-y-2 py-4">
                            <p className="text-sm font-medium">
                                {t("palantirPage.indexing.title")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {status?.phase === "plannings"
                                    ? t("palantirPage.indexing.plannings")
                                    : t("palantirPage.indexing.events", {
                                          done: status?.done ?? 0,
                                          total: status?.total ?? 0,
                                      })}
                            </p>
                            <Progress value={progress} />
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            <AnimatePresence mode="popLayout">
                {query.length === 0 ? (
                    <motion.p
                        key="hint"
                        variants={fadeIn}
                        className="py-12 text-center text-sm text-muted-foreground"
                    >
                        {t("palantirPage.hint")}
                    </motion.p>
                ) : searching && results.length === 0 ? (
                    <motion.div
                        key="searching"
                        variants={fadeIn}
                        className="flex justify-center py-12"
                    >
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </motion.div>
                ) : results.length === 0 ? (
                    <motion.div key="empty" variants={fadeIn}>
                        <div className="text-center py-12">
                            <div className="bg-mauria-card rounded-xl shadow-md p-8 max-w-md mx-auto">
                                {aurionDown && indexEmpty ? (
                                    <AurionDownState
                                        message={t(
                                            "palantirPage.aurionDownMessage"
                                        )}
                                    />
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        {indexEmpty
                                            ? t("palantirPage.indexing.wait")
                                            : t("palantirPage.noResults")}
                                    </p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.ul
                        key="results"
                        variants={staggerGroup}
                        className="space-y-2"
                    >
                        {results.map((entity) => {
                            const Icon = kindIcons[entity.kind];
                            return (
                                <motion.li
                                    key={`${entity.kind}-${entity.id}`}
                                    variants={fadeIn}
                                >
                                    <button
                                        type="button"
                                        onClick={() => setSelected(entity)}
                                        className="w-full text-left"
                                    >
                                        <Card className="transition-colors hover:bg-mauria-purple/5 dark:hover:bg-white/5">
                                            <CardContent className="flex items-center gap-3 py-3">
                                                <Icon className="h-5 w-5 shrink-0 text-mauria-purple dark:text-white" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium">
                                                        {entity.label}
                                                    </p>
                                                    {entity.detail && (
                                                        <p className="truncate text-xs text-muted-foreground">
                                                            {entity.detail}
                                                        </p>
                                                    )}
                                                </div>
                                                {entity.type === "Promotion" ? (
                                                    <Badge variant="secondary">
                                                        {t(
                                                            "palantirPage.promotion"
                                                        )}
                                                    </Badge>
                                                ) : entity.count > 0 ? (
                                                    <Badge variant="secondary">
                                                        {t(
                                                            "palantirPage.lessonCount",
                                                            { count: entity.count }
                                                        )}
                                                    </Badge>
                                                ) : null}
                                            </CardContent>
                                        </Card>
                                    </button>
                                </motion.li>
                            );
                        })}
                    </motion.ul>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
