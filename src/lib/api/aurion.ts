import { Lesson, Grade, Absence, AurionDocument, DocumentsResult } from "@/types/aurion";
import { apiRequest, APIResponse, API_URL } from "./helper";
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

type DocumentEntry = APIResponse<DocumentsResult>;

export async function fetchDocuments(): Promise<DocumentEntry | null> {
    const session = getSession();
    if (!session) return null;
    const data = await apiRequest<DocumentEntry>(
        "/aurion/documents",
        "POST",
        session
    );
    return data;
}

/**
 * Downloads a document as a binary blob and triggers a browser save.
 * Returns the filename from the Content-Disposition header.
 */
export async function downloadDocument(
    doc: AurionDocument
): Promise<string | null> {
    const session = getSession();
    if (!session) return null;

    try {
        const response = await fetch(
            `${API_URL}/aurion/documents/download`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...session,
                    category: doc.category,
                    docIndex: doc.docIndex,
                    downloadType: doc.downloadType,
                    submitParam: doc.submitParam,
                    selectName: doc.selectName,
                    optionValue: doc.optionValue,
                    downloadButtonParam: doc.downloadButtonParam,
                    consulterParam: doc.consulterParam,
                }),
            }
        );
        if (!response.ok) return null;

        const blob = await response.blob();
        const cd = response.headers.get("Content-Disposition");
        const filename =
            cd?.match(/filename="([^"]+)"/)?.[1] ?? "document.pdf";

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return filename;
    } catch {
        return null;
    }
}
