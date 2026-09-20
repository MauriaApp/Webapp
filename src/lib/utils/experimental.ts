import { useEffect, useState } from "react";

import { getFromStorage, saveToStorage } from "./storage";

export const CS2_GRADES_GAMBLING_STORAGE_KEY = "mauria-cs2-grades-gambling";

const CS2_GRADES_GAMBLING_EVENT = "mauria-cs2-grades-gambling-change";

export const readCs2GradesGambling = (): boolean => {
    if (typeof window === "undefined") {
        return false;
    }

    return getFromStorage(CS2_GRADES_GAMBLING_STORAGE_KEY) === "true";
};

export const setCs2GradesGambling = (enabled: boolean) => {
    if (typeof window === "undefined") {
        return;
    }

    saveToStorage(CS2_GRADES_GAMBLING_STORAGE_KEY, String(enabled));
    window.dispatchEvent(new Event(CS2_GRADES_GAMBLING_EVENT));
};

export const useCs2GradesGambling = (): boolean => {
    const [enabled, setEnabled] = useState<boolean>(readCs2GradesGambling);

    useEffect(() => {
        const handler = () => setEnabled(readCs2GradesGambling());

        window.addEventListener(CS2_GRADES_GAMBLING_EVENT, handler);
        window.addEventListener("storage", handler);

        return () => {
            window.removeEventListener(CS2_GRADES_GAMBLING_EVENT, handler);
            window.removeEventListener("storage", handler);
        };
    }, []);

    return enabled;
};
