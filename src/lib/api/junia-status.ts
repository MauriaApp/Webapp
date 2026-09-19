import { apiRequest } from "./helper";

export interface JuniaStatus {
    aurionDown: boolean;
    aurionSince: string | null;
    wifiDown: boolean;
    wifiSince: string | null;
}

export async function fetchJuniaStatus(): Promise<JuniaStatus | null> {
    return apiRequest<JuniaStatus>("/badjunia/status", "GET");
}
