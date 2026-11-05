import { regionName } from "./internship-format";

export interface JuniaStageFilters {
    years: string[];
    studyYears: string[];
    programs: string[];
}

export type { JuniaFacets } from "@/types/internships";

export const EMPTY_JUNIA_FILTERS: JuniaStageFilters = {
    years: [],
    studyYears: [],
    programs: [],
};

export function juniaActiveFilterCount(filters: JuniaStageFilters): number {
    return (
        filters.years.length +
        filters.studyYears.length +
        filters.programs.length
    );
}

export function toggleJuniaFilter(values: string[], value: string): string[] {
    return values.includes(value)
        ? values.filter((v) => v !== value)
        : [...values, value];
}

/** "2526" -> "25-26". */
export function promoLabel(year: string): string {
    return `${year.slice(0, 2)}-${year.slice(2)}`;
}

/** Accent-insensitive lowercase: "francais" finds "français". */
export function foldText(s: string): string {
    return s
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "");
}

/** ISO codes whose localized name contains the query: the server can't know
 * "Allemagne" means DE, so the client sends the codes along with the text. */
export function matchingCountryCodes(
    query: string,
    countries: string[],
    language: string
): string[] {
    const needle = foldText(query);
    if (!needle) {
        return [];
    }
    return countries.filter((code) =>
        foldText(regionName(code, language)).includes(needle)
    );
}

/** Query string shared by the search and facets endpoints. */
export function juniaParams(
    query: string,
    countryCodes: string[],
    filters: JuniaStageFilters,
    kind: string | null
): URLSearchParams {
    const params = new URLSearchParams();
    if (query) {
        params.set("q", query);
    }
    if (query && countryCodes.length) {
        params.set("cc", countryCodes.join(","));
    }
    if (kind) {
        params.set("kind", kind);
    }
    if (filters.years.length) {
        params.set("year", filters.years.join(","));
    }
    if (filters.studyYears.length) {
        params.set("studyYear", filters.studyYears.join(","));
    }
    if (filters.programs.length) {
        params.set("program", filters.programs.join(","));
    }
    return params;
}
