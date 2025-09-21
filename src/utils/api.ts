import { Absence } from "./absences";
import { Grade } from "./grades";

const API_URL = "https://mauria-api.fly.dev";

export function getSession() {
    const email = localStorage.getItem("email");
    const password = localStorage.getItem("password");

    if (!email || !password) {
        return null;
    }

    return { email, password };
}

export function setSession(email: string, password: string) {
    localStorage.setItem("email", email);
    localStorage.setItem("password", password);
}

export async function login(email: string, password: string): Promise<boolean> {
    const response = await fetch(`${API_URL}/aurion/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            email,
            password,
        }),
    });

    if (response.status === 302) {
        setSession(email, password);
        await fetchFirstName();
        return true;
    }

    return false;
}

type PlanningQueryParams = {
    start: string;
    end: string;
};

type PlanningDayData = {
    id: string;
    title: string;
    start: string;
    end: string;
    allDay: boolean;
    editable: boolean;
    className: string;
};

export type PlanningEntry = {
    success: boolean;
    data: PlanningDayData[];
};

export async function fetchPlanning(
    params?: PlanningQueryParams
): Promise<PlanningEntry | null> {
    const session = getSession();
    if (!session) return null;

    const today = new Date();
    const start = params?.start ?? formatDate(today);
    const end = params?.end ?? start;

    const response = await fetch(
        `${API_URL}/aurion/planning?start=${encodeURIComponent(
            start
        )}&end=${encodeURIComponent(end)}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: session.email,
                password: session.password,
            }),
        }
    );

    if (response.ok) {
        const data = (await response.json()) as PlanningEntry;
        localStorage.setItem("lastPlanningUpdate", new Date().toISOString());
        localStorage.setItem("planning", JSON.stringify(data.data));
        return data;
    }

    return null;
}

export type GradesEntry = {
    success: boolean;
    data: Grade[];
};

export async function fetchGrades(): Promise<GradesEntry | null> {
    const session = getSession();
    if (!session) return null;

    localStorage.setItem("newGrades", JSON.stringify([]));

    const response = await fetch(`${API_URL}/aurion/grades`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            email: session.email,
            password: session.password,
        }),
    });

    if (!response.ok) {
        localStorage.setItem("grades", JSON.stringify([]));
        return null;
    }

    const data = (await response.json()) as GradesEntry;
    const oldGrades = JSON.parse(
        localStorage.getItem("grades") ?? "[]"
    ) as Array<{ code: string }>;
    const newGrades = data.data.filter(
        (grade: { code: string }) =>
            !oldGrades.some((old) => old.code === grade.code)
    );

    localStorage.setItem("grades", JSON.stringify(data.data));
    localStorage.setItem("newGrades", JSON.stringify(newGrades));

    return data;
}

export type AbsencesEntry = {
    success: boolean;
    data: Absence[];
};

export async function fetchAbsences(): Promise<AbsencesEntry | null> {
    const session = getSession();
    if (!session) return null;

    const response = await fetch(`${API_URL}/aurion/absences`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            email: session.email,
            password: session.password,
        }),
    });

    if (!response.ok) {
        return null;
    }

    const data = (await response.json()) as AbsencesEntry;
    localStorage.setItem("absences", JSON.stringify(data.data));
    return data;
}

export function getAbsences() {
    const data = localStorage.getItem("absences");
    return data ? JSON.parse(data) : null;
}

export async function fetchFirstName() {
    const name = deriveFirstName(localStorage.getItem("email"));
    localStorage.setItem("name", name);
    return name;
}

export function getFirstName() {
    return localStorage.getItem("name");
}

function deriveFirstName(email: string | null) {
    if (!email) return "";

    const match = email.match(/^([\w+-]*)([.-])/);
    if (!match) return "";

    return match[1]
        .split(/[-.]/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join("-");
}

export type AssociationData = {
    name: string;
    description: string;
    contact: string;
    image: string;
};

export async function fetchAssos(): Promise<AssociationData[] | null> {
    const response = await fetch(`${API_URL}/associations`);

    if (!response.ok) {
        return null;
    }

    const data = (await response.json()) as AssociationData[];
    localStorage.setItem("associations", JSON.stringify(data));
    return data;
}

export type MessageEntry = {
    title: string;
    message: string;
};

export async function fetchImportantMessage(): Promise<MessageEntry> {
    const response = await fetch(`${API_URL}/messages`);

    if (!response.ok) {
        return {
            title: "Erreur",
            message: "Une erreur est survenue, rechargez la page plus tard",
        };
    }

    return response.json();
}

export type UpdatesEntry = {
    version: string;
    date: string;
    titleVisu: string;
    contentVisu: string;
    titleDev: string;
    contentDev: string;
};

export async function fetchUpdates(): Promise<UpdatesEntry[] | null> {
    const response = await fetch(`${API_URL}/updates`);

    if (!response.ok) {
        localStorage.setItem("updates-log", "[]");
        return null;
    }

    const data = (await response.json()) as UpdatesEntry[];
    localStorage.setItem("updates-log", JSON.stringify(data));
    return data;
}

type ToolData = {
    buttonTitle: string;
    description: string;
    url: string;
};

export async function fetchTools(): Promise<ToolData[]> {
    try {
        const response = await fetch(`${API_URL}/tools`);

        if (!response.ok) {
            throw new Error("Failed to fetch tools");
        }

        const data = (await response.json()) as ToolData[];
        localStorage.setItem("tools", JSON.stringify(data));
        return data;
    } catch {
        try {
            const cached = localStorage.getItem("tools");
            return cached ? JSON.parse(cached) : [];
        } catch {
            return [];
        }
    }
}

export function clearStorage() {
    localStorage.removeItem("email");
    localStorage.removeItem("password");
    localStorage.removeItem("planning");
    localStorage.removeItem("grades");
    localStorage.removeItem("newGrades");
    localStorage.removeItem("userStats");
    localStorage.removeItem("absences");
    localStorage.removeItem("name");
}

function formatDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}
