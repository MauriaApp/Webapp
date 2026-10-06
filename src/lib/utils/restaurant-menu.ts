import { useEffect, useState } from "react";

import { getFromStorage, saveToStorage } from "./storage";

export const RESTAURANT_MENU_STORAGE_KEY = "mauria-restaurant-menu";

const RESTAURANT_MENU_EVENT = "mauria-restaurant-menu-change";

// Rétro-compat avec l'ancien sélecteur de campus ("none" | "lille" |
// "chateauroux") et l'encore plus ancien toggle booléen ("true" | "false") :
// seuls "none" et "false" désactivaient le menu.
const normalize = (raw: string | null): boolean => {
    return raw !== "false" && raw !== "none";
};

export const readRestaurantMenuEnabled = (): boolean => {
    if (typeof window === "undefined") {
        return true;
    }

    return normalize(getFromStorage(RESTAURANT_MENU_STORAGE_KEY));
};

export const setRestaurantMenuEnabled = (enabled: boolean) => {
    if (typeof window === "undefined") {
        return;
    }

    saveToStorage(RESTAURANT_MENU_STORAGE_KEY, String(enabled));
    window.dispatchEvent(new Event(RESTAURANT_MENU_EVENT));
};

export const useRestaurantMenuEnabled = (): boolean => {
    const [enabled, setEnabled] = useState<boolean>(readRestaurantMenuEnabled);

    useEffect(() => {
        const handler = () => setEnabled(readRestaurantMenuEnabled());

        window.addEventListener(RESTAURANT_MENU_EVENT, handler);
        window.addEventListener("storage", handler);

        return () => {
            window.removeEventListener(RESTAURANT_MENU_EVENT, handler);
            window.removeEventListener("storage", handler);
        };
    }, []);

    return enabled;
};
