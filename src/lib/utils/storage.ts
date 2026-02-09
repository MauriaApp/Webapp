type StorageLogEntry = {
    ts: string;
    action: "set" | "override" | "remove" | "clear" | "launch";
    key?: string;
    size?: number;
    details?: string;
};

const STORAGE_LOGS_KEY = "__mauria_storage_logs__";
const STORAGE_LOGS_LIMIT = 200;

function readStorageLogs(): StorageLogEntry[] {
    try {
        const raw = localStorage.getItem(STORAGE_LOGS_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function writeStorageLogs(logs: StorageLogEntry[]) {
    try {
        localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify(logs));
    } catch {
        // Ignore logging failures to avoid breaking storage usage
    }
}

function appendStorageLog(entry: StorageLogEntry) {
    try {
        const logs = readStorageLogs();
        logs.push(entry);
        if (logs.length > STORAGE_LOGS_LIMIT) {
            logs.splice(0, logs.length - STORAGE_LOGS_LIMIT);
        }
        writeStorageLogs(logs);
    } catch {
        // Ignore logging failures
    }
}

export function getStorageLogs(): StorageLogEntry[] {
    return readStorageLogs();
}

export function clearStorageLogs() {
    try {
        localStorage.removeItem(STORAGE_LOGS_KEY);
    } catch {
        // Ignore logging failures
    }
}

export function logAppLaunch() {
    appendStorageLog({
        ts: new Date().toISOString(),
        action: "launch",
        details: "----- LANCEMENT DE L'APP -----",
    });
}

export function saveToStorage(key: string, value: string) {
    try {
        localStorage.setItem(key, value);
        if (key !== STORAGE_LOGS_KEY) {
            appendStorageLog({
                ts: new Date().toISOString(),
                action: "set",
                key,
                size: value.length,
            });
        }
    } catch (e) {
        // Handle storage errors (e.g., quota exceeded)
        console.error("Error saving to localStorage", e);
    }
}

export function saveFromApp(key: string, value: string) {
    try {
        localStorage.setItem(key, value);
        if (key !== STORAGE_LOGS_KEY) {
            appendStorageLog({
                ts: new Date().toISOString(),
                action: "set",
                key,
                size: value.length,
                details: "from-app",
            });
        }
    } catch (e) {
        // Handle storage errors (e.g., quota exceeded)
        console.error("Error saving to localStorage", e);
    }
}

export function getFromStorage(key: string): string | null {
    try {
        return localStorage.getItem(key);
    } catch (e) {
        // Handle storage errors
        console.error("Error reading from localStorage", e);
        return null;
    }
}

export function overrideStorage(data: Record<string, string>) {
    try {
        for (const [key, value] of Object.entries(data)) {
            localStorage.setItem(key, value);
        }
        appendStorageLog({
            ts: new Date().toISOString(),
            action: "override",
            details: `keys:${Object.keys(data).length}`,
        });
    } catch (e) {
        // Handle storage errors
        console.error("Error overriding localStorage", e);
    }
}

export function removeFromStorage(key: string) {
    try {
        localStorage.removeItem(key);
        if (key !== STORAGE_LOGS_KEY) {
            appendStorageLog({
                ts: new Date().toISOString(),
                action: "remove",
                key,
            });
        }
    } catch (e) {
        // Handle storage errors
        console.error("Error removing from localStorage", e);
    }
}

export function clearStorage() {
    try {
        localStorage.clear();
        appendStorageLog({
            ts: new Date().toISOString(),
            action: "clear",
        });
    } catch (e) {
        // Handle storage errors
        console.error("Error clearing localStorage", e);
    }
}
