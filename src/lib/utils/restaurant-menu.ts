import { useEffect, useState } from "react";

import { getFromStorage, saveToStorage } from "./storage";

export const RESTAURANT_MENU_STORAGE_KEY = "mauria-restaurant-menu";

const RESTAURANT_MENU_EVENT = "mauria-restaurant-menu-change";

export type RestaurantCampus = "none" | "lille" | "chateauroux";

export const RESTAURANT_CAMPUS_OPTIONS: RestaurantCampus[] = [
    "none",
    "lille",
    "chateauroux",
];

const normalize = (raw: string | null): RestaurantCampus => {
    // Rétro-compat avec l'ancien toggle booléen ("true"/"false").
    if (raw === "false" || raw === "none") {
        return "none";
    }
    if (raw === "chateauroux") {
        return "chateauroux";
    }
    return "lille";
};

export const readRestaurantCampus = (): RestaurantCampus => {
    if (typeof window === "undefined") {
        return "lille";
    }

    return normalize(getFromStorage(RESTAURANT_MENU_STORAGE_KEY));
};

export const setRestaurantCampus = (campus: RestaurantCampus) => {
    if (typeof window === "undefined") {
        return;
    }

    saveToStorage(RESTAURANT_MENU_STORAGE_KEY, campus);
    window.dispatchEvent(new Event(RESTAURANT_MENU_EVENT));
};

export const useRestaurantCampus = (): RestaurantCampus => {
    const [campus, setCampus] = useState<RestaurantCampus>(readRestaurantCampus);

    useEffect(() => {
        const handler = () => setCampus(readRestaurantCampus());

        window.addEventListener(RESTAURANT_MENU_EVENT, handler);
        window.addEventListener("storage", handler);

        return () => {
            window.removeEventListener(RESTAURANT_MENU_EVENT, handler);
            window.removeEventListener("storage", handler);
        };
    }, []);

    return campus;
};
