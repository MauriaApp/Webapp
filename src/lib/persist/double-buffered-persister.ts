import type {
    PersistedClient,
    Persister,
} from "@tanstack/query-persist-client-core";
import {
    getFromStorage,
    removeFromStorage,
    saveToStorage,
} from "@/lib/utils/storage";

const BUFFER_KEY = "mauria-rq-cache-buffer";
const MAIN_KEY = "mauria-rq-cache";

const THROTTLE_MS = 1000;

function parse(raw: string | null): PersistedClient | undefined {
    if (!raw) return undefined;
    try {
        return JSON.parse(raw) as PersistedClient;
    } catch {
        return undefined;
    }
}

/**
 * Writes the offline query cache to two independent localStorage keys,
 * buffer then main, instead of the single blob the default async storage
 * persister uses. If the app is killed mid-write only one of the two keys
 * can end up with a truncated/corrupted value — restore prefers `main` and
 * falls back to `buffer`, so one interrupted write no longer wipes the
 * entire offline cache (grades/absences/planning/documents all live in
 * this one blob).
 */
export function createDoubleBufferedPersister(): Persister {
    let pending: PersistedClient | null = null;
    let flushScheduled = false;

    const flush = () => {
        flushScheduled = false;
        if (!pending) return;
        const serialized = JSON.stringify(pending);
        pending = null;
        saveToStorage(BUFFER_KEY, serialized);
        saveToStorage(MAIN_KEY, serialized);
    };

    return {
        persistClient: (persistedClient) => {
            pending = persistedClient;
            if (!flushScheduled) {
                flushScheduled = true;
                setTimeout(flush, THROTTLE_MS);
            }
        },
        restoreClient: () =>
            parse(getFromStorage(MAIN_KEY)) ??
            parse(getFromStorage(BUFFER_KEY)),
        removeClient: () => {
            removeFromStorage(MAIN_KEY);
            removeFromStorage(BUFFER_KEY);
        },
    };
}
