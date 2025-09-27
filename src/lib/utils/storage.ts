export function saveToStorage(key: string, value: string) {
    try {
        localStorage.setItem(key, value);
        window.parent.postMessage(
            { type: "SAVE_DATA", key, payload: value },
            "*"
        );
    } catch (e) {
        // Handle storage errors (e.g., quota exceeded)
        console.error("Error saving to localStorage", e);
    }
}

export function saveFromApp(key: string, value: string) {
    try {
        localStorage.setItem(key, value);
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

export function getAllFromApp() {
    window.parent.postMessage({ type: "REQUEST_ALL_DATA" }, "*");
}

export function overrideStorage(data: Record<string, string>) {
    try {
        for (const [key, value] of Object.entries(data)) {
            localStorage.setItem(key, value);
        }
    } catch (e) {
        // Handle storage errors
        console.error("Error overriding localStorage", e);
    }
}

export function removeFromStorage(key: string) {
    try {
        localStorage.removeItem(key);
    } catch (e) {
        // Handle storage errors
        console.error("Error removing from localStorage", e);
    }
}

export function clearStorage() {
    try {
        localStorage.clear();
    } catch (e) {
        // Handle storage errors
        console.error("Error clearing localStorage", e);
    }
}
