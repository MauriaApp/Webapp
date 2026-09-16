export type ColleSubject =
    | "maths"
    | "physics"
    | "english"
    | "cs"
    | "engineering";

export type ColleSlot = {
    subject: ColleSubject;
    teacher: string;
    room: string;
    /** 1 = Monday … 6 = Saturday */
    weekday: number;
    /** "HH:mm", local time */
    start: string;
};

export type ColleStudent = {
    lastName: string;
    firstName: string;
    group: string;
};

export type CollesClass = {
    id: string;
    label: string;
    source: string;
    /** Monday of each colles week, indexed by week number - 1 */
    weekStarts: string[];
    slots: Record<string, ColleSlot>;
    /** Group id -> the slot codes of each week */
    groups: Record<string, string[][]>;
    students: ColleStudent[];
};
