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

export async function fetchImportantMessage(): Promise<MessageEntry[]> {
    const response = await apiRequest<MessageEntry[] | MessageEntry>(
        "/messages",
        "GET"
    );

    if (!response) {
        return [];
    }

    // The API used to return a single message before moving to a list —
    // accept both shapes while the deployed API catches up with the webapp.
    const messages = Array.isArray(response) ? response : [response];

    return messages.filter((entry) => entry?.title);
}

export async function fetchUpdates(): Promise<UpdatesEntry[] | null> {
    const response = await apiRequest<UpdatesEntry[]>("/updates", "GET");

    if (!response) {
        return null;
    }

    return response;
}
