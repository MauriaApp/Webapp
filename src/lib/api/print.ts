import { API_URL, APIResponse, apiRequest } from "./helper";
import { getSession } from "./aurion";

export type PrintFolder = "WAITING" | "PRINTED";

export interface PrintJob {
    id: string;
    name: string;
    date: string;
    owner: string;
}

export interface PrintBalance {
    personal: number;
    bonus: number;
}

export async function fetchPrintJobs(
    folder: PrintFolder
): Promise<APIResponse<PrintJob[]> | null> {
    const session = getSession();
    if (!session) return null;
    return apiRequest<APIResponse<PrintJob[]>>("/print/jobs", "POST", {
        ...session,
        folder,
    });
}

export async function deletePrintJobs(
    ids: string[]
): Promise<APIResponse<never> | null> {
    const session = getSession();
    if (!session) return null;
    return apiRequest<APIResponse<never>>("/print/jobs/delete", "POST", {
        ...session,
        ids,
    });
}

export async function fetchPrintBalance(): Promise<APIResponse<PrintBalance> | null> {
    const session = getSession();
    if (!session) return null;
    return apiRequest<APIResponse<PrintBalance>>(
        "/print/balance",
        "POST",
        session
    );
}

// Multipart: apiRequest always JSON-encodes, so this one calls fetch directly.
export async function uploadPrintJob(
    file: File,
    bw: boolean,
    duplex: boolean
): Promise<APIResponse<never> | null> {
    const session = getSession();
    if (!session) return null;
    try {
        // Text fields first so the API sees them before the file stream
        const formData = new FormData();
        formData.append("email", session.email);
        formData.append("password", session.password);
        formData.append("bw", String(bw));
        formData.append("duplex", String(duplex));
        formData.append("importFile", file);
        const response = await fetch(`${API_URL}/print/jobs/upload`, {
            method: "POST",
            body: formData,
        });
        if (!response.ok) return null;
        return response.json();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
        return null;
    }
}
