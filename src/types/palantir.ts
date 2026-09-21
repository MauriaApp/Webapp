export type PalantirEntityKind = "room" | "teacher" | "group";

export interface PalantirEntity {
    kind: PalantirEntityKind;
    /** Opaque key handed back to the API to get the schedule. */
    id: string;
    label: string;
    /** Secondary line: the promotion for a group, the full name for a room. */
    detail: string;
    /** Aurion's own kind for a group: "Promotion" or "Planning". */
    type: string;
    /** Indexed lessons behind the entity. Always 0 for a group. */
    count: number;
}

export interface PalantirIndexStatus {
    state: "empty" | "building" | "ready";
    phase: "plannings" | "events" | null;
    done: number;
    total: number;
    elapsedMs: number;
    builtAt: number | null;
    expiresAt: number | null;
    windowStart: number | null;
    windowEnd: number | null;
    /** The index is past its expiry but still served while rebuilding. */
    stale: boolean;
    error: string | null;
    failed: string[];
    counts: {
        lessons: number;
        rooms: number;
        teachers: number;
        groups: number;
    };
}

export interface PalantirSearchResult {
    results: PalantirEntity[];
    status: PalantirIndexStatus;
}
