import { useQuery } from "@tanstack/react-query";
import { fetchJuniaStatus, JuniaStatus } from "@/lib/api/junia-status";

const FRESH_MS = 1000 * 60 * 5; // 5 min

/**
 * Aurion / Wi-Fi status from BadJunia, shared by every consumer through the
 * same query key. Persisted queries are restored from localStorage, so a status
 * that wasn't refreshed recently is ignored: an old outage never flashes on
 * launch.
 */
export function useJuniaStatus(): JuniaStatus | null {
    const { data, dataUpdatedAt } = useQuery({
        queryKey: ["juniaStatus"],
        queryFn: fetchJuniaStatus,
        staleTime: 1000 * 60, // 1 min
        gcTime: 1000 * 60 * 5, // 5 min
        retry: false,
        refetchOnMount: true,
        refetchOnWindowFocus: true,
        refetchInterval: 1000 * 60, // 1 min
    });

    return data && Date.now() - dataUpdatedAt < FRESH_MS ? data : null;
}

const BLINK_EVENT = "mauria:aurion-blink";

/** Ask the top bar to play the "Aurion is down" blink (e.g. on pull-to-refresh). */
export function requestAurionBlink() {
    window.dispatchEvent(new Event(BLINK_EVENT));
}

export { BLINK_EVENT };
