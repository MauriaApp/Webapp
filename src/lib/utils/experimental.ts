import { useEffect, useState } from "react";

import { getFromStorage, removeFromStorage, saveToStorage } from "./storage";

/**
 * How a freshly published grade is revealed. "off" disables the whole
 * unopened-grade tracking, the other modes each render their own overlay.
 */
export const GRADE_REVEAL_MODES = ["off", "cs2", "fdj", "pokemon", "slots"] as const;

export type GradeRevealMode = (typeof GRADE_REVEAL_MODES)[number];

export const GRADE_REVEAL_MODE_STORAGE_KEY = "mauria-grade-reveal-mode";

/** Boolean toggle this setting replaced, read once to migrate old users. */
const CS2_GRADES_GAMBLING_STORAGE_KEY = "mauria-cs2-grades-gambling";

const GRADE_REVEAL_MODE_EVENT = "mauria-grade-reveal-mode-change";

const isGradeRevealMode = (value: unknown): value is GradeRevealMode =>
    GRADE_REVEAL_MODES.includes(value as GradeRevealMode);

export const readGradeRevealMode = (): GradeRevealMode => {
    if (typeof window === "undefined") {
        return "off";
    }

    const stored = getFromStorage(GRADE_REVEAL_MODE_STORAGE_KEY);
    if (isGradeRevealMode(stored)) {
        return stored;
    }

    // Whoever had the old CS2 switch on keeps the case opening
    return getFromStorage(CS2_GRADES_GAMBLING_STORAGE_KEY) === "true"
        ? "cs2"
        : "off";
};

export const setGradeRevealMode = (mode: GradeRevealMode) => {
    if (typeof window === "undefined") {
        return;
    }

    saveToStorage(GRADE_REVEAL_MODE_STORAGE_KEY, mode);
    removeFromStorage(CS2_GRADES_GAMBLING_STORAGE_KEY);
    window.dispatchEvent(new Event(GRADE_REVEAL_MODE_EVENT));
};

export const useGradeRevealMode = (): GradeRevealMode => {
    const [mode, setMode] = useState<GradeRevealMode>(readGradeRevealMode);

    useEffect(() => {
        const handler = () => setMode(readGradeRevealMode());

        window.addEventListener(GRADE_REVEAL_MODE_EVENT, handler);
        window.addEventListener("storage", handler);

        return () => {
            window.removeEventListener(GRADE_REVEAL_MODE_EVENT, handler);
            window.removeEventListener("storage", handler);
        };
    }, []);

    return mode;
};

/**
 * Palantir's "singularity" skin: a black-hole console for the search and the
 * calendar. Purely cosmetic, scoped to the Palantir page — the real planning
 * keeps the user's theme. Off unless explicitly turned on.
 */
export const PALANTIR_THEME_STORAGE_KEY = "mauria-palantir-void";

const PALANTIR_THEME_EVENT = "mauria-palantir-theme-change";

export const readPalantirTheme = (): boolean => {
    if (typeof window === "undefined") {
        return false;
    }
    return getFromStorage(PALANTIR_THEME_STORAGE_KEY) === "true";
};

export const setPalantirTheme = (enabled: boolean) => {
    if (typeof window === "undefined") {
        return;
    }
    saveToStorage(PALANTIR_THEME_STORAGE_KEY, String(enabled));
    window.dispatchEvent(new Event(PALANTIR_THEME_EVENT));
};

export const usePalantirTheme = (): boolean => {
    const [enabled, setEnabled] = useState<boolean>(readPalantirTheme);

    useEffect(() => {
        const handler = () => setEnabled(readPalantirTheme());

        window.addEventListener(PALANTIR_THEME_EVENT, handler);
        window.addEventListener("storage", handler);

        return () => {
            window.removeEventListener(PALANTIR_THEME_EVENT, handler);
            window.removeEventListener("storage", handler);
        };
    }, []);

    return enabled;
};
