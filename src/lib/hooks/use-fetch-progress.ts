import { useEffect, useMemo, useRef, useState } from "react";
import { useIsFetching } from "@tanstack/react-query";

// Expected durations (ms) for the slow Aurion-scraping queries, measured
// from the backend timings.  Fast queries (colles, menu, rooms) are under
// 1s and don't need a progress ring.
const SLOW_QUERIES: { key: string[]; duration: number }[] = [
    { key: ["documents"], duration: 24000 },
    { key: ["grades"], duration: 17000 },
    { key: ["planning"], duration: 10000 },
    { key: ["absences"], duration: 8000 },
];

const DEFAULT_DURATION = 2000; // fallback for unknown/fast queries

/**
 * Returns a 0–100 progress value that estimates how far along the
 * slowest in-progress fetch is.  Uses the same fake-progress technique
 * as the welcome bar (elapsed / expectedDuration with wobble), clamped
 * to a 5%–97% range while fetching, then ramps to 100% over ~800ms when
 * all fetches complete.
 *
 * Returns 0 when nothing is fetching and the ramp has finished.
 */
export function useFetchProgress() {
    const fetchCount = useIsFetching();
    const isFetching = fetchCount > 0;

    // Check which slow queries are currently in progress.
    const activeSlow = SLOW_QUERIES.map((q) => ({
        ...q,
        fetching: useIsFetching({ queryKey: q.key }) > 0,
    }));

    // The expected duration is the max among all in-progress slow queries.
    // If only fast queries are running, use the default.
    const maxDuration = useMemo(() => {
        const active = activeSlow.filter((q) => q.fetching);
        if (active.length === 0) return DEFAULT_DURATION;
        return Math.max(...active.map((q) => q.duration));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeSlow.map((q) => q.fetching).join()]);

    const [progress, setProgress] = useState(0);
    const startRef = useRef<number | null>(null);
    const progressRef = useRef(0);

    useEffect(() => {
        if (!isFetching) {
            // Ramp from current to 100% over ~800ms (easeOut cubic).
            const rampFrom = progressRef.current;
            startRef.current = null;
            if (rampFrom <= 0) return;

            const rampStart = Date.now();
            const rampId = window.setInterval(() => {
                const elapsed = Date.now() - rampStart;
                const t = Math.min(1, elapsed / 800);
                const eased = 1 - Math.pow(1 - t, 3);
                const value = Math.round(rampFrom + (100 - rampFrom) * eased);
                progressRef.current = value;
                setProgress(value);
                if (t >= 1) {
                    window.clearInterval(rampId);
                    // Hide after a brief pause.
                    window.setTimeout(() => {
                        progressRef.current = 0;
                        setProgress(0);
                    }, 300);
                }
            }, 16);
            return () => window.clearInterval(rampId);
        }

        // Start or continue tracking.
        if (startRef.current === null) {
            startRef.current = Date.now();
            progressRef.current = 5;
            setProgress(5);
        }

        // Work in a 0–1 ratio internally (5%..95% range).
        const MIN = 0.05;
        const MAX = 0.95;
        let current = (progressRef.current / 100 - MIN) / (MAX - MIN);
        current = Math.max(0, Math.min(1, current));

        const interval = window.setInterval(() => {
            if (startRef.current === null) return;
            const elapsed = Date.now() - startRef.current;
            // Asymptotic curve: approaches 1 but never reaches it while
            // fetching, so the ring slows down near the top and never
            // pins at the cap.  0.93 exponent gives ~85% at half the
            // expected duration, ~93% at the full duration.
            const ratio = elapsed / maxDuration;
            const base = MAX * (1 - Math.pow(1 - Math.min(1, ratio), 0.93));
            const burst = Math.random() < 0.22 ? Math.random() * 0.08 : 0;
            const wobble = (Math.random() - 0.5) * 0.03;
            const target = Math.min(MAX, base + wobble + burst);
            // Monotonic: never go backwards (except during the reset ramp).
            const next = Math.min(MAX, Math.max(current + 0.004, target));
            current = next;
            const value = Math.round(MIN * 100 + next * (MAX - MIN) * 100);
            progressRef.current = value;
            setProgress(value);
        }, 140);

        return () => window.clearInterval(interval);
    }, [isFetching, maxDuration]);

    return progress;
}
