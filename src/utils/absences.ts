import { mockAbsences } from "@/pages/mock";

export type Absence = {
    date: string;
    type: string;
    duration: string;
    time: string;
    class: string;
    teacher: string;
};

export const getAbsences = ({
    showCurrentYearOnly,
}: { showCurrentYearOnly?: boolean } = {}): Absence[] => {
    if (!showCurrentYearOnly) return mockAbsences.data;

    const absences = mockAbsences.data;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // School year starts September 1st
    const schoolYearStart =
        currentMonth >= 8
            ? new Date(currentYear, 8, 1) // September 1st of current year
            : new Date(currentYear - 1, 8, 1); // September 1st of previous year

    const schoolYearEnd =
        currentMonth >= 8
            ? new Date(currentYear + 1, 7, 31, 23, 59, 59, 999) // August 31st of next year
            : new Date(currentYear, 7, 31, 23, 59, 59, 999); // August 31st of current year

    return absences.filter((absence) => {
        const absenceDate = new Date(absence.date);
        return absenceDate >= schoolYearStart && absenceDate <= schoolYearEnd;
    });
};

export const getAbsencesDurations = (
    absences: Absence[] | null,
    thisYear?: boolean
) => {
    const targetAbsences = thisYear
        ? getAbsences({ showCurrentYearOnly: true })
        : absences;

    if (!targetAbsences)
        return { total: "0:00", justified: "0:00", unjustified: "0:00" };

    let totalMinutes = 0;
    let justifiedMinutes = 0;
    let unjustifiedMinutes = 0;

    targetAbsences.forEach((absence) => {
        const [hours, minutes] = absence.duration.split(":").map(Number);
        const durationInMinutes = hours * 60 + minutes;

        totalMinutes += durationInMinutes;

        const type = absence.type.toLowerCase();
        if (type.includes("non")) {
            unjustifiedMinutes += durationInMinutes;
        } else {
            justifiedMinutes += durationInMinutes;
        }
    });

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}:${remainingMinutes.toString().padStart(2, "0")}`;
    };

    return {
        total: formatDuration(totalMinutes),
        justified: formatDuration(justifiedMinutes),
        unjustified: formatDuration(unjustifiedMinutes),
    };
};
