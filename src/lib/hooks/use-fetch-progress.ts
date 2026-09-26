import { useSyncExternalStore } from "react";
import type { QueryKey } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import {
    expectedFetchDuration,
    type JuniaStatus,
    type SlowQueryKey,
} from "@/lib/api/junia-status";

const DEFAULT_DURATION = 2000; // fallback for unknown/fast queries

const SLOW_QUERY_KEYS: SlowQueryKey[] = [
    "documents",
    "grades",
    "planning",
    "absences",
];

// Work in a 0–1 ratio internally, displayed in a 5%..95% range.
const MIN = 0.05;
const MAX = 0.95;
const TICK_MS = 140;
// Share of the gap to the lead fetch covered on each tick, so the ring
// glides (forward or backward) when the lead changes instead of jumping.
const FOLLOW = 0.3;

/** A fetch in progress as shown in the fetch drawer. */
export type FetchEntry = {
    id: string;
    /** First segment of the query key, e.g. "grades". */
    name: string;
    /** 0–100, same scale as the ring. */
    progress: number;
};

type FetchProgress = {
    progress: number;
    visible: boolean;
    done: boolean;
    fetches: FetchEntry[];
};

/** A fetch in progress, with its own fake progress (0–MAX). */
type InFlightFetch = {
    name: string;
    start: number;
    expected: number;
    progress: number;
};

/**
 * The ring's state lives at module level, not in a component: the routes
 * are keyed by pathname, so the layout remounts on every page change and
 * would restart the ring. Every fetch is tracked on its own from the query
 * cache (start time, expected duration frozen at start), whichever page
 * started it.
 */
const inFlight = new Map<string, InFlightFetch>();
const listeners = new Set<() => void>();
let snapshot: FetchProgress = {
    progress: 0,
    visible: false,
    done: false,
    fetches: [],
};
let displayed = 0; // internal 0–MAX ratio behind `snapshot.progress`
let cycleActive = false;
let subscribed = false;
let tickId = 0;
let rampId = 0;
let hideId = 0;

function emit(next: Partial<FetchProgress>) {
    snapshot = { ...snapshot, ...next };
    listeners.forEach((listener) => listener());
}

function toPercent(ratio: number): number {
    return Math.round(MIN * 100 + ratio * (MAX - MIN) * 100);
}

/** In-flight fetches, oldest first (the map keeps insertion order). */
function listFetches(): FetchEntry[] {
    return [...inFlight].map(([id, fetch]) => ({
        id,
        name: fetch.name,
        progress: toPercent(fetch.progress),
    }));
}

function expectedDuration(queryKey: QueryKey): number {
    const key = queryKey[0];
    if (!SLOW_QUERY_KEYS.includes(key as SlowQueryKey)) {
        return DEFAULT_DURATION;
    }
    const status =
        queryClient.getQueryData<JuniaStatus | null>(["juniaStatus"]) ?? null;
    return expectedFetchDuration(status, key as SlowQueryKey);
}

/** Keep `inFlight` in sync with the fetching queries of the cache. */
function sync() {
    const now = Date.now();
    const fetching = new Set<string>();
    let changed = false;
    for (const query of queryClient.getQueryCache().getAll()) {
        if (query.state.fetchStatus !== "fetching") continue;
        fetching.add(query.queryHash);
        if (!inFlight.has(query.queryHash)) {
            inFlight.set(query.queryHash, {
                name: String(query.queryKey[0]),
                start: now,
                expected: expectedDuration(query.queryKey),
                progress: 0,
            });
            changed = true;
        }
    }
    for (const hash of inFlight.keys()) {
        if (!fetching.has(hash)) {
            inFlight.delete(hash);
            changed = true;
        }
    }
    // The cache notifies on every query update: only re-render on changes.
    if (changed) emit({ fetches: listFetches() });

    if (inFlight.size > 0 && !cycleActive) startCycle();
    else if (inFlight.size === 0 && cycleActive) finishCycle();
}

function startCycle() {
    window.clearInterval(rampId);
    window.clearTimeout(hideId);
    cycleActive = true;
    displayed = 0;
    emit({ progress: MIN * 100, visible: true, done: false });
    tickId = window.setInterval(tick, TICK_MS);
}

function tick() {
    const now = Date.now();
    let lead: InFlightFetch | null = null;
    for (const fetch of inFlight.values()) {
        // Asymptotic curve: approaches 1 but never reaches it while
        // fetching, so the ring slows down near the top.
        const ratio = (now - fetch.start) / fetch.expected;
        const base = MAX * (1 - Math.pow(1 - Math.min(1, ratio), 0.93));
        const burst = Math.random() < 0.22 ? Math.random() * 0.08 : 0;
        const wobble = (Math.random() - 0.5) * 0.03;
        const target = Math.min(MAX, base + wobble + burst);
        // Monotonic per fetch: never goes backwards.
        fetch.progress = Math.min(
            MAX,
            Math.max(fetch.progress + 0.004, target)
        );
        // The ring follows the fetch with the longest time left.
        if (
            !lead ||
            fetch.start + fetch.expected > lead.start + lead.expected
        ) {
            lead = fetch;
        }
    }
    if (!lead) return;

    // A longer fetch joining makes the ring glide back to its progress.
    displayed += (lead.progress - displayed) * FOLLOW;
    emit({ progress: toPercent(displayed), fetches: listFetches() });
}

function finishCycle() {
    window.clearInterval(tickId);
    cycleActive = false;

    // Ramp from current to 100% over ~800ms (easeOut cubic).
    const rampFrom = snapshot.progress;
    if (rampFrom <= 0) return;
    const rampStart = Date.now();
    rampId = window.setInterval(() => {
        const t = Math.min(1, (Date.now() - rampStart) / 800);
        const eased = 1 - Math.pow(1 - t, 3);
        emit({ progress: Math.round(rampFrom + (100 - rampFrom) * eased) });
        if (t >= 1) {
            window.clearInterval(rampId);
            // The circle is complete: everything is done, time for the
            // closing check. Hide after a brief pause; the value stays at
            // 100 so the ring retracts as a full circle.
            emit({ done: true });
            hideId = window.setTimeout(() => emit({ visible: false }), 300);
        }
    }, 16);
}

function subscribe(listener: () => void) {
    // The cache subscription lives as long as the app: fetches keep being
    // tracked while no ring is mounted (e.g. between two pages).
    if (!subscribed) {
        subscribed = true;
        queryClient.getQueryCache().subscribe(sync);
        sync();
    }
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

/**
 * Returns `{ progress, visible, done, fetches }`:
 * - `progress` is a 0–100 value estimating how far along the in-progress
 *   fetch with the longest time left is, using the same fake-progress
 *   technique as the welcome bar (elapsed / expectedDuration with wobble),
 *   clamped to a 5%–95% range while fetching, then ramped to 100% over
 *   ~800ms when all fetches complete. When a longer fetch starts, the ring
 *   glides back to that fetch's progress. Page changes don't affect it.
 * - `visible` drives whether the ring is shown, and flips to false after
 *   the ramp. `progress` stays at 100 from there on, so the ring retracts
 *   (fade/scale out) as a full circle instead of unwinding back to 0.
 * - `done` flips to true the moment the circle completes — everything is
 *   fetched — for the closing check to draw inside the ring. It resets on
 *   the next fetch cycle.
 * - `fetches` lists every in-flight fetch with its own progress, for the
 *   fetch drawer.
 *
 * `progress` is 0 only before the first fetch cycle; each new cycle snaps
 * it back to 5%.
 */
export function useFetchProgress(): FetchProgress {
    return useSyncExternalStore(subscribe, () => snapshot);
}
