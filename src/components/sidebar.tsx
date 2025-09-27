"use client";

import { useEffect, useState } from "react";
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
    ImageUpscale,
    ArrowDownRightFromSquare,
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
import { applyScale, readInitialSize } from "@/lib/utils/scale";
import type { SizeOption } from "@/lib/utils/scale";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";

export default function Sidebar() {
    const [open, setOpen] = useState(false);
    const { theme, setTheme } = useTheme();
    const isDark = theme === "dark";

    const [size, setSize] = useState<SizeOption>(readInitialSize);

    useEffect(() => {
        applyScale(size);
    }, [size]);

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
                    className="text-white [&_svg]:size-7!"
                >
                    <Menu />
                    <span className="sr-only">Ouvrir le menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent
                side="right"
                className="w-[85%] sm:max-w-sm p-5 flex-col flex justify-between border-none"
            >
                <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>

                    <div className="mt-4 space-y-4">
                        {/* Thème */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 [&_svg]:size-7!">
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
                                    <span className="text-xs text-muted-foreground text-left">
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

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 [&_svg]:size-7!">
                                <ImageUpscale className="h-5 w-5" />
                                <div className="flex flex-col">
                                    <Label className="cursor-default">
                                        Taille
                                    </Label>
                                    <span className="text-xs text-muted-foreground text-left">
                                        {size === "petit"
                                            ? "Petit"
                                            : size === "moyen"
                                            ? "Moyen"
                                            : "Grand"}
                                    </span>
                                </div>
                            </div>
                            <ToggleGroup
                                size="sm"
                                type="single"
                                value={size}
                                onValueChange={(v) =>
                                    v && setSize(v as SizeOption)
                                }
                                className="inline-flex gap-0 rounded-md border border-border/50 overflow-hidden"
                                aria-label="Choisir la taille"
                            >
                                <ToggleGroupItem
                                    value="petit"
                                    className="rounded-none first:rounded-l-md h-8 px-2 text-xs border-l border-border/50 first:border-l-0 -ml-px first:ml-0 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                                >
                                    Petit
                                </ToggleGroupItem>
                                <ToggleGroupItem
                                    value="moyen"
                                    className="rounded-none h-8 px-2 text-xs border-l border-border/50 -ml-px data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                                >
                                    Moyen
                                </ToggleGroupItem>
                                <ToggleGroupItem
                                    value="grand"
                                    className="rounded-none last:rounded-r-md h-8 px-2 text-xs border-l border-border/50 -ml-px data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                                >
                                    Grand
                                </ToggleGroupItem>
                            </ToggleGroup>
                        </div>

                        <Separator />

                        {/* Autres actions */}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="group w-full justify-start gap-2 px-0 h-10 [&_svg]:size-7"
                            onClick={() => handleNavigate("/associations")}
                        >
                            <HeartHandshake className="h-5 w-5" />
                            Associations
                            <div className="justify-end flex-1 flex text-muted-foreground transition-colors group-hover:text-accent-foreground">
                                <ArrowDownRightFromSquare className="size-4!" />
                            </div>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="group w-full justify-start gap-2 px-0 h-10 [&_svg]:size-7"
                            onClick={() =>
                                window.open(
                                    "https://aurion.junia.com",
                                    "_blank"
                                )
                            }
                        >
                            <ThumbsDown className="h-5 w-5" />
                            Aurion
                            <div className="justify-end flex-1 flex text-muted-foreground transition-colors group-hover:text-accent-foreground">
                                <ArrowDownRightFromSquare className="size-4!" />
                            </div>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="group w-full justify-start gap-2 px-0 h-10 [&_svg]:size-7"
                            onClick={() =>
                                window.open(
                                    "https://junia-learning.com",
                                    "_blank"
                                )
                            }
                        >
                            <Book className="h-5 w-5" />
                            Junia Learning
                            <div className="justify-end flex-1 flex text-muted-foreground transition-colors group-hover:text-accent-foreground">
                                <ArrowDownRightFromSquare className="size-4!" />
                            </div>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="group w-full justify-start gap-2 px-0 h-10 [&_svg]:size-7"
                            onClick={() =>
                                window.open(
                                    "https://print.junia.com/end-user/ui/dashboard",
                                    "_blank"
                                )
                            }
                        >
                            <Printer className="h-5 w-5" />
                            Imprimer
                            <div className="justify-end flex-1 flex text-muted-foreground transition-colors group-hover:text-accent-foreground">
                                <ArrowDownRightFromSquare className="size-4!" />
                            </div>
                        </Button>
                    </div>
                </SheetHeader>

                <SheetFooter className="relative flex-col! gap-2 px-0">
                    <div className="w-full mt-4 space-y-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="group w-full justify-start gap-2 px-0 h-10 [&_svg]:size-7"
                            onClick={() =>
                                window.open(
                                    "mailto:milo.montuori@student.junia.com",
                                    "_blank"
                                )
                            }
                        >
                            <MailQuestionMark className="h-5 w-5" />
                            Une question ? Un problème ?
                            <div className="justify-end flex-1 flex text-muted-foreground transition-colors group-hover:text-accent-foreground">
                                <ArrowDownRightFromSquare className="size-4!" />
                            </div>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="group w-full justify-start gap-2 px-0 h-10 [&_svg]:size-7 text-red-500"
                            onClick={() => signOut()}
                        >
                            <BadgeX className="h-5 w-5" />
                            Se déconnecter
                            <div className="justify-end flex-1 flex text-red-500 transition-colors group-hover:text-accent-foreground">
                                <ArrowDownRightFromSquare className="size-4!" />
                            </div>
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
