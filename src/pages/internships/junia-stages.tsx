"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { Clock, Loader2, MapPin, SlidersHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CarouselItem, FilterCarousel } from "@/components/filter-carousel";
import { SearchInput } from "@/components/search-input";
import { getJuniaFacets, searchJuniaStages } from "@/lib/api/internships";
import { fadeIn, staggerGroup } from "@/lib/motion";
import { regionName } from "@/lib/utils/internship-format";
import { getDateLocale } from "@/lib/utils/translations";
import {
    EMPTY_JUNIA_FILTERS,
    juniaActiveFilterCount,
    juniaParams,
    JuniaStageFilters,
    matchingCountryCodes,
    promoLabel,
} from "@/lib/utils/junia-stage-filters";
import { JuniaStage } from "@/types/internships";
import { JuniaFiltersDrawer } from "./junia-filters-drawer";

const PAGE_SIZE = 60;
const DEBOUNCE_MS = 300;
const STALE_MS = 1000 * 60 * 5;
const KINDS = ["execution", "extra"] as const;

const MotionCard = motion(Card);

const EMPTY_FACETS = { years: {}, studyYears: {}, programs: {} };

function placeOf(stage: JuniaStage, language: string): string {
    const country = /^[A-Z]{2}$/.test(stage.country)
        ? regionName(stage.country, language)
        : stage.country;
    return [stage.city, country].filter(Boolean).join(", ");
}

function whenOf(
    stage: JuniaStage,
    locale: ReturnType<typeof getDateLocale>
): {
    period: string;
    months: number;
} {
    if (!stage.start || !stage.end) {
        return { period: "", months: 0 };
    }
    const start = parseISO(stage.start);
    const end = parseISO(stage.end);
    const months = Math.max(
        1,
        Math.round(differenceInCalendarDays(end, start) / 30)
    );
    return {
        period: `${format(start, "MMM yyyy", { locale })} – ${format(
            end,
            "MMM yyyy",
            { locale }
        )}`,
        months,
    };
}

export function JuniaStages() {
    const { t, i18n } = useTranslation();
    const [search, setSearch] = useState("");
    const [query, setQuery] = useState("");
    const [filters, setFilters] =
        useState<JuniaStageFilters>(EMPTY_JUNIA_FILTERS);
    const [kind, setKind] = useState<string | null>(null);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const locale = getDateLocale(i18n.language);

    // The search box types freely; the request follows 300 ms later.
    useEffect(() => {
        const text = search.trim();
        if (text === query) {
            return;
        }
        const timer = setTimeout(() => setQuery(text), DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [search, query]);

    // Counts with no filter at all: the drawer's stable option list. Its
    // country codes are also what a typed country name is resolved against.
    const { data: base } = useQuery({
        queryKey: ["junia-facets", ""],
        queryFn: async () => {
            const res = await getJuniaFacets(new URLSearchParams());
            if (!res) throw new Error("junia facets failed");
            return res;
        },
        staleTime: STALE_MS,
    });

    const countryCodes = useMemo(
        () => matchingCountryCodes(query, base?.countries ?? [], i18n.language),
        [query, base, i18n.language]
    );
    const params = useMemo(
        () => juniaParams(query, countryCodes, filters, kind),
        [query, countryCodes, filters, kind]
    );
    const paramsKey = params.toString();

    const {
        data,
        isPending,
        isError,
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ["junia", paramsKey],
        initialPageParam: 0,
        queryFn: async ({ pageParam }) => {
            const res = await searchJuniaStages(params, PAGE_SIZE, pageParam);
            // Null = request failed: surface it instead of caching "empty".
            if (!res) throw new Error("junia request failed");
            return res;
        },
        getNextPageParam: (last, pages) => {
            const loaded = pages.reduce((n, p) => n + p.stages.length, 0);
            return loaded < last.total ? loaded : undefined;
        },
        staleTime: STALE_MS,
        placeholderData: (previous) => previous,
    });

    // Section counts (own filter excluded server-side) and per-type counts.
    const { data: counts } = useQuery({
        queryKey: ["junia-facets", paramsKey],
        queryFn: async () => {
            const res = await getJuniaFacets(params);
            if (!res) throw new Error("junia facets failed");
            return res;
        },
        staleTime: STALE_MS,
        placeholderData: (previous) => previous,
    });

    const stages = useMemo(
        () => data?.pages.flatMap((page) => page.stages) ?? [],
        [data]
    );
    const total = data?.pages[0]?.total ?? 0;

    const kindItems: CarouselItem[] = useMemo(() => {
        const withCount = (label: string, count?: number) =>
            `${label}${count === undefined ? "" : ` (${count})`}`;
        return [
            {
                value: null,
                label: withCount(
                    t("internshipsPage.junia.all"),
                    counts?.kindAll
                ),
            },
            ...KINDS.flatMap((value): CarouselItem[] => {
                const item: CarouselItem = {
                    value,
                    label: withCount(
                        t(`internshipsPage.junia.kind.${value}`),
                        counts?.kinds[value]
                    ),
                };
                // International Break: no data yet, announced between the two.
                return value === "execution"
                    ? [
                          item,
                          {
                              value: "ib",
                              label: t("internshipsPage.junia.kind.ibSoon"),
                              disabled: true,
                          },
                      ]
                    : [item];
            }),
        ];
    }, [t, counts]);

    const activeCount =
        juniaActiveFilterCount(filters) + (kind !== null ? 1 : 0);

    // Load the next page as soon as the sentinel below the last row shows up.
    useEffect(() => {
        const node = sentinelRef.current;
        if (!node || !hasNextPage || isFetchingNextPage) {
            return;
        }
        const observer = new IntersectionObserver(
            ([entry]) => entry?.isIntersecting && fetchNextPage(),
            { rootMargin: "200px" }
        );
        observer.observe(node);
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage, data]);

    return (
        <motion.div
            className="space-y-6"
            variants={staggerGroup}
            initial="hidden"
            animate="show"
        >
            <motion.div variants={fadeIn} className="space-y-4">
                <div className="flex gap-2">
                    <SearchInput
                        className="min-w-0 flex-1"
                        placeholder={t("internshipsPage.junia.search")}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <Button
                        variant="outline"
                        size="icon"
                        className="relative shrink-0 bg-card"
                        aria-label={t("internshipsPage.filters.button")}
                        onClick={() => setFiltersOpen(true)}
                    >
                        <SlidersHorizontal />
                        {activeCount > 0 && (
                            <Badge className="absolute -right-1.5 -top-1.5 h-5 min-w-5 justify-center px-1 text-[10px]">
                                {activeCount}
                            </Badge>
                        )}
                    </Button>
                </div>
                <FilterCarousel
                    items={kindItems}
                    selected={kind}
                    onSelect={setKind}
                />
                <div className="flex items-center justify-center text-sm text-muted-foreground">
                    <span>
                        {t("internshipsPage.junia.count", {
                            count: total,
                        })}
                    </span>
                </div>
            </motion.div>

            {isPending ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : isError ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                    {t("internshipsPage.error")}
                </p>
            ) : stages.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                    {t("internshipsPage.junia.empty")}
                </p>
            ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {stages.map((stage) => {
                        const when = whenOf(stage, locale);
                        return (
                            <MotionCard key={stage.id} variants={fadeIn}>
                                <CardContent className="flex flex-col gap-1.5 p-4">
                                    <div className="flex items-start justify-between gap-2">
                                        <h3 className="text-sm font-semibold leading-tight text-foreground">
                                            {stage.company}
                                        </h3>
                                        <div className="flex shrink-0 gap-1.5">
                                            <Badge variant="secondary">
                                                {promoLabel(stage.year)}
                                            </Badge>
                                            <Badge variant="outline">
                                                {[stage.program, stage.level]
                                                    .filter(Boolean)
                                                    .join(" ")}
                                            </Badge>
                                        </div>
                                    </div>
                                    <p className="line-clamp-2 text-xs text-muted-foreground">
                                        {stage.subject}
                                    </p>
                                    <div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                                        <span className="flex min-w-0 items-center gap-1.5">
                                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                                            <span className="truncate">
                                                {placeOf(
                                                    stage,
                                                    i18n.language
                                                ) || "—"}
                                            </span>
                                        </span>
                                        {when.period && (
                                            <span className="flex shrink-0 items-center gap-1.5">
                                                <Clock className="h-3.5 w-3.5 shrink-0" />
                                                {when.period}
                                                {" · "}
                                                {t(
                                                    "internshipsPage.junia.months",
                                                    { count: when.months }
                                                )}
                                            </span>
                                        )}
                                    </div>
                                </CardContent>
                            </MotionCard>
                        );
                    })}
                </div>
            )}

            <div ref={sentinelRef} className="h-1" />
            {hasNextPage && (
                <Button
                    variant="outline"
                    className="w-full"
                    disabled={isFetchingNextPage}
                    onClick={() => fetchNextPage()}
                >
                    {t("internshipsPage.junia.more")}
                </Button>
            )}

            <JuniaFiltersDrawer
                open={filtersOpen}
                onOpenChange={setFiltersOpen}
                filters={filters}
                counts={counts ?? EMPTY_FACETS}
                base={base ?? EMPTY_FACETS}
                total={total}
                onChange={setFilters}
            />
        </motion.div>
    );
}
