export type PalantirEntityKind = "room" | "group";

export interface PalantirEntity {
    kind: PalantirEntityKind;
    /** Opaque key handed back to the API to get the schedule. */
    id: string;
    label: string;
    /** Secondary line: the class for a group, the full name for a room. */
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
        groups: number;
    };
}

export interface PalantirSearchResult {
    results: PalantirEntity[];
    status: PalantirIndexStatus;
}

/** A teacher of the index. Admin-only results, invisible to everyone else. */
export interface PalantirTeacher {
    /** As Aurion writes it, e.g. "Monsieur BELLEUDY". */
    name: string;
    lessons: number;
}

/** A student of a promotion roster. Admin-only results. */
export interface PalantirStudent {
    firstName: string;
    lastName: string;
    className: string;
    /** The class as a Palantir entity id, to open its planning on click. */
    groupId: string;
}

export interface PalantirPeopleResult {
    teachers: PalantirTeacher[];
    students: PalantirStudent[];
}
