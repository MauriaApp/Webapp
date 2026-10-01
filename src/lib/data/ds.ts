import { DsExam } from "@/types/ds";

/**
 * "Calendrier des devoirs surveillés CPGE 2" (2026/2027) — hardcoded like the
 * colles schedule. CPG2 MPI and PSI only: their Aurion planning shows a
 * generic "DS selon planning" on Fridays 13:30 - 17:30, which this table
 * replaces with the real subject and hours (see resolveDsLessons).
 * All DS sit in room C854 unless Aurion says otherwise.
 */

const DS_ROOM = "IC2 C854";

export const MPI_DS_2026: DsExam[] = [
    { date: "2026-09-11", start: "13:30", end: "15:30", subject: "Fr-Ph lecture" },
    { date: "2026-09-18", start: "13:30", end: "17:30", subject: "Info 1" },
    { date: "2026-09-25", start: "13:30", end: "17:30", subject: "Maths 1" },
    { date: "2026-10-02", start: "13:30", end: "17:30", subject: "Physique 1" },
    { date: "2026-10-09", start: "13:30", end: "17:30", subject: "Info 2" },
    { date: "2026-10-16", start: "08:00", end: "12:00", subject: "Fr-Ph 1" },
    { date: "2026-10-16", start: "13:30", end: "15:30", subject: "Anglais 1" },
    { date: "2026-11-06", start: "13:30", end: "17:30", subject: "Maths 2" },
    { date: "2026-11-13", start: "13:30", end: "17:30", subject: "Physique 2" },
    { date: "2026-11-20", start: "13:30", end: "17:30", subject: "Info 3" },
    { date: "2026-11-27", start: "13:30", end: "17:30", subject: "Maths 3" },
    { date: "2026-12-04", start: "13:30", end: "17:30", subject: "Physique 3" },
    { date: "2026-12-11", start: "13:30", end: "17:30", subject: "Oraux maths" },
    { date: "2026-12-14", start: "08:00", end: "12:00", subject: "Maths" },
    { date: "2026-12-15", start: "08:00", end: "12:00", subject: "Physique" },
    { date: "2026-12-15", start: "13:30", end: "16:30", subject: "Anglais" },
    { date: "2026-12-16", start: "08:00", end: "12:00", subject: "Fr-Ph" },
    { date: "2026-12-16", start: "13:30", end: "15:30", subject: "LV2" },
    { date: "2026-12-17", start: "08:00", end: "12:00", subject: "Info" },
];

export const PSI_DS_2026: DsExam[] = [
    { date: "2026-09-11", start: "13:30", end: "15:30", subject: "Fr-Ph lecture" },
    { date: "2026-09-25", start: "13:30", end: "16:30", subject: "Maths 1" },
    { date: "2026-10-02", start: "13:30", end: "15:30", subject: "Physique 1" },
    { date: "2026-10-09", start: "13:30", end: "15:30", subject: "SI 1" },
    { date: "2026-10-16", start: "08:00", end: "12:00", subject: "Fr-Ph 1" },
    { date: "2026-10-16", start: "13:30", end: "15:30", subject: "Anglais 1" },
    { date: "2026-11-06", start: "13:30", end: "16:30", subject: "Maths 2" },
    { date: "2026-11-13", start: "13:30", end: "15:30", subject: "Physique 2" },
    { date: "2026-11-20", start: "13:30", end: "15:30", subject: "SI 2" },
    { date: "2026-11-27", start: "13:30", end: "16:30", subject: "Maths 3" },
    { date: "2026-12-04", start: "13:30", end: "15:30", subject: "Physique 3" },
    { date: "2026-12-11", start: "13:30", end: "17:30", subject: "Oraux maths" },
    { date: "2026-12-14", start: "08:00", end: "12:00", subject: "Physique" },
    { date: "2026-12-15", start: "08:00", end: "12:00", subject: "Maths" },
    { date: "2026-12-15", start: "13:30", end: "16:30", subject: "Anglais" },
    { date: "2026-12-16", start: "08:00", end: "12:00", subject: "Fr-Ph" },
    { date: "2026-12-16", start: "13:30", end: "15:30", subject: "LV2" },
    { date: "2026-12-17", start: "08:00", end: "11:00", subject: "SI" },
];

/** Keyed by the class label returned by /colles/group. */
export const DS_BY_CLASS: Record<string, { room: string; exams: DsExam[] }> = {
    MPI: { room: DS_ROOM, exams: MPI_DS_2026 },
    PSI: { room: DS_ROOM, exams: PSI_DS_2026 },
};
