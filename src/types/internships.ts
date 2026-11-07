import { InternshipOrigin } from "@/lib/utils/internship-origins";

export type InternshipContractType =
    "internship" | "seasonal" | "apprenticeship" | "job" | "exchange";

export type InternshipField =
    | "it"
    | "engineering"
    | "agri"
    | "hospitality"
    | "trades"
    | "business"
    | "education"
    | "health"
    | "other";

export type InternshipDuration = "one" | "two" | "three" | "medium" | "long";

export type InternshipSort = "recent" | "relevance";

export interface InternshipSalary {
    min: number;
    max: number | null;
    currency: string;
    period: "hour" | "week" | "month" | "year" | "";
}

/** Same job in another place (a posting is one row per city). */
export interface InternshipVariant {
    id: number;
    location: string;
    url: string;
    postedAt: string | null;
}

export interface InternshipOffer {
    id: number;
    /** Source id, matches an entry of INTERNSHIP_SITES. */
    source: string;
    title: string;
    company: string;
    location: string;
    /** ISO 3166-1 alpha-2, "" when unknown. */
    countryCode: string;
    city: string;
    contractType: InternshipContractType;
    field: InternshipField;
    remote: boolean;
    housing: boolean;
    /** Housing only offered under conditions ("possible"). */
    housingOptional: boolean;
    salary: InternshipSalary | null;
    durationMonths: number | null;
    /** Language the posting is written in, "" when unknown. */
    lang: string;
    /** A short summary in lists, the full text from `getInternshipOffer`. */
    description: string;
    url: string;
    postedAt: string | null;
    firstSeenAt: string;
    /** How many places this posting exists in (1 = just this one). */
    variants: number;
    /** Only on the detail endpoint. */
    otherVariants?: InternshipVariant[];
}

export interface InternshipSearchResult {
    /** Cards in the list (a posting in many places is one card): pagination. */
    total: number;
    /** Offers, one per place: what the counters display. */
    totalOffers: number;
    offers: InternshipOffer[];
}

export interface InternshipFilters {
    q: string;
    kind: InternshipContractType[];
    field: InternshipField[];
    /** ISO 3166-1 alpha-2 codes. */
    country: string[];
    city: string[];
    lang: string[];
    housing: boolean;
    remote: boolean;
    paid: boolean;
    duration: InternshipDuration[];
    /** Published within the last N days. */
    posted: 7 | 30 | null;
    sort: InternshipSort;
    /** Which network the sources belong to, null = both. */
    origin: InternshipOrigin | null;
}

/** Counts per value, each computed with every OTHER filter applied. */
export interface InternshipFacets {
    /** Total of the "All" type: computed without the kind filter.
     *  Optional: responses cached before the key existed lack it. */
    kindAll?: number;
    kind: Partial<Record<InternshipContractType, number>>;
    field: Partial<Record<InternshipField, number>>;
    country: Record<string, number>;
    city: Record<string, number>;
    lang: Record<string, number>;
    housing: number;
    remote: number;
    paid: number;
    duration: Record<InternshipDuration, number>;
    posted: Record<"7" | "30", number>;
    /** Per network counts, matching the origin filter.
     *  Optional: responses cached before the filter existed lack it. */
    origin?: Partial<Record<InternshipOrigin, number>>;
    total: number;
}

/** An anonymized Junia execution internship (served by the Pi, not bundled). */
export interface JuniaStage {
    /** Row position in the dataset: a stable key, rows can be identical. */
    id: number;
    /** Promotion, e.g. "2526". */
    year: string;
    /** HEI, ISEN, ADIMAKER, CPI, ISA, LASALLE… */
    program: string;
    /** LILLE or BORDEAUX, "" when unknown. */
    campus: string;
    /** Class within the program, e.g. "CPG1 MP2I". */
    level: string;
    /** "execution" or "extra". */
    kind: string;
    company: string;
    city: string;
    /** ISO 3166-1 alpha-2, uppercase; raw text when unknown. */
    country: string;
    subject: string;
    start: string;
    end: string;
}

export interface JuniaSearchResult {
    total: number;
    stages: JuniaStage[];
}

/** Per-section option counts: value -> number of stages. */
export interface JuniaFacets {
    years: Record<string, number>;
    studyYears: Record<string, number>;
    programs: Record<string, number>;
}

export interface JuniaFacetsResult extends JuniaFacets {
    /** Counts per type, every filter applied except the type itself. */
    kinds: Record<string, number>;
    kindAll: number;
    total: number;
    /** ISO codes present in the dataset: the client resolves localized names. */
    countries: string[];
}
