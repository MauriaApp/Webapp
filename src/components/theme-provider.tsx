"use client";

import { getFromStorage, saveToStorage } from "@/lib/utils/storage";
import type React from "react";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "oled" | "cherry" | "pride" | "ocean" | "forest";

type ThemeProviderProps = {
    children: React.ReactNode;
};

const ThemeProviderContext = createContext<{
    theme: Theme;
    setTheme: (theme: Theme) => void;
}>({
    theme: "dark",
    setTheme: () => null,
});

export function ThemeProvider({ children }: Readonly<ThemeProviderProps>) {
    const defaultTheme = globalThis.matchMedia?.("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";

    const [theme, setTheme] = useState<Theme>(
        (getFromStorage("theme") as Theme) || defaultTheme
    );

    useEffect(() => {
        const root = globalThis.document.documentElement;
        root.classList.remove(
            "light",
            "dark",
            "oled",
            "cherry",
            "pride",
            "ocean",
            "forest"
        );
        root.classList.add(theme);
        saveToStorage("theme", theme);
    }, [theme]);

    return (
        <ThemeProviderContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeProviderContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
    const context = useContext(ThemeProviderContext);
    if (context === undefined)
        throw new Error("useTheme must be used within a ThemeProvider");
    return context;
};
