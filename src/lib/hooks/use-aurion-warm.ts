import { useQuery } from "@tanstack/react-query";
import {
    AURION_WARM_QUERY_KEY,
    getSession,
    isAurionWarmExpired,
    warmAurionSession,
} from "@/lib/api/aurion";

export { AURION_WARM_QUERY_KEY };

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
        // Driven by the stored warm timestamp rather than the query's own
        // age: the persisted cache would otherwise restore a "success" from
        // a previous visit and let feature fetches skip the warm-up.
        staleTime: () => (isAurionWarmExpired() ? 0 : Infinity),
        gcTime: 1000 * 60 * 60 * 24,
    });

    // Blocks dependents through the first attempt and through any re-warm
    // of an expired session. Once warm has settled (success or failure),
    // feature fetches are free to run — each already knows how to log
    // itself in if the session turns out stale, so warm is an
    // optimization, never a hard dependency.
    const isRewarming = query.isFetching && isAurionWarmExpired();
    return {
        isWarming: hasSession && (query.status === "pending" || isRewarming),
    };
}
