import {
    InternshipFacets,
    InternshipFilters,
    InternshipOffer,
    InternshipSearchResult,
    JuniaFacetsResult,
    JuniaSearchResult,
} from "@/types/internships";
import { APIResponse } from "./helper";
import { filtersToParams } from "@/lib/utils/internship-filters";

/**
 * Offers are scraped nightly into a database on darklouis.dev, so nothing is
 * scraped while the user waits. The endpoints are public and read-only (no
 * Aurion credentials are sent). Null means the request failed (network, API
 * down).
 */
const INTERNSHIPS_URL =
    import.meta.env.VITE_INTERNSHIPS_URL ??
    "https://darklouis.dev/api/internships";

async function get<T>(
    path: string,
    params?: URLSearchParams
): Promise<T | null> {
    try {
        const query = params?.toString();
        const response = await fetch(
            `${INTERNSHIPS_URL}${path}${query ? `?${query}` : ""}`
        );
        if (!response.ok) return null;
        const body = (await response.json()) as APIResponse<T>;
        return body.success ? (body.data ?? null) : null;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
        return null;
    }
}

/** A page of postings; `description` is a short summary here. */
export function searchInternships(
    filters: InternshipFilters,
    limit: number,
    offset: number
): Promise<InternshipSearchResult | null> {
    const params = filtersToParams(filters);
    params.set("limit", String(limit));
    if (offset) params.set("offset", String(offset));
    return get<InternshipSearchResult>("/search", params);
}

/** Counts per filter value, given the filters already applied. */
export function getInternshipFacets(
    filters: InternshipFilters
): Promise<InternshipFacets | null> {
    return get<InternshipFacets>("/facets", filtersToParams(filters));
}

/** One offer with its full description and its other locations. */
export function getInternshipOffer(
    id: number
): Promise<InternshipOffer | null> {
    return get<InternshipOffer>(`/offer/${id}`);
}

/** A page of Junia internships; `params` come from `juniaParams`. */
export function searchJuniaStages(
    params: URLSearchParams,
    limit: number,
    offset: number
): Promise<JuniaSearchResult | null> {
    const next = new URLSearchParams(params);
    next.set("limit", String(limit));
    if (offset) next.set("offset", String(offset));
    return get<JuniaSearchResult>("/junia/search", next);
}

/** Counts per section, each with the other filters applied. */
export function getJuniaFacets(
    params: URLSearchParams
): Promise<JuniaFacetsResult | null> {
    return get<JuniaFacetsResult>("/junia/facets", params);
}
