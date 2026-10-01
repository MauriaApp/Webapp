export type DsExam = {
    /** "yyyy-MM-dd" */
    date: string;
    /** "HH:mm", local time */
    start: string;
    end: string;
    /** Free label as printed on the schedule ("Physique 1", "Oraux maths"…) */
    subject: string;
};
