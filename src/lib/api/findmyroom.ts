import { Building, RoomsForBuilding } from "@/types/findmyroom";
import { apiRequest } from "./helper";

export async function fetchBuildings(): Promise<Building[] | null> {
    return apiRequest<Building[]>("/findmyroom/buildings", "GET");
}

export async function fetchRoomsForBuilding(
    buildingCode: string
): Promise<RoomsForBuilding | null> {
    return apiRequest<RoomsForBuilding>(
        `/findmyroom/rooms/${encodeURIComponent(buildingCode)}`,
        "GET"
    );
}
