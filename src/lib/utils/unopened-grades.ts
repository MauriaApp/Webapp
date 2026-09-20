import { useEffect, useMemo, useState } from "react";

import type { Grade } from "@/types/aurion";
import { readGradeRevealMode } from "./experimental";
import { getFromStorage, removeFromStorage, saveToStorage } from "./storage";

export const KNOWN_GRADES_STORAGE_KEY = "mauria-known-grades";
export const UNOPENED_GRADES_STORAGE_KEY = "mauria-unopened-grades";

const UNOPENED_GRADES_EVENT = "mauria-unopened-grades-change";

// Aurion gives no grade id: date + code + name is what identifies a grade
export const getGradeKey = (grade: Grade): string =>
    [grade.date, grade.code, grade.name].join("|");

const readList = (key: string): string[] | null => {
    const raw = getFromStorage(key);
    if (!raw) return null;

    try {
        const parsed: unknown = JSON.parse(raw);
        return Array.isArray(parsed)
            ? parsed.filter((v): v is string => typeof v === "string")
            : null;
    } catch {
        return null;
    }
};

export const readUnopenedGrades = (): string[] =>
    readList(UNOPENED_GRADES_STORAGE_KEY) ?? [];

const saveUnopenedGrades = (keys: string[]) => {
    saveToStorage(UNOPENED_GRADES_STORAGE_KEY, JSON.stringify(keys));
    window.dispatchEvent(new Event(UNOPENED_GRADES_EVENT));
};

/**
 * Flags the grades that were never fetched before as "unopened". Called on
 * every successful grades fetch. The very first run only records what is
 * already there, so existing grades are never flagged.
 */
export const trackNewGrades = (grades: Grade[]) => {
    if (typeof window === "undefined") return;
    // Opted out: never read, write or grow anything in storage
    if (readGradeRevealMode() === "off") return;
    if (!Array.isArray(grades)) return;

    const keys = grades.filter((grade) => grade.grade?.trim()).map(getGradeKey);
    const known = readList(KNOWN_GRADES_STORAGE_KEY);

    if (known) {
        const knownSet = new Set(known);
        const fresh = keys.filter((key) => !knownSet.has(key));

        if (fresh.length === 0) return;

        const unopened = readUnopenedGrades();
        saveUnopenedGrades([
            ...unopened,
            ...fresh.filter((key) => !unopened.includes(key)),
        ]);
    }

    saveToStorage(
        KNOWN_GRADES_STORAGE_KEY,
        JSON.stringify(Array.from(new Set([...(known ?? []), ...keys])))
    );
};

/**
 * Wipes every trace of the feature. Called when the reveal setting leaves or
 * enters "off", so disabling it leaves nothing behind and enabling it starts
 * from a clean slate instead of flagging grades seen while it was off.
 * Switching between two reveal effects keeps the pending grades untouched.
 */
export const resetGradeTracking = () => {
    if (typeof window === "undefined") return;

    removeFromStorage(KNOWN_GRADES_STORAGE_KEY);
    removeFromStorage(UNOPENED_GRADES_STORAGE_KEY);
    window.dispatchEvent(new Event(UNOPENED_GRADES_EVENT));
};

export const openGrade = (grade: Grade) => openGrades([grade]);

/** Marks a whole booster worth of grades as opened in one write. */
export const openGrades = (grades: Grade[]) => {
    if (typeof window === "undefined") return;
    if (grades.length === 0) return;

    const keys = new Set(grades.map(getGradeKey));
    saveUnopenedGrades(readUnopenedGrades().filter((key) => !keys.has(key)));
};

export const useUnopenedGrades = (): Set<string> => {
    const [unopened, setUnopened] = useState<string[]>(readUnopenedGrades);

    useEffect(() => {
        const handler = () => setUnopened(readUnopenedGrades());

        window.addEventListener(UNOPENED_GRADES_EVENT, handler);
        window.addEventListener("storage", handler);

        return () => {
            window.removeEventListener(UNOPENED_GRADES_EVENT, handler);
            window.removeEventListener("storage", handler);
        };
    }, []);

    // Memoised: a fresh Set on every render would invalidate the callers'
    // useMemo deps each time, even for users who never enabled the feature
    return useMemo(() => new Set(unopened), [unopened]);
};
