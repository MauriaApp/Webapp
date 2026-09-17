import { apiRequest } from "./helper";

type ColleGroup = { class: string | null; group: string | null };

// Resolves the caller's khôlles class/group server-side: the student roster
// never ships in this bundle (see API-v2 routes/supa-data/colles.ts).
export async function fetchColleGroup(
    email: string
): Promise<ColleGroup | null> {
    return apiRequest<ColleGroup>("/colles/group", "POST", { email });
}
