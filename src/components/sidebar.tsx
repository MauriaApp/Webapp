/* eslint-disable i18next/no-literal-string */
"use client";

import { useEffect, useState, type CSSProperties } from "react";
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
import {
    useBackground,
    BACKGROUND_OPTIONS,
    type BackgroundName,
} from "@/components/background-provider";
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

const aurionURL = "https://aurion.junia.com";
const juniaLearningURL = "https://junia-learning.com";
const printURL = "https://print.junia.com/end-user/ui/dashboard";
const contactURL = "mailto:milo.montuori@student.junia.com";
const githubURL = "https://github.com/MauriaApp";
const preprodURL = "https://mauria-preprod.fly.dev";

export default function Sidebar() {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const { theme, setTheme } = useTheme();

    const { background, setBackground } = useBackground();
    const selectedBackgroundLabel = t(
        `sidebar.backgroundParameter.${background}`
    );

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

    const selectors = [
        {
            icon: ThemeIcon,
            title: t("sidebar.themeParameter.title"),
            value: themeLabel,
            selectValue: theme,
            onValueChange: (value: string) =>
                value && setTheme(value as typeof theme),
            options: [
                {
                    value: "light",
                    label: t("sidebar.themeParameter.light"),
                },
                {
                    value: "dark",
                    label: t("sidebar.themeParameter.dark"),
                },
                {
                    value: "oled",
                    label: t("sidebar.themeParameter.oled"),
                },
            ],
        },
        {
            icon: Wallpaper,
            title: t("sidebar.backgroundParameter.title"),
            value: selectedBackgroundLabel,
            selectValue: background,
            onValueChange: handleBackgroundChange,
            options: BACKGROUND_OPTIONS.map((option) => ({
                value: option,
                label: t(`sidebar.backgroundParameter.${option}`),
            })),
        },
        {
            icon: ImageUpscale,
            title: t("sidebar.sizeParameter.title"),
            value:
                size === "petit"
                    ? t("sidebar.sizeParameter.small")
                    : size === "moyen"
                    ? t("sidebar.sizeParameter.medium")
                    : t("sidebar.sizeParameter.large"),
            selectValue: size,
            onValueChange: (v: string) => v && setSize(v as SizeOption),
            options: [
                {
                    value: "petit",
                    label: t("sidebar.sizeParameter.small"),
                },
                {
                    value: "moyen",
                    label: t("sidebar.sizeParameter.medium"),
                },
                {
                    value: "grand",
                    label: t("sidebar.sizeParameter.large"),
                },
            ],
        },
        {
            icon: Languages,
            title: t("sidebar.languageParameter.title"),
            value:
                locale === "fr-FR"
                    ? t("sidebar.languageParameter.fr-FR")
                    : t("sidebar.languageParameter.en-US"),
            selectValue: locale,
            onValueChange: (v: string) => v && setLocale(v as LocaleOption),
            options: [
                {
                    value: "fr-FR",
                    label: t("sidebar.languageParameter.fr-FR"),
                },
                {
                    value: "en-US",
                    label: t("sidebar.languageParameter.en-US"),
                },
                {
                    value: "es-ES",
                    label: t("sidebar.languageParameter.es-ES"),
                },
            ],
        },
    ];

    const navigate = useNavigate();

    const handleNavigate = (path: string) => {
        setOpen(false);
        navigate(path);
    };

    const signOut = () => {
        clearStorage();
        handleNavigate("/login");
    };

    const handleModeBeta = () => {
        window.parent.postMessage(
            { type: "MODE_BETA", payload: preprodURL },
            "*"
        );
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
                className="w-[85%] sm:max-w-sm flex flex-col justify-between border-none oled:bg-black px-5 pb-5 pt-[var(--sidebar-safe-area-top)]"
                style={
                    {
                    "--sidebar-safe-area-top": "calc(var(--safe-area-top) + 12px)",
                    "--sheet-close-top": "calc(var(--safe-area-top) + 14px)",
                    "--sheet-close-right": "24px",
                    } as CSSProperties
                }
            >
                <SheetHeader>
                    <SheetTitle>{t("sidebar.title")}</SheetTitle>

                    <div className="mt-4 space-y-4">
                        {selectors.map((setting, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between gap-4"
                            >
                                <div className="flex items-center gap-3 [&_svg]:size-7!">
                                    <setting.icon className="h-5 w-5" />
                                    <div className="flex flex-col items-start">
                                        <Label className="cursor-default text-left">
                                            {setting.title}
                                        </Label>
                                        <span className="text-xs text-muted-foreground text-left">
                                            {setting.value}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex w-full justify-end">
                                    <Select
                                        value={setting.selectValue}
                                        onValueChange={setting.onValueChange}
                                    >
                                        <SelectTrigger
                                            className="h-8 w-[150px] justify-between rounded-md border border-border/50 px-2 text-xs "
                                            aria-label={setting.title}
                                        >
                                            <SelectValue
                                                placeholder={setting.title}
                                                className="!items-end flex"
                                            />
                                        </SelectTrigger>
                                        <SelectContent className="text-xs">
                                            {setting.options.map((option) => (
                                                <SelectItem
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        ))}

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
                            onClick={() => window.open(aurionURL, "_blank")}
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
                                window.open(juniaLearningURL, "_blank")
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
                            onClick={() => window.open(printURL, "_blank")}
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
                            onClick={() => window.open(contactURL, "_blank")}
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
                        <span>Version 3.1.0</span>
                        <span className="mx-1">—</span>
                        <a
                            href={githubURL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline underline-offset-4"
                        >
                            {t("sidebar.contribute")}
                        </a>
                        <span className="ml-1">—</span>
                        <Button
                            variant="link"
                            size="sm"
                            className="p-0 ml-2"
                            onClick={handleModeBeta}
                        >
                            <span className="text-xs text-muted-foreground">
                                <span className="">mode Beta</span>
                            </span>
                        </Button>
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
