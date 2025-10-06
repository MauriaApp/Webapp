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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";
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
                                <div className="flex flex-col items-start">
                                    <Label className="cursor-default text-left">
                                        {t("sidebar.themeParameter.title")}
                                    </Label>
                                    <span className="text-xs text-muted-foreground text-left">
                                        {themeLabel}
                                    </span>
                                </div>
                            </div>
                            <div className="ml-auto w-full max-w-[calc(100%-8em)]">
                                <Select
                                    value={theme}
                                    onValueChange={(value) =>
                                        value && setTheme(value as typeof theme)
                                    }
                                >
                                    <SelectTrigger
                                        className="h-8 w-full justify-between rounded-md border border-border/50 px-2 text-xs"
                                        aria-label={
                                            t("sidebar.themeParameter.title") ??
                                            "Choose theme"
                                        }
                                    >
                                        <SelectValue
                                            placeholder={
                                                t("sidebar.themeParameter.title") ??
                                                "Choose theme"
                                            }
                                        />
                                    </SelectTrigger>
                                    <SelectContent className="text-xs">
                                        <SelectItem value="light">
                                            {t("sidebar.themeParameter.light")}
                                        </SelectItem>
                                        <SelectItem value="dark">
                                            {t("sidebar.themeParameter.dark")}
                                        </SelectItem>
                                        <SelectItem value="oled">
                                            {t("sidebar.themeParameter.oled")}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 [&_svg]:size-7!">
                                <Wallpaper className="h-5 w-5" />
                                <div className="flex flex-col items-start">
                                    <Label className="cursor-default text-left">
                                        {t("sidebar.backgroundParameter.title")}
                                    </Label>
                                    <span className="text-xs text-muted-foreground text-left">
                                        {selectedBackgroundLabel}
                                    </span>
                                </div>
                            </div>
                            <div className="ml-auto w-full max-w-[calc(100%-8em)]">
                                <Select
                                    value={background}
                                    onValueChange={handleBackgroundChange}
                                >
                                    <SelectTrigger
                                        className="h-8 w-full justify-between rounded-md border border-border/50 px-2 text-xs"
                                        aria-label={
                                            t("sidebar.backgroundParameter.title") ??
                                            "Choose background"
                                        }
                                    >
                                        <SelectValue
                                            placeholder={
                                                t("sidebar.backgroundParameter.title") ??
                                                "Choose background"
                                            }
                                        />
                                    </SelectTrigger>
                                    <SelectContent className="text-xs">
                                        {BACKGROUND_OPTIONS.map((option) => (
                                            <SelectItem key={option} value={option}>
                                                {t(`sidebar.backgroundParameter.${option}`)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                            <div className="flex shrink-0 items-center gap-3 [&_svg]:size-7!">
                                <ImageUpscale className="h-5 w-5" />
                                <div className="flex flex-col items-start">
                                    <Label className="cursor-default text-left">
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
                            <div className="ml-auto w-full max-w-[calc(100%-8em)]">
                                <Select
                                    value={size}
                                    onValueChange={(v) =>
                                        v && setSize(v as SizeOption)
                                    }
                                >
                                    <SelectTrigger
                                        className="h-8 w-full justify-between rounded-md border border-border/50 px-2 text-xs"
                                        aria-label={
                                            t("sidebar.sizeParameter.aria") ??
                                            "Choose size"
                                        }
                                    >
                                        <SelectValue
                                            placeholder={
                                                t("sidebar.sizeParameter.title") ??
                                                "Choose size"
                                            }
                                        />
                                    </SelectTrigger>
                                    <SelectContent className="text-xs">
                                        <SelectItem value="petit">
                                            {t("sidebar.sizeParameter.small")}
                                        </SelectItem>
                                        <SelectItem value="moyen">
                                            {t("sidebar.sizeParameter.medium")}
                                        </SelectItem>
                                        <SelectItem value="grand">
                                            {t("sidebar.sizeParameter.large")}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            <div className="flex shrink-0 items-center gap-3 [&_svg]:size-7!">
                                <Languages className="h-5 w-5" />
                                <div className="flex flex-col items-start">
                                    <Label className="cursor-default text-left">
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
                            <div className="ml-auto w-full max-w-[calc(100%-8em)]">
                                <Select
                                    value={locale}
                                    onValueChange={(v) =>
                                        v && setLocale(v as LocaleOption)
                                    }
                                >
                                    <SelectTrigger
                                        className="h-8 w-full justify-between rounded-md border border-border/50 px-2 text-xs"
                                        aria-label={
                                            t("sidebar.languageParameter.title") ??
                                            "Choose language"
                                        }
                                    >
                                        <SelectValue
                                            placeholder={
                                                t("sidebar.languageParameter.title") ??
                                                "Choose language"
                                            }
                                        />
                                    </SelectTrigger>
                                    <SelectContent className="text-xs">
                                        <SelectItem value="fr-FR">
                                            {t("sidebar.languageParameter.fr-FR")}
                                        </SelectItem>
                                        <SelectItem value="en-US">
                                            {t("sidebar.languageParameter.en-US")}
                                        </SelectItem>
                                        <SelectItem value="es-ES">
                                            {t("sidebar.languageParameter.es-ES")}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Separator />

                        <Button
                            variant="ghost"
                            size="sm"
                            className="group w-full justify-start gap-3 px-0 h-10 [&_svg]:size-7"
                            onClick={() => handleNavigate("/associations")}
                        >
                            <HeartHandshake className="h-5 w-5" />
                            {t("sidebar.actions.associations")}
                            <div className="justify-end flex-1 flex pr-2 text-muted-foreground transition-colors group-hover:text-accent-foreground">
                                <ArrowDownRightFromSquare className="size-4!" />
                            </div>
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            className="group w-full justify-start gap-3 px-0 h-10 [&_svg]:size-7"
                            onClick={() =>
                                window.open(
                                    "https://aurion.junia.com",
                                    "_blank"
                                )
                            }
                        >
                            <ThumbsDown className="h-5 w-5" />
                            {t("sidebar.actions.aurion")}
                            <div className="justify-end flex-1 flex pr-2 text-muted-foreground transition-colors group-hover:text-accent-foreground">
                                <ArrowDownRightFromSquare className="size-4!" />
                            </div>
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            className="group w-full justify-start gap-3 px-0 h-10 [&_svg]:size-7"
                            onClick={() =>
                                window.open(
                                    "https://junia-learning.com",
                                    "_blank"
                                )
                            }
                        >
                            <Book className="h-5 w-5" />
                            {t("sidebar.actions.juniaLearning")}
                            <div className="justify-end flex-1 flex pr-2 text-muted-foreground transition-colors group-hover:text-accent-foreground">
                                <ArrowDownRightFromSquare className="size-4!" />
                            </div>
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            className="group w-full justify-start gap-3 px-0 h-10 [&_svg]:size-7"
                            onClick={() =>
                                window.open(
                                    "https://print.junia.com/end-user/ui/dashboard",
                                    "_blank"
                                )
                            }
                        >
                            <Printer className="h-5 w-5" />
                            {t("sidebar.actions.print")}
                            <div className="justify-end flex-1 flex pr-2 text-muted-foreground transition-colors group-hover:text-accent-foreground">
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
                            className="group w-full justify-start gap-3 px-0 h-10 [&_svg]:size-7"
                            onClick={() =>
                                window.open(
                                    "mailto:milo.montuori@student.junia.com",
                                    "_blank"
                                )
                            }
                        >
                            <MailQuestionMark className="h-5 w-5" />
                            {t("sidebar.help")}
                            <div className="justify-end flex-1 flex pr-2 text-muted-foreground transition-colors group-hover:text-accent-foreground">
                                <ArrowDownRightFromSquare className="size-4!" />
                            </div>
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            className="group w-full justify-start gap-3 px-0 h-10 [&_svg]:size-7 text-red-500 oled:text-gray-200"
                            onClick={signOut}
                        >
                            <BadgeX className="h-5 w-5" />
                            {t("sidebar.logOut")}
                            <div className="justify-end flex-1 flex pr-2 text-red-500 oled:text-gray-300 transition-colors group-hover:text-accent-foreground oled:group-hover:text-gray-100">
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
