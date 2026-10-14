import { useEffect, useState } from "react";

import { format } from "date-fns";

import { Lesson } from "@/types/aurion";
import { parseFromTitle, toDate } from "./home";
import { getFromStorage, saveToStorage } from "./storage";

export const EXTRA_TIME_STORAGE_KEY = "mauria-extra-time";

const EXTRA_TIME_EVENT = "mauria-extra-time-change";

// Off by default: only students granted "tiers temps" turn it on.
export const readExtraTimeEnabled = (): boolean => {
    if (typeof window === "undefined") {
        return false;
    }

    return getFromStorage(EXTRA_TIME_STORAGE_KEY) === "true";
};

export const setExtraTimeEnabled = (enabled: boolean) => {
    if (typeof window === "undefined") {
        return;
    }

    saveToStorage(EXTRA_TIME_STORAGE_KEY, String(enabled));
    window.dispatchEvent(new Event(EXTRA_TIME_EVENT));
};

export const useExtraTimeEnabled = (): boolean => {
    const [enabled, setEnabled] = useState<boolean>(readExtraTimeEnabled);

    useEffect(() => {
        const handler = () => setEnabled(readExtraTimeEnabled());

        window.addEventListener(EXTRA_TIME_EVENT, handler);
        window.addEventListener("storage", handler);

        return () => {
            window.removeEventListener(EXTRA_TIME_EVENT, handler);
            window.removeEventListener("storage", handler);
        };
    }, []);

    return enabled;
};

// The type codes of a majorable exam. "DS" covers DS/DS_SURV, but Aurion
// labels some exams EXAM/EXAM_SURV — same beast, same treatment.
const isExam = (lesson: Lesson) =>
    /^(DS|EXAM)/i.test(parseFromTitle(lesson).type) ||
    /^(DS|EXAM)/i.test(lesson.className);

// Aurion embeds the exact tiers-temps schedule in the note field of an exam
// the school already granted it to ("Horaire TT: 7h30-10h10", "TT :
// 7H30-10H10" — the word and the spacing vary). The event's own times stay
// nominal (8:00-10:00) while the TT student actually sits it 7:30-10:10 —
// shifted earlier rather than simply running longer. Minutes are optional
// in case Aurion spells a round hour ("7h30-10h").
const TT_SCHEDULE =
    /(?:horaire\s+)?\btt\b\s*:\s*(\d{1,2})\s*h\s*(\d{2})?\s*-\s*(\d{1,2})\s*h\s*(\d{2})?/i;

const atTime = (day: Date, hours: string, minutes?: string) => {
    const d = new Date(day);
    d.setHours(Number(hours), minutes ? Number(minutes) : 0, 0, 0);
    return d;
};

// Same shape as Aurion's timestamps (ds.ts builds its own lessons with it).
const DATETIME_FORMAT = "yyyy-MM-dd'T'HH:mm:ss";

/**
 * With "tiers temps" on, every exam of the planning is stretched by a third
 * of its duration (4 h → 5 h 30). Everything else, and the toggle off, is
 * left untouched — the home cards, the widget and the calendar export always
 * use the raw planning. When Aurion's title carries its own TT schedule
 * ("Horaire TT: …"), that exact, possibly shifted, schedule wins over the
 * arithmetic. A stretched exam keeps its nominal bounds in `origStart` /
 * `origEnd` (FullCalendar files them under extendedProps) so the calendar
 * can hatch the added zones.
 */
export function applyExtraTime(
    lessons: Lesson[],
    enabled: boolean
): (Lesson & { origStart?: string; origEnd?: string })[] {
    if (!enabled) return lessons;

    return lessons.map((lesson) => {
        if (!isExam(lesson)) return lesson;

        const start = toDate(lesson.start);
        const end = toDate(lesson.end);

        const tt = TT_SCHEDULE.exec(lesson.title);
        let stretchedStart = start;
        let stretchedEnd: Date;
        if (tt) {
            // Both ends on the nominal start's day: an exam never crosses
            // midnight.
            stretchedStart = atTime(start, tt[1], tt[2]);
            stretchedEnd = atTime(start, tt[3], tt[4]);
            if (stretchedEnd <= stretchedStart) {
                // A mangled schedule would shrink the exam: ignore it.
                stretchedStart = start;
                stretchedEnd = end;
            }
        } else {
            stretchedEnd = new Date(
                end.getTime() + (end.getTime() - start.getTime()) / 3
            );
        }

        return {
            ...lesson,
            start: format(stretchedStart, DATETIME_FORMAT),
            end: format(stretchedEnd, DATETIME_FORMAT),
            origStart: format(start, DATETIME_FORMAT),
            origEnd: lesson.end,
        };
    });
}

// The added-time label drawn on the hatched zone ("+30m", "+1h30"). Zones
// shorter than this get none — the text wouldn't fit.
export const EXTRA_TIME_LABEL_MIN_MINUTES = 30;

export const formatExtraTimeLabel = (addedMs: number): string | null => {
    const minutes = Math.round(addedMs / 60_000);
    if (minutes < EXTRA_TIME_LABEL_MIN_MINUTES) return null;

    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (hours === 0) return `+${rest}m`;
    return rest === 0 ? `+${hours}h` : `+${hours}h${rest}`;
};
