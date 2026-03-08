import { Lesson } from "@/types/aurion";
import i18n from "@/i18n";
import { parseFromTitle } from "./home";

const escapeIcsText = (text: string): string => {
  return text
    .replace(/\\/g, "\\\\")   // \ → \\
    .replace(/;/g, "\\;")     // ; → \;
    .replace(/,/g, "\\,")     // , → \,
    .replace(/\n/g, "\\n");   // \n → \n (dans le texte)
};

const formatDateUTC = (date: Date) => {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    date.getUTCFullYear().toString() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    "T" +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    "Z"
  );
};

const buildIcsContent = (events: Lesson[]): string => {
  const vevents = events
    .map((lesson) => {
      const parsed = parseFromTitle(lesson);
      const start = new Date(lesson.start);
      const end = new Date(lesson.end);

      return [
        "BEGIN:VEVENT",
        `UID:${lesson.id}@mauria`,
        `DTSTAMP:${formatDateUTC(new Date())}`,
        `DTSTART:${formatDateUTC(start)}`,
        `DTEND:${formatDateUTC(end)}`,
        `SUMMARY:${escapeIcsText(parsed.courseTitle || i18n.t("schedulePage.calendar.untitledEvent"))}`,
        `LOCATION:${escapeIcsText(parsed.location || "Mauria")}`,
        `DESCRIPTION:${escapeIcsText(
          `${i18n.t("schedulePage.calendar.teacher")}: ${parsed.teacher || i18n.t("schedulePage.calendar.unknown")}, ${i18n.t("schedulePage.calendar.type")}: ${parsed.type || i18n.t("schedulePage.calendar.unknown")}`
        )}`,
        "END:VEVENT",
      ].join("\r\n");
    })
    .join("\r\n");

  return (
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Mauria//Planning//FR",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      vevents,
      "END:VCALENDAR",
    ].join("\r\n") + "\r\n"
  );
};

export const exportCalendar = async (events: Lesson[]): Promise<void> => {
  const icsContent = buildIcsContent(events);
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const file = new File([blob], "mauria-planning.ics", { type: "text/calendar" });

  // Web Share API : fonctionne dans les WebViews iOS et Android
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: "Mauria Planning" });
    return;
  }

  // Fallback navigateur web classique
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "mauria-planning.ics";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
