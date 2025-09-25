"use client";

import { useState } from "react";
import {
    Moon,
    Sun,
    Menu,
    HeartHandshake,
    BadgeX,
    ThumbsDown,
    Book,
    Printer,
    MailQuestionMark,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Sheet,
    SheetContent,
    SheetFooter,
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
            <SheetContent
                side="right"
                className="w-[85%] sm:max-w-sm p-5 flex-col flex justify-between"
            >
                <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>

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
                            onClick={() => handleNavigate("/associations")}
                        >
                            <ThumbsDown className="h-5 w-5" />
                            Aurion
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start gap-2 px-3 h-10 [&_svg]:!size-7"
                            onClick={() => handleNavigate("/associations")}
                        >
                            <Book className="h-5 w-5" />
                            Junia Learning
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start gap-2 px-3 h-10 [&_svg]:!size-7"
                            onClick={() => handleNavigate("/associations")}
                        >
                            <Printer className="h-5 w-5" />
                            Imprimer
                        </Button>
                    </div>
                </SheetHeader>

                <SheetFooter className="relative !flex-col gap-2 px-0">
                    <div className="w-full mt-4 space-y-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start gap-2 px-3 h-10 [&_svg]:!size-7"
                            onClick={() =>
                                window.open(
                                    "mailto:milo.montuori@student.junia.com",
                                    "_blank"
                                )
                            }
                        >
                            <MailQuestionMark className="h-5 w-5" />
                            Une question ? Un problème ?
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start gap-2 px-3 h-10 [&_svg]:!size-7 text-red-500"
                            onClick={() => signOut()}
                        >
                            <BadgeX className="h-5 w-5" />
                            Se déconnecter
                        </Button>
                    </div>

                    <Separator />

                    <p className="mt-4 text-center text-xs text-muted-foreground">
                        Projet développé et maintenu par Milo Montuori, <br />
                        Louis Lecouturier et Louis Soltysiak
                    </p>
                    <div className="w-full text-center text-xs text-muted-foreground">
                        <span>Version 2.3.0</span>
                        <span className="mx-1">—</span>
                        <a
                            href="https://github.com/MauriaApp"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline underline-offset-4"
                        >
                            Contribuer à Mauria
                        </a>
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
