import { useEffect, useState } from "react";

import type { Grade } from "@/types/aurion";
import { readCs2GradesGambling } from "./experimental";
import { getFromStorage, saveToStorage } from "./storage";

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

    const keys = grades.filter((grade) => grade.grade?.trim()).map(getGradeKey);
    const known = readList(KNOWN_GRADES_STORAGE_KEY);

    if (known) {
        const knownSet = new Set(known);
        const fresh = keys.filter((key) => !knownSet.has(key));

        if (fresh.length === 0) return;

        if (readCs2GradesGambling()) {
            const unopened = readUnopenedGrades();
            saveUnopenedGrades([
                ...unopened,
                ...fresh.filter((key) => !unopened.includes(key)),
            ]);
        }
    }

    saveToStorage(
        KNOWN_GRADES_STORAGE_KEY,
        JSON.stringify(Array.from(new Set([...(known ?? []), ...keys])))
    );
};

export const openGrade = (grade: Grade) => {
    if (typeof window === "undefined") return;

    const key = getGradeKey(grade);
    saveUnopenedGrades(readUnopenedGrades().filter((k) => k !== key));
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

    return new Set(unopened);
};
