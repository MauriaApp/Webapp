import { apiRequest } from "./helper";
import { getFromStorage, saveToStorage } from "@/lib/utils/storage";

export interface AurionTimes {
    login: number | null;
    home: number | null;
    grades: number | null;
    planning: number | null;
    absences: number | null;
    documents: number | null;
}

export interface JuniaStatus {
    aurionDown: boolean;
    aurionSince: string | null;
    wifiDown: boolean;
    wifiSince: string | null;
    aurionTimes: AurionTimes;
}

// Slow Aurion-scraping queries that have an expected duration. Fast queries
// (colles, menu, rooms) are under 1s and don't need one.
export type SlowQueryKey = "documents" | "grades" | "planning" | "absences";

// Fallback expected durations (ms) when BadJunia's timings are not available
// (status not loaded yet, upstream down, persisted cache from before the
// aurionTimes field existed).
const FALLBACK_DURATION: Record<SlowQueryKey, number> = {
    documents: 15000,
    grades: 17000,
    planning: 10000,
    absences: 8000,
};

// The documents flow walks every leaf of the "Mes Documents" submenu, far
// beyond the single page BadJunia measures, so it keeps a fixed expectation.
const DOCUMENTS_EXPECTED_MS = 15000;

// Same, warm: only the feature page remains.
const FALLBACK_STEP: Record<Exclude<SlowQueryKey, "documents">, number> = {
    grades: 1700,
    planning: 3600,
    absences: 1200,
};

/**
 * Mirror of the API's session cache: for ~10 minutes after the last Aurion
 * activity (sliding), a fetch skips login and the home page and only pays
 * the feature page. Persisted, because the API's session survives a reload
 * of the Webapp too.
 */
const WARM_SESSION_MS = 10 * 60 * 1000;
const WARM_STATE_KEY = "aurionWarmSession";

type WarmState = {
    /** When the home-page tokens became (or become) usable. */
    warmFrom: number;
    /** Timestamp of the last completed Aurion fetch or login. */
    lastActivityAt: number;
};

function readWarmState(): WarmState | null {
    try {
        const stored = getFromStorage(WARM_STATE_KEY);
        return stored ? (JSON.parse(stored) as WarmState) : null;
    } catch {
        return null;
    }
}

let warmState: WarmState | null = readWarmState();

/**
 * Record Aurion session activity. `homeReadyInMs` is the delay after which
 * the session's home-page tokens are usable: 0 after a fetch (they are
 * already cached), ~the home-page duration after a login (the API warms
 * them in the background).
 */
export function markAurionSession(homeReadyInMs = 0): void {
    const now = Date.now();
    warmState = {
        warmFrom: now + homeReadyInMs,
        lastActivityAt: now,
    };
    saveToStorage(WARM_STATE_KEY, JSON.stringify(warmState));
}

/** Whether the API-side Aurion session is warm (cached cookies and tokens). */
export function isAurionSessionWarm(): boolean {
    if (!warmState) return false;
    const now = Date.now();
    return (
        now >= warmState.warmFrom &&
        now - warmState.lastActivityAt < WARM_SESSION_MS
    );
}

/**
 * Expected duration (ms) of a slow query. BadJunia measures each Aurion page
 * separately (login, home, then the feature page):
 * - cold session: a fetch through the API pays all three, so the expectation
 *   is their sum;
 * - warm session (the API's cache still holds it): only the feature page
 *   remains.
 * Indicators and logs thus adapt to how fast Aurion actually is. Falls back
 * to the measured constants when the timings are unknown.
 */
export function expectedFetchDuration(
    status: JuniaStatus | null,
    key: SlowQueryKey
): number {
    if (key === "documents") {
        return DOCUMENTS_EXPECTED_MS;
    }
    const times = status?.aurionTimes;
    const step = times?.[key] ?? null;
    if (isAurionSessionWarm()) {
        return step ?? FALLBACK_STEP[key];
    }
    if (!times || times.login === null || times.home === null || step === null) {
        return FALLBACK_DURATION[key];
    }
    return times.login + times.home + step;
}

export async function fetchJuniaStatus(): Promise<JuniaStatus | null> {
    return apiRequest<JuniaStatus>("/badjunia/status", "GET");
}
