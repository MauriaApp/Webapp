import { useEffect, useState } from "react";

import { getFromStorage, saveToStorage } from "./storage";

export const RESTAURANT_MENU_STORAGE_KEY = "mauria-restaurant-menu";

const RESTAURANT_MENU_EVENT = "mauria-restaurant-menu-change";

export const readRestaurantMenuEnabled = (): boolean => {
    if (typeof window === "undefined") {
        return true;
    }

    return getFromStorage(RESTAURANT_MENU_STORAGE_KEY) !== "false";
};

export const setRestaurantMenuEnabled = (enabled: boolean) => {
    if (typeof window === "undefined") {
        return;
    }

    saveToStorage(RESTAURANT_MENU_STORAGE_KEY, enabled ? "true" : "false");
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
