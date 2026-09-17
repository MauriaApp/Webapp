import { apiRequest } from "./helper";

type ColleGroup = { class: string | null; group: string | null };

// Resolves the caller's khôlles class/group server-side: the student roster
// never ships in this bundle (see API-v2 routes/supa-data/colles.ts).
// `confirmedCpg` must only be true once Aurion grades have positively
// identified the student as CPG1/CPG2 (see detectStudentClass in
// lib/utils/grades.ts) — it relaxes the server's matching from an exact
// full-name match to prefix matching. Passing true without that confirmation
// risks matching an unrelated student from another filière to someone else's
// khôlles.
export async function fetchColleGroup(
    email: string,
    confirmedCpg: boolean
): Promise<ColleGroup | null> {
    return apiRequest<ColleGroup>("/colles/group", "POST", {
        email,
        confirmedCpg,
    });
}
