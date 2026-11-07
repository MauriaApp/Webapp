import { ReactNode } from "react";
import {
    Briefcase,
    CalendarDays,
    Globe,
    Hourglass,
    Languages,
    ListChecks,
    LucideIcon,
    MapPin,
    Network,
} from "lucide-react";
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
    activeFilterCount,
    DURATIONS,
    EMPTY_FILTERS,
    FIELDS,
    LANGS,
    toggle,
} from "@/lib/utils/internship-filters";
import { ORIGINS, ORIGIN_LOGOS } from "@/lib/utils/internship-origins";
import { regionName } from "@/lib/utils/internship-format";
import { cn } from "@/lib/utils/cn";
import { InternshipFacets, InternshipFilters } from "@/types/internships";

/**
 * One selectable value with its result count; empty options are disabled.
 * The count's width is reserved from its UNFILTERED value (`base`), in
 * tabular digits, so toggling a filter never makes the chips reflow.
 */
function Option({
    active,
    count,
    base,
    onClick,
    children,
}: {
    active: boolean;
    count: number | undefined;
    base: number | undefined;
    onClick: () => void;
    children: ReactNode;
}) {
    const digits = String(Math.max(base ?? 0, count ?? 0)).length;
    return (
        <Button
            type="button"
            size="sm"
            variant={active ? "default" : "outline"}
            disabled={!active && !count}
            aria-pressed={active}
            onClick={onClick}
            // Same chip as the FilterCarousel: `border` on both states keeps
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
                {count ?? 0}
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

/** Values to list: those present in the facet, plus any already selected. */
function valuesOf(
    facet: Record<string, number> | undefined,
    selected: string[]
): string[] {
    return [
        ...Object.keys(facet ?? {}),
        ...selected.filter((v) => !(v in (facet ?? {}))),
    ];
}

export function FiltersDrawer({
    open,
    onOpenChange,
    filters,
    facets,
    base,
    onChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    filters: InternshipFilters;
    facets: InternshipFacets | undefined;
    /** Counts with no filter applied: the stable list of options and widths. */
    base: InternshipFacets | undefined;
    onChange: (filters: InternshipFilters) => void;
}) {
    const { t, i18n } = useTranslation();
    const set = <K extends keyof InternshipFilters>(
        key: K,
        value: InternshipFilters[K]
    ) => onChange({ ...filters, [key]: value });

    // Options come from the unfiltered counts so none appears or vanishes
    // while filtering; the filtered counts only fill in the numbers. They are
    // ordered by that same unfiltered count (biggest first), so the order is
    // stable too. Ties keep their natural order.
    const source = base ?? facets;
    const byBase = <T extends string>(
        values: T[],
        counts: Partial<Record<T, number>> | undefined
    ) => [...values].sort((a, b) => (counts?.[b] ?? 0) - (counts?.[a] ?? 0));
    const fields = byBase(
        FIELDS.filter((f) => source?.field[f] || filters.field.includes(f)),
        source?.field
    );
    const countries = byBase(
        valuesOf(source?.country, filters.country),
        source?.country
    );
    const cities = byBase(valuesOf(source?.city, filters.city), source?.city);
    const langs = byBase(
        LANGS.filter((l) => source?.lang[l] || filters.lang.includes(l)),
        source?.lang
    );
    const total = facets?.total ?? 0;

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="border-border bg-card pb-safe">
                <div className="flex max-h-[85vh] w-full flex-col px-4 sm:px-6">
                    <DrawerHeader className="px-0 pb-2 text-left">
                        <DrawerTitle className="text-xl font-semibold text-foreground">
                            {t("internshipsPage.filters.title")}
                        </DrawerTitle>
                        <DrawerDescription className="sr-only">
                            {t("internshipsPage.filters.title")}
                        </DrawerDescription>
                    </DrawerHeader>

                    <div className="space-y-5 overflow-y-auto pb-4 pt-2">
                        <Section
                            Icon={Network}
                            title={t(
                                "internshipsPage.filters.sections.origin"
                            )}
                        >
                            {ORIGINS.map((o) => (
                                <Option
                                    key={o}
                                    active={filters.origin === o}
                                    count={facets?.origin?.[o]}
                                    base={base?.origin?.[o]}
                                    onClick={() =>
                                        set(
                                            "origin",
                                            filters.origin === o ? null : o
                                        )
                                    }
                                >
                                    {/* Network logos, see
                                     * /lib/utils/internship-origins. */}
                                    <img
                                        src={ORIGIN_LOGOS[o]}
                                        alt=""
                                        className="h-4 w-4 rounded-sm"
                                    />
                                    {t(`internshipsPage.origin.${o}`)}
                                </Option>
                            ))}
                        </Section>

                        {fields.length > 0 && (
                            <Section
                                Icon={Briefcase}
                                title={t(
                                    "internshipsPage.filters.sections.field"
                                )}
                            >
                                {fields.map((f) => (
                                    <Option
                                        key={f}
                                        active={filters.field.includes(f)}
                                        count={facets?.field[f]}
                                        base={base?.field[f]}
                                        onClick={() =>
                                            set(
                                                "field",
                                                toggle(filters.field, f)
                                            )
                                        }
                                    >
                                        {t(`internshipsPage.field.${f}`)}
                                    </Option>
                                ))}
                            </Section>
                        )}

                        {countries.length > 0 && (
                            <Section
                                Icon={Globe}
                                title={t(
                                    "internshipsPage.filters.sections.country"
                                )}
                            >
                                {countries.map((c) => (
                                    <Option
                                        key={c}
                                        active={filters.country.includes(c)}
                                        count={facets?.country[c]}
                                        base={base?.country[c]}
                                        onClick={() =>
                                            set(
                                                "country",
                                                toggle(filters.country, c)
                                            )
                                        }
                                    >
                                        {regionName(c, i18n.language)}
                                    </Option>
                                ))}
                            </Section>
                        )}

                        {cities.length > 0 && (
                            <Section
                                Icon={MapPin}
                                title={t(
                                    "internshipsPage.filters.sections.city"
                                )}
                            >
                                {cities.map((c) => (
                                    <Option
                                        key={c}
                                        active={filters.city.includes(c)}
                                        count={facets?.city[c]}
                                        base={base?.city[c]}
                                        onClick={() =>
                                            set("city", toggle(filters.city, c))
                                        }
                                    >
                                        {c}
                                    </Option>
                                ))}
                            </Section>
                        )}

                        <Section
                            Icon={ListChecks}
                            title={t(
                                "internshipsPage.filters.sections.conditions"
                            )}
                        >
                            {(["housing", "remote", "paid"] as const).map(
                                (key) => (
                                    <Option
                                        key={key}
                                        active={filters[key]}
                                        count={facets?.[key]}
                                        base={base?.[key]}
                                        onClick={() => set(key, !filters[key])}
                                    >
                                        {t(`internshipsPage.filters.${key}`)}
                                    </Option>
                                )
                            )}
                        </Section>

                        <Section
                            Icon={Hourglass}
                            title={t(
                                "internshipsPage.filters.sections.duration"
                            )}
                        >
                            {DURATIONS.map((d) => (
                                <Option
                                    key={d}
                                    active={filters.duration.includes(d)}
                                    count={facets?.duration[d]}
                                    base={base?.duration[d]}
                                    onClick={() =>
                                        set(
                                            "duration",
                                            toggle(filters.duration, d)
                                        )
                                    }
                                >
                                    {t(`internshipsPage.duration.${d}`)}
                                </Option>
                            ))}
                        </Section>

                        <Section
                            Icon={CalendarDays}
                            title={t("internshipsPage.filters.sections.posted")}
                        >
                            {([7, 30] as const).map((days) => (
                                <Option
                                    key={days}
                                    active={filters.posted === days}
                                    count={
                                        facets?.posted[
                                            String(days) as "7" | "30"
                                        ]
                                    }
                                    base={
                                        base?.posted[String(days) as "7" | "30"]
                                    }
                                    onClick={() =>
                                        set(
                                            "posted",
                                            filters.posted === days
                                                ? null
                                                : days
                                        )
                                    }
                                >
                                    {t(`internshipsPage.posted.${days}`)}
                                </Option>
                            ))}
                        </Section>

                        {langs.length > 0 && (
                            <Section
                                Icon={Languages}
                                title={t(
                                    "internshipsPage.filters.sections.lang"
                                )}
                            >
                                {langs.map((l) => (
                                    <Option
                                        key={l}
                                        active={filters.lang.includes(l)}
                                        count={facets?.lang[l]}
                                        base={base?.lang[l]}
                                        onClick={() =>
                                            set("lang", toggle(filters.lang, l))
                                        }
                                    >
                                        {t(`internshipsPage.lang.${l}`)}
                                    </Option>
                                ))}
                            </Section>
                        )}
                    </div>

                    <div className="flex gap-2 border-t border-border py-4">
                        <Button
                            variant="outline"
                            disabled={activeFilterCount(filters) === 0}
                            onClick={() =>
                                onChange({
                                    ...EMPTY_FILTERS,
                                    q: filters.q,
                                    sort: filters.sort,
                                })
                            }
                        >
                            {t("internshipsPage.filters.reset")}
                        </Button>
                        <Button
                            className="flex-1"
                            onClick={() => onOpenChange(false)}
                        >
                            {t("internshipsPage.filters.show", {
                                count: total,
                            })}
                        </Button>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
