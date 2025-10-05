"use client";

import { useEffect, useState } from "react";
import {
    Moon,
    Sun,
    MoonStar,
    Menu,
    HeartHandshake,
    BadgeX,
    ThumbsDown,
    Book,
    Printer,
    MailQuestionMark,
    ImageUpscale,
    ArrowDownRightFromSquare,
    Languages,
    Wallpaper,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
    Sheet,
    SheetContent,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { useBackground, BACKGROUND_OPTIONS, type BackgroundName } from "@/components/background-provider";
import { useTheme } from "@/components/theme-provider";
import { useNavigate } from "react-router";
import { applyScale, readInitialSize } from "@/lib/utils/scale";
import type { SizeOption } from "@/lib/utils/scale";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";
import { clearStorage } from "@/lib/utils/storage";
import { useTranslation } from "react-i18next";

import {
    applyLocale,
    readInitialLocale,
    type LocaleOption,
} from "@/lib/utils/translations";

export default function Sidebar() {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const { theme, setTheme } = useTheme();

    const { background, setBackground } = useBackground();
    const selectedBackgroundLabel = t(`sidebar.backgroundParameter.${background}`);

    const handleBackgroundChange = (value: string) => {
        if (!value) return;
        if (BACKGROUND_OPTIONS.includes(value as BackgroundName)) {
            setBackground(value as BackgroundName);
        }
    };

    const themeDisplay = {
        light: { Icon: Sun, label: t("sidebar.themeParameter.light") },
        dark: { Icon: Moon, label: t("sidebar.themeParameter.dark") },
        oled: { Icon: MoonStar, label: t("sidebar.themeParameter.oled") },
    } as const;

    const { Icon: ThemeIcon, label: themeLabel } =
        themeDisplay[theme] ?? themeDisplay.light;

    const [size, setSize] = useState<SizeOption>(readInitialSize);
    const [locale, setLocale] = useState<LocaleOption>(readInitialLocale);

    useEffect(() => {
        applyScale(size);
    }, [size]);

    useEffect(() => {
        applyLocale(locale);
    }, [locale]);

    const navigate = useNavigate();

    const handleNavigate = (path: string) => {
        setOpen(false);
        navigate(path);
    };

    const signOut = () => {
        clearStorage();
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
                    <span className="sr-only">{t("sidebar.openMenu")}</span>
                </Button>
            </SheetTrigger>

            <SheetContent
                side="right"
                className="w-[85%] sm:max-w-sm p-5 flex-col flex justify-between border-none oled:bg-black"
            >
                <SheetHeader>
                    <SheetTitle>{t("sidebar.title")}</SheetTitle>

                    <div className="mt-4 space-y-4">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 [&_svg]:size-7!">
                                <ThemeIcon className="h-5 w-5" />
                                <div className="flex flex-col">
                                    <Label className="cursor-default">
                                        {t("sidebar.themeParameter.title")}
                                    </Label>
                                    <span className="text-xs text-muted-foreground text-left">
                                        {themeLabel}
                                    </span>
                                </div>
                            </div>
                            <ToggleGroup
                                size="sm"
                                type="single"
                                value={theme}
                                onValueChange={(value) =>
                                    value && setTheme(value as typeof theme)
                                }
                                className="ml-auto inline-flex min-w-0 w-full max-w-[calc(100%-8em)] gap-0 rounded-md border border-border/50 overflow-hidden"
                                aria-label={
                                    t("sidebar.themeParameter.title") ??
                                    "Choose theme"
                                }
                            >
                                <ToggleGroupItem
                                    value="light"
                                    className="flex-1 rounded-none first:rounded-l-md h-8 px-2 text-xs border-l border-border/50 first:border-l-0 -ml-px first:ml-0 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground justify-center"
                                >
                                    {t("sidebar.themeParameter.light")}
                                </ToggleGroupItem>
                                <ToggleGroupItem
                                    value="dark"
                                    className="flex-1 rounded-none h-8 px-2 text-xs border-l border-border/50 -ml-px data-[state=on]:bg-primary data-[state=on]:text-primary-foreground justify-center"
                                >
                                    {t("sidebar.themeParameter.dark")}
                                </ToggleGroupItem>
                                <ToggleGroupItem
                                    value="oled"
                                    className="flex-1 rounded-none last:rounded-r-md h-8 px-2 text-xs border-l border-border/50 -ml-px data-[state=on]:bg-primary data-[state=on]:text-primary-foreground justify-center"
                                >
                                    {t("sidebar.themeParameter.oled")}
                                </ToggleGroupItem>
                            </ToggleGroup>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 [&_svg]:size-7!">
                                <Wallpaper className="h-5 w-5" />
                                <div className="flex flex-col">
                                    <Label className="cursor-default">
                                        {t("sidebar.backgroundParameter.title")}
                                    </Label>
                                    <span className="text-xs text-muted-foreground text-left">
                                        {selectedBackgroundLabel}
                                    </span>
                                </div>
                            </div>
                            <ToggleGroup
                                size="sm"
                                type="single"
                                value={background}
                                onValueChange={handleBackgroundChange}
                                className="ml-auto inline-flex min-w-0 w-full max-w-[calc(100%-8em)] gap-0 rounded-md border border-border/50 overflow-hidden"
                                aria-label={
                                    t("sidebar.backgroundParameter.title") ??
                                    "Choose background"
                                }
                            >
                                {BACKGROUND_OPTIONS.map((option) => (
                                    <ToggleGroupItem
                                        key={option}
                                        value={option}
                                        className="flex-1 rounded-none first:rounded-l-md h-8 px-2 text-xs border-l border-border/50 first:border-l-0 -ml-px first:ml-0 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground justify-center"
                                    >
                                        {t(`sidebar.backgroundParameter.${option}`)}
                                    </ToggleGroupItem>
                                ))}
                            </ToggleGroup>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            <div className="flex shrink-0 items-center gap-3 [&_svg]:size-7!">
                                <ImageUpscale className="h-5 w-5" />
                                <div className="flex flex-col">
                                    <Label className="cursor-default">
                                        {t("sidebar.sizeParameter.title")}
                                    </Label>
                                    <span className="text-xs text-muted-foreground text-left">
                                        {size === "petit"
                                            ? t("sidebar.sizeParameter.small")
                                            : size === "moyen"
                                            ? t("sidebar.sizeParameter.medium")
                                            : t("sidebar.sizeParameter.large")}
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
                                className="ml-auto inline-flex min-w-0 w-full max-w-[calc(100%-8em)] gap-0 rounded-md border border-border/50 overflow-hidden"
                                aria-label={
                                    t("sidebar.sizeParameter.aria") ??
                                    "Choose size"
                                }
                            >
                                <ToggleGroupItem
                                    value="petit"
                                    className="flex-1 rounded-none first:rounded-l-md h-8 px-2 text-xs border-l border-border/50 first:border-l-0 -ml-px first:ml-0 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground justify-center"
                                >
                                    {t("sidebar.sizeParameter.small")}
                                </ToggleGroupItem>
                                <ToggleGroupItem
                                    value="moyen"
                                    className="flex-1 rounded-none h-8 px-2 text-xs border-l border-border/50 -ml-px data-[state=on]:bg-primary data-[state=on]:text-primary-foreground justify-center"
                                >
                                    {t("sidebar.sizeParameter.medium")}
                                </ToggleGroupItem>
                                <ToggleGroupItem
                                    value="grand"
                                    className="flex-1 rounded-none last:rounded-r-md h-8 px-2 text-xs border-l border-border/50 -ml-px data-[state=on]:bg-primary data-[state=on]:text-primary-foreground justify-center"
                                >
                                    {t("sidebar.sizeParameter.large")}
                                </ToggleGroupItem>
                            </ToggleGroup>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            <div className="flex shrink-0 items-center gap-3 [&_svg]:size-7!">
                                <Languages className="h-5 w-5" />
                                <div className="flex flex-col">
                                    <Label className="cursor-default">
                                        {t("sidebar.languageParameter.title")}
                                    </Label>
                                    <span className="text-xs text-muted-foreground text-left">
                                        {locale === "fr-FR"
                                            ? t(
                                                  "sidebar.languageParameter.fr-FR"
                                              )
                                            : t(
                                                  "sidebar.languageParameter.en-US"
                                              )}
                                    </span>
                                </div>
                            </div>
                            <ToggleGroup
                                size="sm"
                                type="single"
                                value={locale}
                                onValueChange={(v) =>
                                    v && setLocale(v as LocaleOption)
                                }
                                className="ml-auto inline-flex min-w-0 w-full max-w-[calc(100%-8em)] gap-0 rounded-md border border-border/50 overflow-hidden"
                                aria-label="Choose language"
                            >
                                <ToggleGroupItem
                                    value="fr-FR"
                                    className="flex-1 rounded-none first:rounded-l-md h-8 px-2 text-xs border-l border-border/50 first:border-l-0 -ml-px first:ml-0 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground justify-center"
                                >
                                    {t("sidebar.languageParameter.fr-FR")}
                                </ToggleGroupItem>
                                <ToggleGroupItem
                                    value="en-US"
                                    className="flex-1 rounded-none h-8 px-2 text-xs border-l border-border/50 -ml-px data-[state=on]:bg-primary data-[state=on]:text-primary-foreground justify-center"
                                >
                                    {t("sidebar.languageParameter.en-US")}
                                </ToggleGroupItem>
                                <ToggleGroupItem
                                    value="es-ES"
                                    className="flex-1 rounded-none last:rounded-r-md h-8 px-2 text-xs border-l border-border/50 -ml-px data-[state=on]:bg-primary data-[state=on]:text-primary-foreground justify-center"
                                >
                                    {t("sidebar.languageParameter.es-ES")}
                                </ToggleGroupItem>
                            </ToggleGroup>
                        </div>

                        <Separator />

                        <Button
                            variant="ghost"
                            size="sm"
                            className="group w-full justify-start gap-2 px-0 h-10 [&_svg]:size-7"
                            onClick={() => handleNavigate("/associations")}
                        >
                            <HeartHandshake className="h-5 w-5" />
                            {t("sidebar.actions.associations")}
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
                            {t("sidebar.actions.aurion")}
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
                            {t("sidebar.actions.juniaLearning")}
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
                            {t("sidebar.actions.print")}
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
                            {t("sidebar.help")}
                            <div className="justify-end flex-1 flex text-muted-foreground transition-colors group-hover:text-accent-foreground">
                                <ArrowDownRightFromSquare className="size-4!" />
                            </div>
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            className="group w-full justify-start gap-2 px-0 h-10 [&_svg]:size-7 text-red-500 oled:text-gray-200"
                            onClick={signOut}
                        >
                            <BadgeX className="h-5 w-5" />
                            {t("sidebar.logOut")}
                            <div className="justify-end flex-1 flex text-red-500 oled:text-gray-300 transition-colors group-hover:text-accent-foreground oled:group-hover:text-gray-100">
                                <ArrowDownRightFromSquare className="size-4!" />
                            </div>
                        </Button>
                    </div>

                    <Separator />

                    <p className="mt-4 text-center text-xs text-muted-foreground">
                        {t("sidebar.credits", {
                            names: "Milo Montuori, Louis Lecouturier et Louis Soltysiak",
                        })}
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
                            {t("sidebar.contribute")}
                        </a>
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
