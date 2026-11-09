import { useEffect, useState } from "react";

import { getFromStorage, saveToStorage } from "./storage";

export const TECHNICAL_DETAILS_STORAGE_KEY = "mauria-technical-details";

const TECHNICAL_DETAILS_EVENT = "mauria-technical-details-change";

// Off by default: the Aurion internals of an event are only useful to the
// curious (or when debugging a parsing issue).
export const readTechnicalDetailsEnabled = (): boolean => {
    if (typeof window === "undefined") {
        return false;
    }

    return getFromStorage(TECHNICAL_DETAILS_STORAGE_KEY) === "true";
};

export const setTechnicalDetailsEnabled = (enabled: boolean) => {
    if (typeof window === "undefined") {
        return;
    }

    saveToStorage(TECHNICAL_DETAILS_STORAGE_KEY, String(enabled));
    window.dispatchEvent(new Event(TECHNICAL_DETAILS_EVENT));
};

export const useTechnicalDetailsEnabled = (): boolean => {
    const [enabled, setEnabled] = useState<boolean>(
        readTechnicalDetailsEnabled
    );

    useEffect(() => {
        const handler = () => setEnabled(readTechnicalDetailsEnabled());

        window.addEventListener(TECHNICAL_DETAILS_EVENT, handler);
        window.addEventListener("storage", handler);

        return () => {
            window.removeEventListener(TECHNICAL_DETAILS_EVENT, handler);
            window.removeEventListener("storage", handler);
        };
    }, []);

    return enabled;
};
