"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, Menu, HeartHandshake, BadgeX, ExternalLink } from "lucide-react";

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
import { fetchTools } from "@/lib/api/supa";
import type { ToolData } from "@/types/data";

export default function Sidebar() {
    const [open, setOpen] = useState(false);
    const { theme, setTheme } = useTheme();
    const isDark = theme === "dark";

    const navigate = useNavigate();
    const [tools, setTools] = useState<ToolData[]>([]);

    useEffect(() => {
        const loadTools = async () => {
            try {
                const data = await fetchTools();
                if (Array.isArray(data)) setTools(data);
            } catch (e) {
                console.error(e);
            }
        };
        loadTools();
    }, []);

    const handleNavigate = (path: string) => {
        setOpen(false);
        navigate(path);
    };

    const signOut = () => {
        localStorage.clear();
        handleNavigate("/login");
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
                        {tools.map((tool) => (
                            <Button
                                key={tool.url}
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start gap-2 px-3 h-10 [&_svg]:!size-7"
                                asChild
                            >
                                <a
                                    href={tool.url}
                                    target="_blank"
                                    rel="noreferrer noopener"
                                    aria-label={tool.description || tool.buttonTitle}
                                    title={tool.description || tool.buttonTitle}
                                >
                                    <ExternalLink className="h-5 w-5" />
                                    {tool.buttonTitle}
                                </a>
                            </Button>
                        ))}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start gap-2 px-3 h-10 [&_svg]:!size-7 text-red-500"
                            onClick={() => signOut()}
                        >
                            <BadgeX className="h-5 w-5" />
                            Se déconnecter
                        </Button>

                        <p className="mt-4 text-center text-xs text-muted-foreground">
                            Projet développé et maintenu par Milo Montuori,
                            Louis Lecouturier ainsi que Louis Soltysiak
                        </p>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
