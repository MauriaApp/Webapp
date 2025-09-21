import { Absence } from "@/types/aurion";

export const getAbsences = ({
    showCurrentYearOnly,
    absences,
}: {
    showCurrentYearOnly?: boolean;
    absences: Absence[];
}): Absence[] => {
    if (!showCurrentYearOnly) return absences || [];

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
        const [day, month, year] = absence.date.split("/").map(Number);
        const absenceDate = new Date(year, month - 1, day); // month is 0-indexed
        return absenceDate >= schoolYearStart && absenceDate <= schoolYearEnd;
    });
};

export const getAbsencesDurations = (
    absences: Absence[],
    thisYear?: boolean
) => {
    const targetAbsences = thisYear
        ? getAbsences({ showCurrentYearOnly: true, absences: absences })
        : absences;

    if (!targetAbsences)
        return {
            total: "0h00",
            justified: "0h00",
            unjustified: "0h00",
            filteredAbsences: [],
        };

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
        return `${hours}h${remainingMinutes.toString().padStart(2, "0")}`;
    };

    return {
        total: formatDuration(totalMinutes),
        justified: formatDuration(justifiedMinutes),
        unjustified: formatDuration(unjustifiedMinutes),
        filteredAbsences: targetAbsences || [],
    };
};
