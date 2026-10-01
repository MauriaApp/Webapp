import { format } from "date-fns";
import { useTranslation } from "react-i18next";

// Time helpers for the personal event and task forms (components/
// date-time-fields.tsx). Times travel as "HH:mm".

export const toTime = (date: Date) => format(date, "HH:mm");

export const atTime = (day: Date, time: string) => {
    const [hours = 0, minutes = 0] = time.split(":").map(Number);
    return new Date(
        day.getFullYear(),
        day.getMonth(),
        day.getDate(),
        hours,
        minutes
    );
};

export const pad = (n: number) => n.toString().padStart(2, "0");

export const formatTime = (time: string, hour12: boolean) => {
    if (!time) return "--:--";
    const [hours = 0, minutes = 0] = time.split(":").map(Number);
    if (!hour12) return `${pad(hours)}:${pad(minutes)}`;
    return `${hours % 12 || 12}:${pad(minutes)} ${hours < 12 ? "AM" : "PM"}`;
};

/** English reads times on a 12-hour clock, the other languages on 24. */
export const useHour12 = () => {
    const { i18n } = useTranslation();
    return i18n.language.startsWith("en");
};
