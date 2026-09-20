import { useEffect, useState } from "react";

import { getFromStorage, removeFromStorage, saveToStorage } from "./storage";

/**
 * How a freshly published grade is revealed. "off" disables the whole
 * unopened-grade tracking, the other modes each render their own overlay.
 */
export const GRADE_REVEAL_MODES = ["off", "cs2", "fdj", "pokemon"] as const;

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
