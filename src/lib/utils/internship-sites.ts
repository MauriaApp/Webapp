/**
 * The sites suggested by Junia's internship office, as a static directory.
 *
 * `offers`: Mauria aggregates their listings (see API-v2's internship
 * sources; `id` matches the `source` column). `link`: the site is only linked
 * — it has no public listings, restricts crawlers, or needs the student's own
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
}

export const INTERNSHIP_SITES: InternshipSite[] = [
    // Junia's own career center comes first: it is the main channel and each
    // student signs in with their own account.
    {
        id: "jobteaser",
        name: "JobTeaser Junia",
        url: "https://junia.jobteaser.com/",
        kind: "link",
    },
    {
        id: "resortwork",
        name: "ResortWork",
        url: "https://www.resortwork.co/",
        kind: "offers",
    },
    {
        id: "seasonaljobs",
        name: "SeasonalJobs NZ",
        url: "https://seasonaljobs.co.nz/",
        kind: "offers",
    },
    {
        id: "thinkspain",
        name: "ThinkSpain",
        url: "https://www.thinkspain.com/summer-jobs-in-spain",
        kind: "offers",
    },
    {
        id: "justjobs",
        name: "JustJobs",
        url: "https://www.justjobs.co.uk/",
        kind: "offers",
    },
    {
        id: "spainmadesimple",
        name: "Spain Made Simple",
        url: "https://www.spainmadesimple.com/work-jobs/summer-jobs",
        kind: "link",
    },
    {
        id: "pickingjobs",
        name: "PickingJobs",
        url: "https://www.pickingjobs.com/",
        kind: "offers",
    },
    {
        id: "chandleranddunn",
        name: "Chandler & Dunn",
        url: "https://www.chandleranddunn.co.uk/",
        kind: "link",
    },
    {
        id: "workaway",
        name: "Workaway",
        url: "https://www.workaway.info/",
        kind: "offers",
    },
    {
        id: "wwoof",
        name: "WWOOF France",
        url: "https://www.wwoof.fr/",
        kind: "link",
    },
    {
        id: "anyworkanywhere",
        name: "Anywork Anywhere",
        url: "https://anyworkanywhere.com/",
        kind: "offers",
    },
    {
        id: "summerjobs",
        name: "SummerJobs",
        url: "https://www.summerjobs.com/",
        kind: "offers",
    },
    {
        id: "e4s",
        name: "E4S",
        url: "https://www.e4s.co.uk/",
        kind: "link",
    },
    {
        id: "teli",
        name: "TEL1",
        url: "https://www.teli.asso.fr/",
        kind: "link",
    },
    {
        id: "pvtistes",
        name: "PVTistes",
        url: "https://pvtistes.net/le-pvt/",
        kind: "link",
    },
    {
        id: "intrax",
        name: "Intrax",
        url: "https://www.intrax.fr/",
        kind: "link",
    },
    {
        id: "alzea",
        name: "Alzea",
        url: "https://www.alzea.org/",
        kind: "link",
    },
    {
        id: "fruitfuljobs",
        name: "Fruitful Jobs",
        url: "https://www.fruitfuljobs.com/",
        kind: "link",
    },
    {
        id: "campzeke",
        name: "Camp Zeke",
        url: "https://www.campzeke.org/join-our-staff/",
        kind: "link",
    },
];

export const siteName = (id: string): string =>
    INTERNSHIP_SITES.find((site) => site.id === id)?.name ?? id;
