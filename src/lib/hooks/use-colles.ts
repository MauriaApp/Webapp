import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { fetchGrades, getSession } from "@/lib/api/aurion";
import { fetchColleGroup } from "@/lib/api/colles";
import { detectStudentClass } from "@/lib/utils/grades";
import { buildCollesLessons } from "@/lib/utils/colles";
import { resolveDsLessons } from "@/lib/utils/ds";
import { useAurionWarm } from "@/lib/hooks/use-aurion-warm";
import { Grade, Lesson } from "@/types/aurion";

/**
 * The student's khôlles class/group, looked up server-side from their email
 * (API-v2 resolves it, the roster stays there). Shared by the khôlles and the
 * DS replacement so the lookup happens once.
 */
function useColleGroup() {
    const { isWarming } = useAurionWarm();

    // Whether the student is CPG1/CPG2 is only known for sure from their
    // Aurion grade codes (detectStudentClass) — this same query backs the
    // grades page, so it's usually already cached. It gates how loosely the
    // server is allowed to match khôlles by name (see fetchColleGroup).
    const { data: grades = [] } = useQuery<Grade[]>({
        queryKey: ["grades"],
        queryFn: async () => {
            const res = await fetchGrades();
            if (!res?.success) throw new Error("Failed to fetch grades");
            return res.data ?? [];
        },
        enabled: !isWarming,
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 60 * 24,
    });
    const confirmedCpg = detectStudentClass(grades) !== null;

    const email = getSession()?.email;
    const { data } = useQuery({
        queryKey: ["colles-group", email, confirmedCpg],
        queryFn: () => (email ? fetchColleGroup(email, confirmedCpg) : null),
        staleTime: 1000 * 60 * 60 * 24, // a student's class doesn't change daily
        gcTime: 1000 * 60 * 60 * 24,
    });

    return data ?? null;
}

/**
 * The student's khôlles as planning lessons, shared by the planning and the
 * home page. Classes whose colles schedule is known (MP2I, MPSI, PSI and MPI)
 * get theirs; everyone else gets an empty list.
 */
export function useColles(): Lesson[] {
    const { i18n } = useTranslation();
    const match = useColleGroup();

    return useMemo(
        () => buildCollesLessons(match?.class, match?.group),
        // The lesson titles are translated: rebuild when the language changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [match?.class, match?.group, i18n.language]
    );
}

/**
 * The Aurion planning with CPG2 MPI/PSI's generic "DS selon planning" swapped
 * for the real DS (see resolveDsLessons). Untouched for everyone else.
 */
export function useResolvedPlanning(lessons: Lesson[]): Lesson[] {
    const match = useColleGroup();

    return useMemo(
        () => resolveDsLessons(lessons, match?.class),
        [lessons, match?.class]
    );
}
