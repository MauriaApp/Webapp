import { useEffect, useMemo, useRef, useState } from "react";
import { useIsFetching } from "@tanstack/react-query";
import { useJuniaStatus } from "@/lib/hooks/use-junia-status";
import { expectedFetchDuration, type SlowQueryKey } from "@/lib/api/junia-status";

const DEFAULT_DURATION = 2000; // fallback for unknown/fast queries

/**
 * Returns `{ progress, visible, done }`:
 * - `progress` is a 0–100 value estimating how far along the slowest
 *   in-progress fetch is, using the same fake-progress technique as the
 *   welcome bar (elapsed / expectedDuration with wobble), clamped to a
 *   5%–97% range while fetching, then ramped to 100% over ~800ms when all
 *   fetches complete.
 * - `visible` drives whether the ring is shown, and flips to false after
 *   the ramp. `progress` stays at 100 from there on, so the ring retracts
 *   (fade/scale out) as a full circle instead of unwinding back to 0.
 * - `done` flips to true the moment the circle completes — everything is
 *   fetched — for the closing check to draw inside the ring. It resets on
 *   the next fetch cycle.
 *
 * `progress` is 0 only before the first fetch cycle; each new cycle snaps
 * it back to 5%.
 */
export function useFetchProgress() {
    const fetchCount = useIsFetching();
    const isFetching = fetchCount > 0;
    const status = useJuniaStatus();

    // Check which slow queries are currently in progress.
    const documentsFetching = useIsFetching({ queryKey: ["documents"] }) > 0;
    const gradesFetching = useIsFetching({ queryKey: ["grades"] }) > 0;
    const planningFetching = useIsFetching({ queryKey: ["planning"] }) > 0;
    const absencesFetching = useIsFetching({ queryKey: ["absences"] }) > 0;
    const activeSlow: { key: SlowQueryKey; fetching: boolean }[] = [
        { key: "documents", fetching: documentsFetching },
        { key: "grades", fetching: gradesFetching },
        { key: "planning", fetching: planningFetching },
        { key: "absences", fetching: absencesFetching },
    ];

    // The expected duration is the max among all in-progress slow queries.
    // If only fast queries are running, use the default.
    const maxDuration = useMemo(() => {
        const active = activeSlow.filter((q) => q.fetching);
        if (active.length === 0) return DEFAULT_DURATION;
        return Math.max(
            ...active.map((q) => expectedFetchDuration(status, q.key))
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeSlow.map((q) => q.fetching).join(), status]);

    const [progress, setProgress] = useState(0);
    const [visible, setVisible] = useState(false);
    const [done, setDone] = useState(false);
    const startRef = useRef<number | null>(null);
    const progressRef = useRef(0);

    useEffect(() => {
        if (!isFetching) {
            // Ramp from current to 100% over ~800ms (easeOut cubic).
            const rampFrom = progressRef.current;
            startRef.current = null;
            if (rampFrom <= 0) return;

            let hideId = 0;
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
                    // The circle is complete: everything is done, time for
                    // the closing check.
                    setDone(true);
                    // Hide after a brief pause. The value stays at 100 so
                    // the ring retracts as a full circle.
                    hideId = window.setTimeout(() => {
                        setVisible(false);
                    }, 300);
                }
            }, 16);
            return () => {
                window.clearInterval(rampId);
                window.clearTimeout(hideId);
            };
        }

        // Start or continue tracking.
        if (startRef.current === null) {
            startRef.current = Date.now();
            progressRef.current = 5;
            setProgress(5);
            setVisible(true);
            setDone(false);
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

    return { progress, visible, done };
}
