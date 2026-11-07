import { InternshipOrigin } from "@/lib/utils/internship-origins";

/**
 * The sites suggested by Junia's internship office, plus the scrapable ones
 * found in the "Destination Europe" guide from Information Jeunesse
 * Hauts-de-France, as a static directory.
 *
 * `offers`: Mauria aggregates their listings (see the scraper sources on the
 * Pi; `id` matches the `source` column). `link`: the site is only linked — it
 * has no public listings, restricts crawlers, or needs the student's own
 * account. Descriptions live in the locales under internshipsPage.sites.<id>.
 *
 * jobs4travellers.com.au is left out on purpose: its domain no longer exists.
 */

export type InternshipSiteKind = "offers" | "link";

export interface InternshipSite {
    id: string;
    name: string;
    url: string;
    kind: InternshipSiteKind;
    /** Network that recommended the site, see internship-origins. */
    origin: InternshipOrigin;
}

export const INTERNSHIP_SITES: InternshipSite[] = [
    // Junia's own career center comes first: it is the main channel and each
    // student signs in with their own account.
    {
        id: "jobteaser",
        name: "JobTeaser Junia",
        url: "https://junia.jobteaser.com/fr/jobs",
        kind: "link",
        origin: "junia",
    },
    {
        id: "resortwork",
        name: "ResortWork",
        url: "https://www.resortwork.co/",
        kind: "offers",
        origin: "junia",
    },
    {
        id: "seasonaljobs",
        name: "SeasonalJobs NZ",
        url: "https://seasonaljobs.co.nz/",
        kind: "offers",
        origin: "junia",
    },
    {
        id: "thinkspain",
        name: "ThinkSpain",
        url: "https://www.thinkspain.com/summer-jobs-in-spain",
        kind: "offers",
        origin: "junia",
    },
    {
        id: "justjobs",
        name: "JustJobs",
        url: "https://www.justjobs.co.uk/",
        kind: "offers",
        origin: "junia",
    },
    {
        id: "spainmadesimple",
        name: "Spain Made Simple",
        url: "https://www.spainmadesimple.com/work-jobs/summer-jobs",
        kind: "link",
        origin: "junia",
    },
    {
        id: "pickingjobs",
        name: "PickingJobs",
        url: "https://www.pickingjobs.com/",
        kind: "offers",
        origin: "junia",
    },
    {
        id: "chandleranddunn",
        name: "Chandler & Dunn",
        url: "https://www.chandleranddunn.co.uk/",
        kind: "link",
        origin: "junia",
    },
    {
        id: "workaway",
        name: "Workaway",
        url: "https://www.workaway.info/",
        kind: "offers",
        origin: "junia",
    },
    {
        id: "wwoof",
        name: "WWOOF France",
        url: "https://www.wwoof.fr/",
        kind: "link",
        origin: "junia",
    },
    {
        id: "anyworkanywhere",
        name: "Anywork Anywhere",
        url: "https://anyworkanywhere.com/",
        kind: "offers",
        origin: "junia",
    },
    {
        id: "summerjobs",
        name: "SummerJobs",
        url: "https://www.summerjobs.com/",
        kind: "offers",
        origin: "junia",
    },
    {
        id: "e4s",
        name: "E4S",
        url: "https://www.e4s.co.uk/",
        kind: "link",
        origin: "junia",
    },
    {
        id: "teli",
        name: "TEL1",
        url: "https://www.teli.asso.fr/",
        kind: "link",
        origin: "junia",
    },
    {
        id: "pvtistes",
        name: "PVTistes",
        url: "https://pvtistes.net/le-pvt/",
        kind: "link",
        origin: "junia",
    },
    {
        id: "intrax",
        name: "Intrax",
        url: "https://www.intrax.fr/",
        kind: "link",
        origin: "junia",
    },
    {
        id: "alzea",
        name: "Alzea",
        url: "https://www.alzea.org/",
        kind: "link",
        origin: "junia",
    },
    {
        id: "fruitfuljobs",
        name: "Fruitful Jobs",
        url: "https://www.fruitfuljobs.com/",
        kind: "link",
        origin: "junia",
    },
    {
        id: "campzeke",
        name: "Camp Zeke",
        url: "https://www.campzeke.org/join-our-staff/",
        kind: "link",
        origin: "junia",
    },
    // Scrapable job boards found in the IJ Hauts-de-France guide (bundled
    // under /docs); they also feed the Offers tab.
    {
        id: "lhotellerie",
        name: "L'Hôtellerie Restauration",
        url: "https://www.lhotellerie-restauration.fr/emploi/offre-emploi",
        kind: "offers",
        origin: "ijhdf",
    },
    {
        id: "eurojobs",
        name: "EuroJobs",
        url: "https://www.eurojobs.com/jobs",
        kind: "offers",
        origin: "ijhdf",
    },
    {
        id: "workwide",
        name: "Workwide",
        url: "https://workwide.fr/les-offres-demplois/",
        kind: "offers",
        origin: "ijhdf",
    },
    {
        id: "hotelcareer",
        name: "HotelCareer",
        url: "https://www.hotelcareer.com/jobs/job-offers",
        kind: "offers",
        origin: "ijhdf",
    },
    {
        id: "helpstay",
        name: "HelpStay",
        url: "https://www.helpstay.com/search",
        kind: "offers",
        origin: "ijhdf",
    },
];

export const siteName = (id: string): string =>
    INTERNSHIP_SITES.find((site) => site.id === id)?.name ?? id;

/** Origin of a scraped offer; unknown sources default to the Junia list. */
export const siteOrigin = (id: string): InternshipOrigin =>
    INTERNSHIP_SITES.find((site) => site.id === id)?.origin ?? "junia";
