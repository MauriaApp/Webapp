import { DailyMenu } from "@/types/data";
import { apiRequest } from "./helper";

/**
 * Menu du jour des RU de la Catho (scrappé côté API depuis all-lacatho.fr).
 * Renvoie null si l'endpoint n'existe pas encore / est injoignable : dans ce cas
 * la section correspondante ne s'affiche pas sur l'accueil.
 */
export async function fetchDailyMenu(): Promise<DailyMenu | null> {
    const data = await apiRequest<DailyMenu>("/lacatho/menu", "GET");
    if (!data || !Array.isArray(data.restaurants) || !data.restaurants.length) {
        return null;
    }
    return data;
}
