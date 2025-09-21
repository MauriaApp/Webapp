import {
    AssociationData,
    MessageEntry,
    UpdatesEntry,
    ToolData,
} from "@/types/supa";
import { apiRequest, APIResponse } from "./helper";

export async function fetchAssos(): Promise<AssociationData[] | null> {
    const response = await apiRequest<APIResponse<AssociationData[]>>(
        "/associations",
        "GET"
    );

    if (!response?.success) {
        return null;
    }

    return response.data ?? null;
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
    const response = await apiRequest<APIResponse<ToolData[]>>("/tools", "GET");

    if (!response?.success || !response.data) {
        return [];
    }

    return response.data;
}
