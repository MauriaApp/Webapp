"use client";

import { getFromStorage, saveToStorage } from "@/lib/utils/storage";
import type React from "react";
import { createContext, useContext, useState } from "react";

const BACKGROUND_STORAGE_KEY = "background";

export const BACKGROUND_OPTIONS = ["particles", "grid"] as const;

export type BackgroundName = (typeof BACKGROUND_OPTIONS)[number];

type BackgroundProviderProps = {
    children: React.ReactNode;
    defaultBackground?: BackgroundName;
};

type BackgroundContextValue = {
    background: BackgroundName;
    setBackground: (background: BackgroundName) => void;
};

function validateBackground(
    value: string | null,
    fallback: BackgroundName
): BackgroundName {
    if (!value) return fallback;
    return BACKGROUND_OPTIONS.includes(value as BackgroundName)
        ? (value as BackgroundName)
        : fallback;
}

const BackgroundProviderContext = createContext<BackgroundContextValue>({
    background: BACKGROUND_OPTIONS[0],
    setBackground: () => undefined,
});

export function BackgroundProvider({
    children,
    defaultBackground = BACKGROUND_OPTIONS[0],
}: BackgroundProviderProps) {
    const [background, setBackgroundState] = useState<BackgroundName>(() =>
        validateBackground(
            getFromStorage(BACKGROUND_STORAGE_KEY),
            defaultBackground
        )
    );

    const setBackground = (nextBackground: BackgroundName) => {
        setBackgroundState(nextBackground);
        saveToStorage(BACKGROUND_STORAGE_KEY, nextBackground);
    };

    return (
        <BackgroundProviderContext.Provider
            value={{ background, setBackground }}
        >
            {children}
        </BackgroundProviderContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useBackground = () => {
    const context = useContext(BackgroundProviderContext);
    if (context === undefined) {
        throw new Error(
            "useBackground must be used within a BackgroundProvider"
        );
    }
    return context;
};
