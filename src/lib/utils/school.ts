import { getFromStorage } from "./storage";

/**
 * Écoles officiellement supportées (scraping Aurion calibré et testé).
 * Ajouter une école ici une fois son instance Aurion validée.
 */
export const KNOWN_SCHOOLS = ["junia"] as const;

const DEFAULT_AURION_URL = "https://aurion.junia.com";

/** Exceptions : école -> URL Aurion complète, quand elle ne suit pas la règle. */
const AURION_URL_OVERRIDES: Record<string, string> = {};

/** Extrait le jeton « école » d'un email (`prenom.nom@student.junia.com` -> `junia`). */
export function getSchoolFromEmail(
    email: string | null | undefined
): string | null {
    const domain = email?.split("@")[1]?.toLowerCase().trim();
    if (!domain || !domain.includes(".")) return null;
    return domain.replace(/^student\./, "").split(".")[0] || null;
}

/** L'école est-elle dans l'allowlist ? */
export function isKnownSchool(school: string | null): boolean {
    return !!school && (KNOWN_SCHOOLS as readonly string[]).includes(school);
}

/** URL de l'instance Aurion pour l'email fourni (conserve le TLD : .com ou .fr). */
export function getAurionUrlFromEmail(
    email: string | null | undefined
): string {
    const domain = email?.split("@")[1]?.toLowerCase().trim();
    if (!domain || !domain.includes(".")) return DEFAULT_AURION_URL;
    const parts = domain.replace(/^student\./, "").split(".");
    const school = parts[0];
    const tld = parts[parts.length - 1];
    if (!school || !tld) return DEFAULT_AURION_URL;
    return AURION_URL_OVERRIDES[school] ?? `https://aurion.${school}.${tld}`;
}

/** URL Aurion de l'utilisateur connecté (d'après l'email stocké). */
export function getAurionUrl(): string {
    return getAurionUrlFromEmail(getFromStorage("email"));
}
