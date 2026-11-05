"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router";
import { motion } from "framer-motion";
import { formatDistanceToNow, parseISO } from "date-fns";
import {
    Banknote,
    Clock,
    ExternalLink,
    House,
    Laptop,
    Loader2,
    MapPin,
    SlidersHorizontal,
    Star,
    X,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import { SearchInput } from "@/components/search-input";
import { CarouselItem, FilterCarousel } from "@/components/filter-carousel";
import {
    getInternshipFacets,
    getInternshipOffer,
    searchInternships,
} from "@/lib/api/internships";
import { fadeIn, fadeInIndexed, staggerGroup } from "@/lib/motion";
import {
    activeFilterCount,
    EMPTY_FILTERS,
    filtersToParams,
    KINDS,
    paramsToFilters,
    toggle,
} from "@/lib/utils/internship-filters";
import { formatSalary, regionName } from "@/lib/utils/internship-format";
import { INTERNSHIP_SITES, siteName } from "@/lib/utils/internship-sites";
import { getDateLocale } from "@/lib/utils/translations";
import { cn } from "@/lib/utils/cn";
import { InternshipFilters, InternshipOffer } from "@/types/internships";
import { FiltersDrawer } from "./filters-drawer";

const PAGE_SIZE = 30;
const DEBOUNCE_MS = 300;
const STALE_MS = 1000 * 60 * 5;

const MotionCard = motion(Card);

type Tab = "offers" | "sites";

/** Small facts about an offer: housing, salary, duration, remote. */
function OfferFacts({
    offer,
    className,
}: {
    offer: InternshipOffer;
    className?: string;
}) {
    const { t, i18n } = useTranslation();
    const facts = [
        offer.salary && {
            key: "salary",
            Icon: Banknote,
            label: formatSalary(offer.salary, i18n.language, t),
        },
        offer.housing && {
            key: "housing",
            Icon: House,
            label: t("internshipsPage.housing"),
        },
        offer.durationMonths && {
            key: "duration",
            Icon: Clock,
            label: t("internshipsPage.duration.months", {
                count: offer.durationMonths,
            }),
        },
        offer.remote && {
            key: "remote",
            Icon: Laptop,
            label: t("internshipsPage.remote"),
        },
    ].filter((fact) => !!fact);
    if (facts.length === 0) return null;
    return (
        <div
            className={cn(
                "flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground",
                className
            )}
        >
            {facts.map(({ key, Icon, label }) => (
                <span key={key} className="flex items-center gap-1">
                    <Icon className="h-3 w-3 shrink-0" />
                    {label}
                </span>
            ))}
        </div>
    );
}

export function InternshipsPage() {
    const { t, i18n } = useTranslation();
    const [tab, setTab] = useState<Tab>("offers");
    const [selected, setSelected] = useState<InternshipOffer | null>(null);
    const [filtersOpen, setFiltersOpen] = useState(false);

    // The URL is the source of truth for filters: shareable, survives reloads.
    const [params, setParams] = useSearchParams();
    const filters = useMemo(() => paramsToFilters(params), [params]);
    const filtersKey = filtersToParams(filters).toString();
    const apply = (next: InternshipFilters) =>
        setParams(filtersToParams(next), { replace: true });

    // The search box types freely; the URL (and so the query) follows 300 ms later.
    const [search, setSearch] = useState(filters.q);
    useEffect(() => {
        const text = search.trim();
        if (text === filters.q) return;
        const timer = setTimeout(
            () =>
                apply({
                    ...filters,
                    q: text,
                    sort: text ? "relevance" : "recent",
                }),
            DEBOUNCE_MS
        );
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, filters.q]);

    const { data, isPending, isError, hasNextPage, fetchNextPage, isFetchingNextPage } =
        useInfiniteQuery({
            queryKey: ["internships", filtersKey],
            initialPageParam: 0,
            queryFn: async ({ pageParam }) => {
                const res = await searchInternships(filters, PAGE_SIZE, pageParam);
                // Null = request failed: surface it instead of caching "empty".
                if (!res) throw new Error("internships request failed");
                return res;
            },
            getNextPageParam: (last, pages) => {
                const loaded = pages.reduce((n, p) => n + p.offers.length, 0);
                return loaded < last.total ? loaded : undefined;
            },
            staleTime: STALE_MS,
            placeholderData: (previous) => previous,
        });

    // Counts per filter value, given the other active filters.
    const { data: facets } = useQuery({
        queryKey: ["internships-facets", filtersKey],
        queryFn: async () => {
            const res = await getInternshipFacets(filters);
            if (!res) throw new Error("internships facets failed");
            return res;
        },
        staleTime: STALE_MS,
        placeholderData: (previous) => previous,
    });

    // Counts with no filter: the stable list of options and widths in the drawer.
    const { data: baseFacets } = useQuery({
        queryKey: ["internships-facets", ""],
        queryFn: async () => {
            const res = await getInternshipFacets(EMPTY_FILTERS);
            if (!res) throw new Error("internships facets failed");
            return res;
        },
        staleTime: STALE_MS,
    });

    // The list only carries a summary: the full text loads when a card opens.
    const { data: fullOffer } = useQuery({
        queryKey: ["internship-offer", selected?.id],
        queryFn: () => getInternshipOffer(selected!.id),
        enabled: selected !== null,
        staleTime: 1000 * 60 * 60,
    });

    // Load the next page as soon as the sentinel below the last row shows up.
    const sentinelRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const node = sentinelRef.current;
        if (!node || !hasNextPage || isFetchingNextPage) return;
        const observer = new IntersectionObserver(
            ([entry]) => entry?.isIntersecting && fetchNextPage(),
            { rootMargin: "200px" }
        );
        observer.observe(node);
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage, data]);

    const offers = useMemo(
        () => data?.pages.flatMap((page) => page.offers) ?? [],
        [data]
    );
    const total = data?.pages[0]?.totalOffers ?? 0;

    const kindItems: CarouselItem[] = useMemo(() => {
        const withCount = (label: string, count?: number) =>
            `${label}${count === undefined ? "" : ` (${count})`}`;
        return [
            {
                value: null,
                label: withCount(t("internshipsPage.contract.all"), facets?.kindAll),
            },
            ...KINDS.map((value) => ({
                value,
                label: withCount(
                    t(`internshipsPage.contract.${value}`),
                    facets?.kind[value]
                ),
            })),
        ];
    }, [t, facets]);

    // One removable chip per active filter (a single kind lives in the carousel).
    const chips = useMemo(() => {
        const remove = (patch: Partial<InternshipFilters>) =>
            apply({ ...filters, ...patch });
        return [
            ...(filters.kind.length > 1
                ? filters.kind.map((k) => ({
                      key: `kind-${k}`,
                      label: t(`internshipsPage.contract.${k}`),
                      onRemove: () => remove({ kind: toggle(filters.kind, k) }),
                  }))
                : []),
            ...filters.field.map((f) => ({
                key: `field-${f}`,
                label: t(`internshipsPage.field.${f}`),
                onRemove: () => remove({ field: toggle(filters.field, f) }),
            })),
            ...filters.country.map((c) => ({
                key: `country-${c}`,
                label: regionName(c, i18n.language),
                onRemove: () => remove({ country: toggle(filters.country, c) }),
            })),
            ...filters.city.map((c) => ({
                key: `city-${c}`,
                label: c,
                onRemove: () => remove({ city: toggle(filters.city, c) }),
            })),
            ...filters.duration.map((d) => ({
                key: `duration-${d}`,
                label: t(`internshipsPage.duration.${d}`),
                onRemove: () => remove({ duration: toggle(filters.duration, d) }),
            })),
            ...filters.lang.map((l) => ({
                key: `lang-${l}`,
                label: t(`internshipsPage.lang.${l}`),
                onRemove: () => remove({ lang: toggle(filters.lang, l) }),
            })),
            ...(["housing", "remote", "paid"] as const)
                .filter((key) => filters[key])
                .map((key) => ({
                    key,
                    label: t(`internshipsPage.filters.${key}`),
                    onRemove: () => remove({ [key]: false }),
                })),
            ...(filters.posted
                ? [
                      {
                          key: "posted",
                          label: t(`internshipsPage.posted.${filters.posted}`),
                          onRemove: () => remove({ posted: null }),
                      },
                  ]
                : []),
        ];
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters, t, i18n.language]);

    const locale = getDateLocale(i18n.language);
    const postedLabel = (offer: InternshipOffer) => {
        const iso = offer.postedAt ?? offer.firstSeenAt;
        return formatDistanceToNow(parseISO(iso), {
            addSuffix: true,
            locale,
        });
    };
    const placeOf = (offer: InternshipOffer) =>
        offer.location ||
        (offer.countryCode ? regionName(offer.countryCode, i18n.language) : "");

    return (
        <motion.div
            className="mt-4 space-y-6 sm:px-6 lg:px-0"
            variants={staggerGroup}
            initial="hidden"
            animate="show"
        >
            <motion.div variants={fadeIn} className="flex gap-2">
                {(["offers", "sites"] as const).map((value) => (
                    <Button
                        key={value}
                        variant={tab === value ? "default" : "outline"}
                        size="sm"
                        className="flex-1"
                        onClick={() => setTab(value)}
                    >
                        {t(`internshipsPage.tabs.${value}`)}
                    </Button>
                ))}
            </motion.div>

            {tab === "offers" ? (
                <>
                    <motion.div variants={fadeIn} className="space-y-4">
                        <div className="flex gap-2">
                            <SearchInput
                                className="min-w-0 flex-1"
                                placeholder={t("internshipsPage.search")}
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
                                {activeFilterCount(filters) > 0 && (
                                    <Badge className="absolute -right-1.5 -top-1.5 h-5 min-w-5 justify-center px-1 text-[10px]">
                                        {activeFilterCount(filters)}
                                    </Badge>
                                )}
                            </Button>
                        </div>
                        <FilterCarousel
                            items={kindItems}
                            selected={filters.kind.length === 1 ? filters.kind[0]! : null}
                            onSelect={(value) =>
                                apply({
                                    ...filters,
                                    kind: value ? [value as (typeof KINDS)[number]] : [],
                                })
                            }
                        />
                        {chips.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2">
                                {chips.map((chip) => (
                                    <Button
                                        key={chip.key}
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={chip.onRemove}
                                    >
                                        {chip.label}
                                        <X />
                                    </Button>
                                ))}
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                        apply({
                                            ...EMPTY_FILTERS,
                                            q: filters.q,
                                            sort: filters.sort,
                                        })
                                    }
                                >
                                    {t("internshipsPage.filters.clearAll")}
                                </Button>
                            </div>
                        )}
                        {!isPending && !isError && (
                            <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
                                <span>{t("internshipsPage.count", { count: total })}</span>
                                {filters.q && (
                                    <span className="flex items-center gap-1">
                                        {(["recent", "relevance"] as const).map((sort) => (
                                            <button
                                                key={sort}
                                                type="button"
                                                onClick={() => apply({ ...filters, sort })}
                                                className={cn(
                                                    "rounded-full px-2 py-0.5 text-xs",
                                                    filters.sort === sort
                                                        ? "bg-secondary text-secondary-foreground"
                                                        : "hover:text-foreground"
                                                )}
                                            >
                                                {t(`internshipsPage.sort.${sort}`)}
                                            </button>
                                        ))}
                                    </span>
                                )}
                            </div>
                        )}
                    </motion.div>

                    {isPending && (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    )}

                    {isError && (
                        <p className="py-12 text-center text-muted-foreground">
                            {t("internshipsPage.error")}
                        </p>
                    )}

                    {!isPending && !isError && offers.length === 0 && (
                        <p className="py-12 text-center text-muted-foreground">
                            {t("internshipsPage.empty")}
                        </p>
                    )}

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {offers.map((offer, index) => (
                            <MotionCard
                                key={offer.id}
                                variants={fadeInIndexed}
                                custom={Math.min(index, 12)}
                                initial="hidden"
                                animate="show"
                                className="cursor-pointer rounded-lg border border-border bg-card transition-[transform,translate,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-lg"
                                onClick={() => setSelected(offer)}
                            >
                                <CardContent className="flex h-full flex-col gap-2 p-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <h3 className="break-words text-sm font-semibold leading-tight text-foreground">
                                            {offer.title}
                                        </h3>
                                        <Badge
                                            variant="secondary"
                                            className="shrink-0 text-[10px]"
                                        >
                                            {t(
                                                `internshipsPage.contract.${offer.contractType}`
                                            )}
                                        </Badge>
                                    </div>
                                    {(offer.company || placeOf(offer)) && (
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="min-w-0 truncate text-xs font-medium text-foreground">
                                                {offer.company}
                                            </p>
                                            {placeOf(offer) && (
                                                <p className="ml-auto flex min-w-0 max-w-[55%] items-center gap-1 text-xs text-muted-foreground">
                                                    <MapPin className="h-3 w-3 shrink-0" />
                                                    <span className="truncate">
                                                        {offer.variants > 1
                                                            ? t("internshipsPage.variants", {
                                                                  count: offer.variants,
                                                              })
                                                            : placeOf(offer)}
                                                    </span>
                                                </p>
                                            )}
                                        </div>
                                    )}
                                    <p className="line-clamp-2 text-xs text-muted-foreground">
                                        {offer.description}
                                    </p>
                                    <OfferFacts offer={offer} />
                                    <p className="mt-auto pt-1 text-[11px] text-muted-foreground">
                                        {siteName(offer.source)}
                                        {" · "}
                                        {postedLabel(offer)}
                                    </p>
                                </CardContent>
                            </MotionCard>
                        ))}
                    </div>

                    {/* Sits below the last row (full or not): reaching it loads the next page. */}
                    <div ref={sentinelRef} className="flex h-10 justify-center pb-4">
                        {isFetchingNextPage && (
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        )}
                    </div>
                </>
            ) : (
                <>
                    <motion.p
                        variants={fadeIn}
                        className="text-center text-sm text-muted-foreground"
                    >
                        {t("internshipsPage.sitesIntro")}
                    </motion.p>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {INTERNSHIP_SITES.map((site, index) => (
                            <MotionCard
                                key={site.id}
                                variants={fadeInIndexed}
                                custom={Math.min(index, 12)}
                                initial="hidden"
                                animate="show"
                                className="cursor-pointer rounded-lg border border-border bg-card transition-[transform,translate,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-lg"
                                onClick={() =>
                                    window.open(site.url, "_blank", "noopener,noreferrer")
                                }
                            >
                                <CardContent className="flex h-full flex-col gap-2 p-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <h3 className="flex items-center gap-1.5 text-sm font-semibold leading-tight text-foreground">
                                            {site.name}
                                            {/* The most relevant source for Junia engineers. */}
                                            {site.id === "jobteaser" && (
                                                <Star className="h-3.5 w-3.5 shrink-0 fill-primary text-primary" />
                                            )}
                                        </h3>
                                        <div className="flex shrink-0 items-center gap-1.5">
                                            {site.kind === "offers" && (
                                                <Badge className="text-[10px]">
                                                    {t("internshipsPage.inMauria")}
                                                </Badge>
                                            )}
                                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {t(`internshipsPage.sites.${site.id}`)}
                                    </p>
                                </CardContent>
                            </MotionCard>
                        ))}
                    </div>
                </>
            )}


            <FiltersDrawer
                open={filtersOpen}
                onOpenChange={setFiltersOpen}
                filters={filters}
                facets={facets}
                base={baseFacets}
                onChange={apply}
            />

            <Drawer
                open={selected !== null}
                onOpenChange={(open) => !open && setSelected(null)}
            >
                <DrawerContent className="border-border bg-card pb-safe">
                    {selected && (
                        <div className="w-full px-4 sm:px-6">
                            <DrawerHeader className="px-0 pb-0 text-left">
                                <DrawerTitle className="text-xl font-semibold text-foreground">
                                    {selected.title}
                                </DrawerTitle>
                                <DrawerDescription className="text-sm text-muted-foreground">
                                    {[
                                        selected.company,
                                        selected.variants > 1
                                            ? t("internshipsPage.variants", {
                                                  count: selected.variants,
                                              })
                                            : placeOf(selected),
                                    ]
                                        .filter(Boolean)
                                        .join(" · ")}
                                </DrawerDescription>
                            </DrawerHeader>
                            <div className="max-h-[60vh] space-y-4 overflow-y-auto pb-8 pt-4">
                                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                    <Badge variant="secondary">
                                        {t(
                                            `internshipsPage.contract.${selected.contractType}`
                                        )}
                                    </Badge>
                                    <Badge variant="outline">
                                        {t(`internshipsPage.field.${selected.field}`)}
                                    </Badge>
                                    <span>
                                        {siteName(selected.source)}
                                        {" · "}
                                        {postedLabel(selected)}
                                    </span>
                                </div>
                                <OfferFacts offer={selected} className="text-xs" />
                                <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
                                    {fullOffer?.description ??
                                        selected.description}
                                </p>
                                <Button variant="outline" asChild className="w-full">
                                    <a
                                        href={selected.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <ExternalLink className="mr-2 h-4 w-4" />
                                        {t("internshipsPage.viewOffer")}
                                    </a>
                                </Button>
                                {fullOffer?.otherVariants &&
                                    fullOffer.otherVariants.length > 0 && (
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-semibold text-foreground">
                                                {t("internshipsPage.otherLocations")}
                                            </h4>
                                            <ul className="divide-y divide-border rounded-lg border border-border">
                                                {fullOffer.otherVariants.map((variant) => (
                                                    <li key={variant.id}>
                                                        <a
                                                            href={variant.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center justify-between gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent"
                                                        >
                                                            <span className="flex min-w-0 items-center gap-1.5">
                                                                <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                                                <span className="truncate">
                                                                    {variant.location}
                                                                </span>
                                                            </span>
                                                            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                            </div>
                        </div>
                    )}
                </DrawerContent>
            </Drawer>
        </motion.div>
    );
}
