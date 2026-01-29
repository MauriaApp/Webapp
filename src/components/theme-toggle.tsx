"use client";

import { Cherry, Moon, MoonStar, Rainbow, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const themeCycle: typeof theme[] = [
    "light",
    "cherry",
    "pride",
    "dark",
    "oled",
  ];
  const nextTheme = () => {
    const currentIndex = themeCycle.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themeCycle.length;
    setTheme(themeCycle[nextIndex]);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="[&_svg]:size-8!"
      onClick={nextTheme}
      aria-label="Toggle theme"
    >
      {theme === "light" && (
        <Sun className="h-[1.2rem] w-[1.2rem] text-white" />
      )}
      {theme === "dark" && (
        <Moon className="h-[1.2rem] w-[1.2rem] text-white" />
      )}
      {theme === "oled" && (
        <MoonStar className="h-[1.2rem] w-[1.2rem] text-white" />
      )}
      {theme === "cherry" && (
        <Cherry className="h-[1.2rem] w-[1.2rem] text-white" />
      )}
      {theme === "pride" && (
        <Rainbow className="h-[1.2rem] w-[1.2rem] text-white" />
      )}
    </Button>
  );
}
