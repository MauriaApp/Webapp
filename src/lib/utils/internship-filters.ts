import {
    InternshipContractType,
    InternshipDuration,
    InternshipField,
    InternshipFilters,
} from "@/types/internships";

export const KINDS: InternshipContractType[] = [
    "internship",
    "apprenticeship",
    "seasonal",
    "job",
    "exchange",
];

export const FIELDS: InternshipField[] = [
    "engineering",
    "it",
    "business",
    "hospitality",
    "agri",
    "trades",
    "education",
    "health",
    "other",
];

export const DURATIONS: InternshipDuration[] = ["short", "medium", "long"];
export const LANGS = ["fr", "en", "es", "it", "de"] as const;

export const EMPTY_FILTERS: InternshipFilters = {
    q: "",
    kind: [],
    field: [],
    country: [],
    city: [],
    lang: [],
    housing: false,
    remote: false,
    paid: false,
    duration: [],
    posted: null,
    sort: "recent",
};

const list = <T extends string>(raw: string | null, allowed?: readonly T[]) =>
    (raw ?? "")
        .split(",")
        .map((v) => v.trim())
        .filter(
            (v): v is T => v !== "" && (!allowed || allowed.includes(v as T))
        );

/**
 * One serialization for both the page URL and the API query string, so a
 * filtered view can be shared and survives a reload.
 */
export function filtersToParams(filters: InternshipFilters): URLSearchParams {
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    (["kind", "field", "country", "city", "lang", "duration"] as const).forEach(
        (key) => {
            if (filters[key].length) params.set(key, filters[key].join(","));
        }
    );
    (["housing", "remote", "paid"] as const).forEach((key) => {
        if (filters[key]) params.set(key, "1");
    });
    if (filters.posted) params.set("posted", String(filters.posted));
    if (filters.q && filters.sort === "relevance") {
        params.set("sort", "relevance");
    }
    return params;
}

export function paramsToFilters(params: URLSearchParams): InternshipFilters {
    const posted = Number(params.get("posted"));
    return {
        q: params.get("q") ?? "",
        kind: list(params.get("kind"), KINDS),
        field: list(params.get("field"), FIELDS),
        country: list<string>(params.get("country")).map((c) =>
            c.toUpperCase()
        ),
        city: list<string>(params.get("city")),
        lang: list(params.get("lang"), LANGS),
        housing: params.get("housing") === "1",
        remote: params.get("remote") === "1",
        paid: params.get("paid") === "1",
        duration: list(params.get("duration"), DURATIONS),
        posted: posted === 7 || posted === 30 ? posted : null,
        sort: params.get("sort") === "relevance" ? "relevance" : "recent",
    };
}

/** Filters the user can clear one by one (search text and sort excluded). */
export function activeFilterCount(filters: InternshipFilters): number {
    return (
        filters.kind.length +
        filters.field.length +
        filters.country.length +
        filters.city.length +
        filters.lang.length +
        filters.duration.length +
        Number(filters.housing) +
        Number(filters.remote) +
        Number(filters.paid) +
        Number(filters.posted !== null)
    );
}

/** Adds the value if absent, removes it if present. */
export function toggle<T>(values: T[], value: T): T[] {
    return values.includes(value)
        ? values.filter((v) => v !== value)
        : [...values, value];
}
