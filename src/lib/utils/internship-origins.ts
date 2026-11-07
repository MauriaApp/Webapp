/**
 * The two networks behind the sites and offers of the internships page:
 * - `junia`: the list curated by Junia's internship office (pôle stage);
 * - `ijhdf`: the "Destination Europe" guide by Information Jeunesse
 *   Hauts-de-France, bundled in /docs and scraped into the Offers tab.
 */

export type InternshipOrigin = "junia" | "ijhdf";

export const ORIGINS: InternshipOrigin[] = ["junia", "ijhdf"];

/** Logos shipped in /public/brands. */
export const ORIGIN_LOGOS: Record<InternshipOrigin, string> = {
    junia: "/brands/junia.webp",
    ijhdf: "/brands/ijhdf.webp",
};
