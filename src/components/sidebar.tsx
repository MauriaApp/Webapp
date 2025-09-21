"use client";

import { useState } from "react";
import { Moon, Sun, Menu, Settings, Info, HeartHandshake } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { useTheme } from "@/components/theme-provider";
import { useNavigate } from "react-router";

export default function Sidebar() {
    const [open, setOpen] = useState(false);
    const { theme, setTheme } = useTheme();
    const isDark = theme === "dark";

    const navigate = useNavigate();

    const handleNavigate = (path: string) => {
        setOpen(false);
        navigate(path);
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-white [&_svg]:!size-7"
                >
                    <Menu />
                    <span className="sr-only">Ouvrir le menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85%] sm:max-w-sm p-0">
                <div className="p-5">
                    <SheetHeader>
                        <SheetTitle>Menu</SheetTitle>
                    </SheetHeader>

                    <div className="mt-4 space-y-4">
                        {/* Thème */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 [&_svg]:!size-7">
                                {isDark ? (
                                    <Moon className="h-5 w-5" />
                                ) : (
                                    <Sun className="h-5 w-5" />
                                )}
                                <div className="flex flex-col">
                                    <Label
                                        htmlFor="theme-toggle"
                                        className="cursor-pointer"
                                    >
                                        Thème
                                    </Label>
                                    <span className="text-xs text-muted-foreground">
                                        {isDark ? "Sombre" : "Clair"}
                                    </span>
                                </div>
                            </div>
                            <Switch
                                id="theme-toggle"
                                checked={isDark}
                                onCheckedChange={(checked) =>
                                    setTheme(checked ? "dark" : "light")
                                }
                            />
                        </div>

                        <Separator />

                        {/* Autres actions */}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start gap-2 px-3 h-10 [&_svg]:!size-7"
                            onClick={() => handleNavigate("/associations")}
                        >
                            <HeartHandshake className="h-5 w-5" />
                            Associations
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start gap-2 px-3 h-10 [&_svg]:!size-7"
                            onClick={() => setOpen(false)}
                        >
                            <Settings className="h-5 w-5" />
                            Paramètres
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start gap-2 px-3 h-10 [&_svg]:!size-7"
                            onClick={() => setOpen(false)}
                        >
                            <Info className="h-5 w-5" />À propos
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
