import { Lesson, Grade, Absence } from "@/types/aurion";
import { apiRequest, APIResponse } from "./helper";
import { getFromStorage, saveToStorage } from "../utils/storage";

type PlanningEntry = APIResponse<Lesson[]>;
type GradeEntry = APIResponse<Grade[]>;
type AbsenceEntry = APIResponse<Absence[]>;

export function getSession() {
    const email = getFromStorage("email");
    const password = getFromStorage("password");
    return email && password ? { email, password } : null;
}

export function setSession(email: string, password: string) {
    saveToStorage("email", email);
    saveToStorage("password", password);
}

export function fetchUser({
    email,
    password,
}: {
    email: string;
    password: string;
}) {
    return apiRequest<{ success: boolean; error?: string }>(
        "/aurion/login",
        "POST",
        {
            email,
            password,
        }
    );
}

export async function fetchPlanning(params?: {
    start?: string;
    end?: string;
}): Promise<PlanningEntry | null> {
    const session = getSession();
    if (!session) return null;
    const start = params?.start ?? null;
    const end = params?.end ?? null;

    const body = start && end ? { start, end, ...session } : session;

    const data = await apiRequest<PlanningEntry>(
        `/aurion/planning`,
        "POST",
        body
    );
    if (data?.success) {
        return data;
    }
    return null;
}

export async function fetchGrades(): Promise<GradeEntry | null> {
    const session = getSession();
    if (!session) return null;
    const data = await apiRequest<GradeEntry>(
        "/aurion/grades",
        "POST",
        session
    );
    return data;
}

export async function fetchAbsences(): Promise<AbsenceEntry | null> {
    const session = getSession();
    if (!session) return null;
    const data = await apiRequest<AbsenceEntry>(
        "/aurion/absences",
        "POST",
        session
    );
    return data;
}
