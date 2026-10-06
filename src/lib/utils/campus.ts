import { useEffect, useState } from "react";

import { getFromStorage, saveToStorage } from "./storage";

export const CAMPUS_STORAGE_KEY = "mauria-campus";

const CAMPUS_EVENT = "mauria-campus-change";

export type Campus = "lille" | "chateauroux" | "bordeaux";

export const CAMPUS_OPTIONS: Campus[] = ["lille", "chateauroux", "bordeaux"];

// Campus dont le menu du RU existe (Crous pour Lille, CastelRU pour
// Châteauroux) : Bordeaux n'a pas de RU couvert par l'app.
export const RESTAURANT_CAMPUSES: Campus[] = ["lille", "chateauroux"];

// Les problèmes Wi-Fi de BadJunia ne concernent que le campus de Lille.
export const WIFI_CAMPUS: Campus = "lille";

// findmyroom ne couvre que Lille et Bordeaux : rien à Châteauroux.
export const FREE_ROOMS_CAMPUSES: Campus[] = ["lille", "bordeaux"];

// Rétro-compat : le campus vivait dans la clé du menu du RU avant d'en avoir
// la sienne ("none" | "lille" | "chateauroux").
const LEGACY_RESTAURANT_MENU_KEY = "mauria-restaurant-menu";

const normalize = (raw: string | null): Campus => {
    if (raw === "chateauroux") {
        return "chateauroux";
    }
    if (raw === "bordeaux") {
        return "bordeaux";
    }
    return "lille";
};

export const readCampus = (): Campus => {
    if (typeof window === "undefined") {
        return "lille";
    }

    return normalize(
        getFromStorage(CAMPUS_STORAGE_KEY) ??
            getFromStorage(LEGACY_RESTAURANT_MENU_KEY)
    );
};

export const setCampus = (campus: Campus) => {
    if (typeof window === "undefined") {
        return;
    }

    saveToStorage(CAMPUS_STORAGE_KEY, campus);
    window.dispatchEvent(new Event(CAMPUS_EVENT));
};

export const useCampus = (): Campus => {
    const [campus, setCampusState] = useState<Campus>(readCampus);

    useEffect(() => {
        const handler = () => setCampusState(readCampus());

        window.addEventListener(CAMPUS_EVENT, handler);
        window.addEventListener("storage", handler);

        return () => {
            window.removeEventListener(CAMPUS_EVENT, handler);
            window.removeEventListener("storage", handler);
        };
    }, []);

    return campus;
};
