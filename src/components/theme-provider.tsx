"use client";

import { getFromStorage, saveToStorage } from "@/lib/utils/storage";
import type React from "react";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "oled" | "cherry" | "pride";

type ThemeProviderProps = {
    children: React.ReactNode;
    defaultTheme?: Theme;
};

const ThemeProviderContext = createContext<{
    theme: Theme;
    setTheme: (theme: Theme) => void;
}>({
    theme: "dark",
    setTheme: () => null,
});

export function ThemeProvider({
    children,
    defaultTheme = "dark",
}: ThemeProviderProps) {
    const [theme, setTheme] = useState<Theme>(
        (getFromStorage("theme") as Theme) || defaultTheme
    );

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove("light", "dark", "oled", "cherry", "pride");
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
