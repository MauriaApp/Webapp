import { TFunction } from "i18next";
import { formatDistanceToNow, parseISO, Locale } from "date-fns";
import { InternshipSalary } from "@/types/internships";

/**
 * Day-only dates (SeasonalJobs, ThinkSpain) are stored at midnight UTC:
 * "about 14 hours ago" would be misleading for them.
 */
const DAY_ONLY = /^\d{4}-\d{2}-\d{2}T00:00:00(\.000)?Z$/;
const DAY_MS = 24 * 60 * 60 * 1000;

/** "Aujourd'hui" / "Hier" / "Il y a 3 jours" for day-only dates, date-fns
 * distance ("il y a environ 14 heures") otherwise. */
export function formatPostedAt(
    iso: string,
    locale: Locale,
    t: TFunction
): string {
    if (DAY_ONLY.test(iso)) {
        const days = Math.floor((Date.now() - Date.parse(iso)) / DAY_MS);
        if (days <= 0) return t("internshipsPage.postedDay.today");
        if (days === 1) return t("internshipsPage.postedDay.yesterday");
        return t("internshipsPage.postedDay.days", { count: days });
    }
    return formatDistanceToNow(parseISO(iso), {
        addSuffix: true,
        locale,
    });
}

/** "FR" → "France" / "Frankreich" / "France", in the app language. */
export function regionName(code: string, language: string): string {
    try {
        return (
            new Intl.DisplayNames([language], { type: "region" }).of(code) ??
            code
        );
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
        return code;
    }
}

/** "£28k–£32k/yr", "€12/h"… The currency and period come from the offer. */
export function formatSalary(
    salary: InternshipSalary,
    language: string,
    t: TFunction
): string {
    const format = (value: number) => {
        try {
            return new Intl.NumberFormat(language, {
                ...(salary.currency
                    ? { style: "currency", currency: salary.currency }
                    : {}),
                maximumFractionDigits: 0,
            }).format(value);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
            return String(Math.round(value));
        }
    };
    const amount =
        salary.max && salary.max !== salary.min
            ? `${format(salary.min)}–${format(salary.max)}`
            : format(salary.min);
    return salary.period
        ? `${amount}${t(`internshipsPage.salary.period.${salary.period}`)}`
        : amount;
}
