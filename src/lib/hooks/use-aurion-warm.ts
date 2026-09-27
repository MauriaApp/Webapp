import { useQuery } from "@tanstack/react-query";
import { getSession, warmAurionSession } from "@/lib/api/aurion";

export const AURION_WARM_QUERY_KEY = ["aurionWarm"] as const;

/**
 * Warms the API's Aurion session as soon as the app opens (call this from
 * `RequireAuth`), instead of leaving it to whichever feature fetch happens
 * to run first. Every screen that needs Aurion data gates its own query on
 * `isWarming` rather than triggering the warm-up itself, so the login+home
 * cost is paid exactly once no matter which page loads first. Disabled
 * without a stored session, so it never runs on the login page.
 */
export function useAurionWarm() {
    const hasSession = !!getSession();

    const query = useQuery<boolean, Error>({
        queryKey: AURION_WARM_QUERY_KEY,
        queryFn: warmAurionSession,
        enabled: hasSession,
        staleTime: 1000 * 60 * 10,
        gcTime: 1000 * 60 * 60 * 24,
    });

    // Only blocks dependents through the very first attempt: once warm has
    // settled once (success or failure), feature fetches are free to run —
    // each already knows how to log itself in if the session turns out
    // stale, so warm is an optimization, never a hard dependency.
    return { isWarming: hasSession && query.status === "pending" };
}
