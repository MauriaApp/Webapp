export type InternshipContractType =
    | "internship"
    | "seasonal"
    | "apprenticeship"
    | "job";

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

export type InternshipDuration = "short" | "medium" | "long";

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
}

/** Counts per value, each computed with every OTHER filter applied. */
export interface InternshipFacets {
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
    total: number;
}
