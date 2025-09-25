import {
    AssociationData,
    MessageEntry,
    UpdatesEntry,
    ToolData,
} from "@/types/data";
import { apiRequest, APIResponse } from "./helper";

export async function fetchAssos(): Promise<AssociationData[] | null> {
    const response = await apiRequest<AssociationData[]>(
        "/associations",
        "GET"
    );

    if (!response) {
        return null;
    }

    return response;
}

export async function fetchImportantMessage(): Promise<MessageEntry> {
    const response = await apiRequest<MessageEntry>("/messages", "GET");

    if (!response?.title) {
        return { title: "", message: "" };
    }

    return response;
}

export async function fetchUpdates(): Promise<UpdatesEntry[] | null> {
    const response = await apiRequest<APIResponse<UpdatesEntry[]>>(
        "/updates",
        "GET"
    );

    if (!response?.success || !response.data) {
        localStorage.setItem("updates-log", "[]");
        return null;
    }

    return response.data;
}

export async function fetchTools(): Promise<ToolData[]> {
    const response = await apiRequest<APIResponse<ToolData[]> | ToolData[]>(
        "/tools",
        "GET"
    );

    if (!response) return [];

    if (Array.isArray(response)) return response;

    if (typeof response === "object" && "success" in response) {
        return response.success && Array.isArray(response.data)
            ? response.data
            : [];
    }

    return [];
}
