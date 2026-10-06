import { useEffect } from "react";
import { useQueries } from "@tanstack/react-query";
import { fetchAbsences, fetchGrades, fetchPlanning } from "@/lib/api/aurion";
import { fetchImportantMessage } from "@/lib/api/supa";
import { fetchDailyMenu } from "@/lib/api/lacatho";
import { useAurionWarm } from "@/lib/hooks/use-aurion-warm";
import {
    expectedFetchDuration,
    expectedWarmDuration,
    type JuniaStatus,
} from "@/lib/api/junia-status";
import { Absence, Grade, Lesson } from "@/types/aurion";

export type PrefetchKey =
    | "planning"
    | "grades"
    | "absences"
    | "importantMessages"
    | "dailyMenu";

export const PREFETCH_KEYS: PrefetchKey[] = [
    "planning",
    "grades",
    "absences",
    "importantMessages",
    "dailyMenu",
];

const PREFETCH_OPTS = {
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
    retry: 1,
} as const;

// Fast, non-Aurion queries have no BadJunia timing to lean on.
const FAST_QUERY_DURATION_MS = 2000;

async function timedFetch<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    console.log(`[prefetch] ${label} — start`);
    try {
        return await fn();
    } finally {
        console.log(
            `[prefetch] ${label} — done in ${Math.round(
                performance.now() - start
            )}ms`
        );
    }
}

/**
 * Fetch start times, recorded so the preparation page can show a
 * per-query fake progress (elapsed vs expected duration). Module-level:
 * the queries outlive the welcome page they started on. "warm" tracks
 * the Aurion warm-up the prefetches queue behind.
 */
const starts = new Map<string, number>();

function markPrefetchStart(key: string) {
    if (!starts.has(key)) {
        starts.set(key, Date.now());
    }
}

/** Reset after the prefetch cycle is over (entering the app). */
export function clearPrefetchStarts() {
    starts.clear();
}

function expectedPrefetchDuration(
    status: JuniaStatus | null,
    key: string
): number {
    if (key === "warm") {
        return expectedWarmDuration(status);
    }
    if (key === "planning" || key === "grades" || key === "absences") {
        return expectedFetchDuration(status, key);
    }
    return FAST_QUERY_DURATION_MS;
}

/** 0-100 fake progress for a prefetch query (100 when settled). */
export function prefetchProgress(
    status: JuniaStatus | null,
    key: string,
    settled: boolean
): number {
    if (settled) return 100;
    const start = starts.get(key);
    if (!start) return 0;
    const expected = expectedPrefetchDuration(status, key);
    const ratio = (Date.now() - start) / expected;
    return Math.round(Math.min(0.97, ratio) * 100);
}

/**
 * The first-launch background prefetch: planning, grades, absences, the
 * important messages and the canteen menu, started while the welcome
 * screen is shown. The preparation page shares the same keys and options,
 * so it observes the same cache entries and can wait for them all.
 */
export function useWelcomePrefetch() {
    const {
        isWarming,
        status: warmStatus,
        fetchStatus: warmFetchStatus,
    } = useAurionWarm();

    const results = useQueries({
        queries: [
            {
                // The fetch itself logs [fetch] start/done (elapsed vs
                // BadJunia's expected duration) from the API layer.
                queryKey: ["planning"],
                queryFn: async (): Promise<Lesson[]> => {
                    const res = await fetchPlanning();
                    if (!res?.success)
                        throw new Error("Failed to fetch planning");
                    return res.data ?? [];
                },
                enabled: !isWarming,
                ...PREFETCH_OPTS,
            },
            {
                queryKey: ["grades"],
                queryFn: async (): Promise<Grade[]> => {
                    const res = await fetchGrades();
                    if (!res?.success)
                        throw new Error("Failed to fetch grades");
                    return res.data ?? [];
                },
                enabled: !isWarming,
                ...PREFETCH_OPTS,
            },
            {
                queryKey: ["absences"],
                queryFn: async (): Promise<Absence[]> => {
                    const res = await fetchAbsences();
                    if (!res?.success)
                        throw new Error("Failed to fetch absences");
                    return res.data ?? [];
                },
                enabled: !isWarming,
                ...PREFETCH_OPTS,
            },
            {
                queryKey: ["importantMessages"],
                queryFn: () =>
                    timedFetch("importantMessage", fetchImportantMessage),
                ...PREFETCH_OPTS,
            },
            {
                queryKey: ["dailyMenu"],
                queryFn: () => timedFetch("dailyMenu", fetchDailyMenu),
                ...PREFETCH_OPTS,
                staleTime: 1000 * 60 * 30,
            },
        ],
    });

    // Record each query's start (warm-up included) for the preparation
    // page's progress.
    useEffect(() => {
        if (warmFetchStatus === "fetching") {
            markPrefetchStart("warm");
        }
        results.forEach((result, index) => {
            if (result.fetchStatus === "fetching") {
                markPrefetchStart(PREFETCH_KEYS[index]);
            }
        });
    });

    // The welcome screen no longer blocks on the fetch; the busy state
    // only serves the preparation page's auto-navigation.
    const isBusy = isWarming || results[0].isLoading;

    return { results, isBusy, warm: { status: warmStatus } };
}
