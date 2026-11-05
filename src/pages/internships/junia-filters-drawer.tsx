"use client";

import { ReactNode } from "react";
import { CalendarDays, GraduationCap, LucideIcon, School } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import {
    EMPTY_JUNIA_FILTERS,
    juniaActiveFilterCount,
    JuniaFacets,
    JuniaStageFilters,
    promoLabel,
    toggleJuniaFilter,
} from "@/lib/utils/junia-stage-filters";
import { cn } from "@/lib/utils/cn";

/** One selectable value with its result count; empty options are disabled.
 * The count's width is reserved from its UNFILTERED value (`base`), in
 * tabular digits, so toggling a filter never makes the chips reflow. */
function Option({
    active,
    count,
    base,
    onClick,
    children,
}: {
    active: boolean;
    count: number;
    base: number;
    onClick: () => void;
    children: ReactNode;
}) {
    const digits = String(Math.max(base, count)).length;
    return (
        <Button
            type="button"
            size="sm"
            variant={active ? "default" : "outline"}
            disabled={!active && !count}
            aria-pressed={active}
            onClick={onClick}
            // Same chip as the filter carousel: `border` on both states keeps
            // the size identical when the variant flips.
            className={cn("border", active && "border-transparent")}
        >
            {children}
            <span
                style={{ minWidth: `${digits}ch` }}
                className={cn(
                    "ml-1.5 inline-block text-center tabular-nums",
                    active ? "opacity-80" : "text-muted-foreground"
                )}
            >
                {count}
            </span>
        </Button>
    );
}

function Section({
    title,
    Icon,
    children,
}: {
    title: string;
    Icon: LucideIcon;
    children: ReactNode;
}) {
    return (
        <section className="space-y-2">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Icon className="h-4 w-4 text-muted-foreground" />
                {title}
            </h4>
            <div className="flex flex-wrap gap-2">{children}</div>
        </section>
    );
}

/** Values to list: those present in the facet, plus any already selected,
 * ordered by the unfiltered count (biggest first). */
function optionsOf(base: Record<string, number>, selected: string[]): string[] {
    return [...Object.keys(base), ...selected.filter((v) => !(v in base))].sort(
        (a, b) => (base[b] ?? 0) - (base[a] ?? 0)
    );
}

/**
 * Same drawer as the offers one: each section's counts are computed with all
 * the other filters applied but its own, so the chip being looked at never
 * empties, and the layout never reflows.
 */
export function JuniaFiltersDrawer({
    open,
    onOpenChange,
    filters,
    counts,
    base,
    total,
    onChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    filters: JuniaStageFilters;
    /** Filtered counts per section, own filter excluded. */
    counts: JuniaFacets;
    /** Unfiltered counts: the stable list of options and widths. */
    base: JuniaFacets;
    total: number;
    onChange: (filters: JuniaStageFilters) => void;
}) {
    const { t } = useTranslation();
    const set = (patch: Partial<JuniaStageFilters>) =>
        onChange({ ...filters, ...patch });

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="border-border bg-card pb-safe">
                <div className="flex max-h-[85vh] w-full flex-col px-4 sm:px-6">
                    <DrawerHeader className="px-0 pb-2 text-left">
                        <DrawerTitle className="text-xl font-semibold text-foreground">
                            {t("internshipsPage.junia.filters.title")}
                        </DrawerTitle>
                        <DrawerDescription className="sr-only">
                            {t("internshipsPage.junia.filters.title")}
                        </DrawerDescription>
                    </DrawerHeader>

                    <div className="space-y-5 overflow-y-auto pb-4 pt-2">
                        <Section
                            Icon={CalendarDays}
                            title={t("internshipsPage.junia.filters.promotion")}
                        >
                            {optionsOf(base.years, filters.years).map(
                                (value) => (
                                    <Option
                                        key={value}
                                        active={filters.years.includes(value)}
                                        count={counts.years[value] ?? 0}
                                        base={base.years[value] ?? 0}
                                        onClick={() =>
                                            set({
                                                years: toggleJuniaFilter(
                                                    filters.years,
                                                    value
                                                ),
                                            })
                                        }
                                    >
                                        {promoLabel(value)}
                                    </Option>
                                )
                            )}
                        </Section>

                        <Section
                            Icon={GraduationCap}
                            title={t("internshipsPage.junia.filters.studyYear")}
                        >
                            {optionsOf(base.studyYears, filters.studyYears).map(
                                (value) => (
                                    <Option
                                        key={value}
                                        active={filters.studyYears.includes(
                                            value
                                        )}
                                        count={counts.studyYears[value] ?? 0}
                                        base={base.studyYears[value] ?? 0}
                                        onClick={() =>
                                            set({
                                                studyYears: toggleJuniaFilter(
                                                    filters.studyYears,
                                                    value
                                                ),
                                            })
                                        }
                                    >
                                        {t(
                                            `internshipsPage.junia.studyYear.${value}`
                                        )}
                                    </Option>
                                )
                            )}
                        </Section>

                        <Section
                            Icon={School}
                            title={t("internshipsPage.junia.filters.program")}
                        >
                            {optionsOf(base.programs, filters.programs).map(
                                (value) => (
                                    <Option
                                        key={value}
                                        active={filters.programs.includes(
                                            value
                                        )}
                                        count={counts.programs[value] ?? 0}
                                        base={base.programs[value] ?? 0}
                                        onClick={() =>
                                            set({
                                                programs: toggleJuniaFilter(
                                                    filters.programs,
                                                    value
                                                ),
                                            })
                                        }
                                    >
                                        {value}
                                    </Option>
                                )
                            )}
                        </Section>
                    </div>

                    <div className="flex gap-2 border-t border-border py-4">
                        <Button
                            variant="outline"
                            disabled={juniaActiveFilterCount(filters) === 0}
                            onClick={() => onChange(EMPTY_JUNIA_FILTERS)}
                        >
                            {t("internshipsPage.filters.reset")}
                        </Button>
                        <Button
                            className="flex-1"
                            onClick={() => onOpenChange(false)}
                        >
                            {t("internshipsPage.junia.show", { count: total })}
                        </Button>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
