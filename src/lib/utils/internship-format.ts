import { TFunction } from "i18next";
import { InternshipSalary } from "@/types/internships";

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
