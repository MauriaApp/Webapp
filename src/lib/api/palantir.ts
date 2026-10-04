import { Lesson } from "@/types/aurion";
import {
    PalantirEntityKind,
    PalantirIndexStatus,
    PalantirPeopleResult,
    PalantirSearchResult,
} from "@/types/palantir";
import { APIResponse, apiRequest } from "./helper";
import { getSession } from "./aurion";

/**
 * The Palantir index lives in the API's memory and expires every Sunday, so
 * the first search of the week pays for the rebuild. These calls answer right
 * away whatever happens: the status they carry tells the page whether to show
 * a progress bar.
 */

export async function fetchPalantirStatus(): Promise<PalantirIndexStatus | null> {
    const session = getSession();
    if (!session) return null;

    const res = await apiRequest<APIResponse<PalantirIndexStatus>>(
        "/palantir/status",
        "POST",
        session
    );
    return res?.success ? (res.data ?? null) : null;
}

export async function searchPalantir(
    q: string,
    kinds?: PalantirEntityKind[]
): Promise<PalantirSearchResult | null> {
    const session = getSession();
    if (!session || !q.trim()) return null;

    const res = await apiRequest<APIResponse<PalantirSearchResult>>(
        "/palantir/search",
        "POST",
        kinds?.length ? { ...session, q, kinds } : { ...session, q }
    );
    return res?.success ? (res.data ?? null) : null;
}

export async function fetchPalantirPlanning(
    kind: PalantirEntityKind,
    id: string
): Promise<Lesson[] | null> {
    const session = getSession();
    if (!session) return null;

    const res = await apiRequest<APIResponse<Lesson[]>>(
        "/palantir/planning",
        "POST",
        { ...session, kind, id }
    );
    return res?.success ? (res.data ?? null) : null;
}

/**
 * Teachers and students of the index, on the same search as
 * searchPalantir. The API answers 404 for anyone but admins, so this
 * silently yields null for them — no admin UI ever shows, the results
 * just blend into the normal list for those who may see them.
 */
export async function searchPalantirPeople(
    q: string
): Promise<PalantirPeopleResult | null> {
    const session = getSession();
    if (!session || !q.trim()) return null;

    const res = await apiRequest<APIResponse<PalantirPeopleResult>>(
        "/palantir/people",
        "POST",
        { ...session, q }
    );
    return res?.success ? (res.data ?? null) : null;
}
