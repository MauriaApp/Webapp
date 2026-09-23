import { Lesson, Grade, Absence, AurionDocument, DocumentsResult } from "@/types/aurion";
import { apiRequest, APIResponse, API_URL } from "./helper";
import { getFromStorage, saveToStorage } from "../utils/storage";
import { queryClient } from "@/lib/query-client";
import {
    expectedFetchDuration,
    fetchJuniaStatus,
    isAurionSessionWarm,
    markAurionSession,
    type JuniaStatus,
    type SlowQueryKey,
} from "./junia-status";

const JUNIA_STATUS_STALE_MS = 1000 * 60; // same as useJuniaStatus

/**
 * Make sure BadJunia's timings are in the query cache before timing a fetch
 * against them. Awaits the shared juniaStatus query when it has no fresh
 * data yet (deduplicated across concurrent fetches), outside the measured
 * window. Returns null when the status is unreachable — the caller then
 * falls back to the measured constants.
 */
async function ensureJuniaStatus(): Promise<JuniaStatus | null> {
    try {
        const status = await queryClient.ensureQueryData({
            queryKey: ["juniaStatus"],
            queryFn: fetchJuniaStatus,
            staleTime: JUNIA_STATUS_STALE_MS,
        });
        return status ?? null;
    } catch {
        return null;
    }
}

/**
 * Wrap one of the slow Aurion fetches with console timing: logs the start,
 * then the elapsed time against the BadJunia-estimated duration. Applied in
 * the API layer so every page that fetches logs, not just the welcome one.
 */
async function timedAurionFetch<T>(
    key: SlowQueryKey,
    fn: () => Promise<T>
): Promise<T> {
    // Load BadJunia's timings first (outside the measured window) so the
    // expected value is theirs, not the fallback constants.
    const status = await ensureJuniaStatus();
    const expected = expectedFetchDuration(status, key);
    const warm = isAurionSessionWarm();
    const start = performance.now();
    console.log(
        `[fetch] ${key} — start (expected ${expected}ms, ${
            warm ? "warm session" : "cold session"
        })`
    );
    try {
        return await fn();
    } finally {
        // The session (and its home tokens) are cached now: the next fetch
        // within the API's TTL only pays the feature page.
        markAurionSession();
        const elapsed = Math.round(performance.now() - start);
        console.log(
            `[fetch] ${key} — done in ${elapsed}ms (expected ${expected}ms)`
        );
    }
}

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

export async function fetchUser({
    email,
    password,
}: {
    email: string;
    password: string;
}) {
    const data = await apiRequest<{ success: boolean; error?: string }>(
        "/aurion/login",
        "POST",
        {
            email,
            password,
        }
    );
    if (data?.success) {
        // The API caches this fresh session and warms the home-page tokens
        // in the background: the session is fully warm once that page has
        // loaded, hence the delayed warm mark.
        const status = await ensureJuniaStatus();
        markAurionSession(status?.aurionTimes.home ?? 4500);
    }
    return data;
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

    return timedAurionFetch("planning", () =>
        apiRequest<PlanningEntry>(`/aurion/planning`, "POST", body)
    );
}

export async function fetchGrades(): Promise<GradeEntry | null> {
    const session = getSession();
    if (!session) return null;
    return timedAurionFetch("grades", () =>
        apiRequest<GradeEntry>("/aurion/grades", "POST", session)
    );
}

export async function fetchAbsences(): Promise<AbsenceEntry | null> {
    const session = getSession();
    if (!session) return null;
    return timedAurionFetch("absences", () =>
        apiRequest<AbsenceEntry>("/aurion/absences", "POST", session)
    );
}

type DocumentEntry = APIResponse<DocumentsResult>;

export async function fetchDocuments(): Promise<DocumentEntry | null> {
    const session = getSession();
    if (!session) return null;
    return timedAurionFetch("documents", () =>
        apiRequest<DocumentEntry>("/aurion/documents", "POST", session)
    );
}

/**
 * Outcome of a document download.  `handedOff` means the file left the app for
 * the system browser, so we know it started but never see it finish.
 */
export type DownloadOutcome =
    | { status: "saved"; filename: string }
    | { status: "handedOff" }
    | { status: "error" };

type DownloadRequest = Record<string, unknown>;

function buildDownloadRequest(
    doc: AurionDocument,
    session: Record<string, string>
): DownloadRequest {
    return {
        ...session,
        category: doc.category,
        docIndex: doc.docIndex,
        downloadType: doc.downloadType,
        submitParam: doc.submitParam,
        selectName: doc.selectName,
        optionValue: doc.optionValue,
        downloadButtonParam: doc.downloadButtonParam,
        consulterParam: doc.consulterParam,
    };
}

/**
 * Mobile WebViews silently drop `<a download>` on a `blob:` URL — neither
 * Capacitor shell registers a download handler — so the click did nothing and
 * the file never reached the phone.  There we hand a real GET URL to the system
 * browser instead, which saves it natively.
 */
function prefersBrowserDownload(): boolean {
    const capacitor = (
        window as unknown as {
            Capacitor?: { isNativePlatform?: () => boolean };
        }
    ).Capacitor;
    if (capacitor?.isNativePlatform?.()) return true;
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * Downloads a document as a binary blob and triggers a browser save.
 * Used on desktop, where the anchor download works.
 */
async function saveDocumentBlob(
    body: DownloadRequest
): Promise<DownloadOutcome> {
    try {
        const response = await fetch(`${API_URL}/aurion/documents/download`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        if (!response.ok) return { status: "error" };

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
        return { status: "saved", filename };
    } catch {
        return { status: "error" };
    }
}

/**
 * Mints a short-lived download link and navigates to it.  Both Capacitor
 * shells cancel an off-origin top-level navigation and pass the URL to the
 * system browser, so the app stays where it is.
 */
async function openDocumentInBrowser(
    body: DownloadRequest
): Promise<DownloadOutcome> {
    const data = await apiRequest<APIResponse<{ token: string }>>(
        "/aurion/documents/download-link",
        "POST",
        body
    );
    const token = data?.data?.token;
    if (!token) return { status: "error" };

    window.location.assign(
        `${API_URL}/aurion/documents/file?token=${encodeURIComponent(token)}`
    );
    return { status: "handedOff" };
}

export async function downloadDocument(
    doc: AurionDocument
): Promise<DownloadOutcome> {
    const session = getSession();
    if (!session) return { status: "error" };

    const body = buildDownloadRequest(doc, session);
    return prefersBrowserDownload()
        ? openDocumentInBrowser(body)
        : saveDocumentBlob(body);
}
