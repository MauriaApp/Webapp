const API_URL = "https://mauria-api.fly.dev";

export interface APIResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

export async function apiRequest<APIResponse>(
    path: string,
    method: "GET" | "POST" = "POST",
    body?: Record<string, unknown>,
    headers?: Record<string, string>
): Promise<APIResponse | null> {
    try {
        const response = await fetch(`${API_URL}${path}`, {
            method,
            headers: {
                "Content-Type": "application/json",
                ...(headers || {}),
            },
            ...(body ? { body: JSON.stringify(body) } : {}),
        });
        if (!response.ok) return null;
        return response.json();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
        return null;
    }
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
