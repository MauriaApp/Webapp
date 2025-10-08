import { AssociationData, MessageEntry, UpdatesEntry } from "@/types/data";
import { apiRequest } from "./helper";

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
    const response = await apiRequest<UpdatesEntry[]>("/updates", "GET");

    if (!response) {
        return null;
    }

    return response;
}
