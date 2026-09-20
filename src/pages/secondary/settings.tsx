import { useEffect, useState } from "react";
import {
    Rainbow,
    Cherry,
    Moon,
    Sun,
    MoonStar,
    TreePine,
    Waves,
    ImageUpscale,
    Languages,
    Wallpaper,
    UtensilsCrossed,
    TriangleAlert,
    Dices,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    useBackground,
    BACKGROUND_OPTIONS,
    type BackgroundName,
} from "@/components/background-provider";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import { applyScale, readInitialSize } from "@/lib/utils/scale";
import type { SizeOption } from "@/lib/utils/scale";
import {
    applyLocale,
    readInitialLocale,
    type LocaleOption,
} from "@/lib/utils/translations";
import {
    GRADE_REVEAL_MODES,
    setGradeRevealMode,
    useGradeRevealMode,
    type GradeRevealMode,
} from "@/lib/utils/experimental";
import { resetGradeTracking } from "@/lib/utils/unopened-grades";
import {
    readRestaurantCampus,
    setRestaurantCampus,
    RESTAURANT_CAMPUS_OPTIONS,
    type RestaurantCampus,
} from "@/lib/utils/restaurant-menu";

export function SettingsPage() {
    const { t } = useTranslation();
    const { theme, setTheme } = useTheme();
    const gradeRevealMode = useGradeRevealMode();
    const { background, setBackground } = useBackground();
    const selectedBackgroundLabel = t(
        `sidebar.backgroundParameter.${background}`
    );

    const handleGradeRevealModeChange = (value: string) => {
        if (!GRADE_REVEAL_MODES.includes(value as GradeRevealMode)) return;

        const mode = value as GradeRevealMode;
        setGradeRevealMode(mode);
        // Switching between two effects keeps the grades waiting to be opened,
        // only leaving or entering "off" starts from a clean slate
        if ((gradeRevealMode === "off") !== (mode === "off")) {
            resetGradeTracking();
        }
    };

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
        cherry: { Icon: Cherry, label: t("sidebar.themeParameter.cherry") },
        ocean: { Icon: Waves, label: t("sidebar.themeParameter.ocean") },
        forest: { Icon: TreePine, label: t("sidebar.themeParameter.forest") },
        pride: { Icon: Rainbow, label: t("sidebar.themeParameter.pride") },
    } as const;

    const { Icon: ThemeIcon, label: themeLabel } =
        themeDisplay[theme] ?? themeDisplay.light;

    const [size, setSize] = useState<SizeOption>(readInitialSize);
    const [locale, setLocale] = useState<LocaleOption>(readInitialLocale);
    const [restaurantCampus, setRestaurantCampusState] =
        useState<RestaurantCampus>(readRestaurantCampus);

    const handleRestaurantCampusChange = (value: string) => {
        if (!value) return;
        const campus = value as RestaurantCampus;
        setRestaurantCampusState(campus);
        setRestaurantCampus(campus);
    };

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
                {
                    value: "cherry",
                    label: t("sidebar.themeParameter.cherry"),
                },
                {
                    value: "ocean",
                    label: t("sidebar.themeParameter.ocean"),
                },
                {
                    value: "forest",
                    label: t("sidebar.themeParameter.forest"),
                },
                {
                    value: "pride",
                    label: t("sidebar.themeParameter.pride"),
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
        {
            icon: UtensilsCrossed,
            title: t("sidebar.restaurantParameter.title"),
            value: t(`sidebar.restaurantParameter.${restaurantCampus}`),
            selectValue: restaurantCampus,
            onValueChange: handleRestaurantCampusChange,
            options: RESTAURANT_CAMPUS_OPTIONS.map((option) => ({
                value: option,
                label: t(`sidebar.restaurantParameter.${option}`),
            })),
        },
    ];

    return (
        <div className="space-y-4 pt-4 pb-4">
            {selectors.map((setting, index) => (
                <div
                    key={index}
                    className="flex items-center justify-between gap-4"
                >
                    <div className="flex min-w-0 flex-1 items-center gap-3 [&_svg]:size-7!">
                        <setting.icon className="h-5 w-5 shrink-0" />
                        <div className="flex min-w-0 flex-col items-start">
                            <Label className="cursor-default text-left">
                                {setting.title}
                            </Label>
                            <span className="text-xs text-muted-foreground text-left">
                                {setting.value}
                            </span>
                        </div>
                    </div>
                    <div className="flex shrink-0 justify-end">
                        <Select
                            value={setting.selectValue}
                            onValueChange={setting.onValueChange}
                        >
                            <SelectTrigger
                                className="h-8 w-[150px] justify-between rounded-md border border-border/50 px-2 text-xs focus:ring-0 focus:ring-offset-0"
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

            <div className="flex items-center justify-center gap-3 text-amber-500">
                <TriangleAlert className="size-5 animate-pulse" />
                <h2 className="text-sm font-semibold uppercase tracking-wide">
                    {t("settingsPage.experimental")}
                </h2>
                <TriangleAlert className="size-5 animate-pulse" />
            </div>

            <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 flex-1 items-center gap-3 [&_svg]:size-7!">
                    <Dices className="h-5 w-5 shrink-0" />
                    <div className="flex min-w-0 flex-col items-start">
                        <Label className="cursor-default text-left">
                            {t("settingsPage.gradeRevealMode.title")}
                        </Label>
                        <span className="text-xs text-muted-foreground text-left">
                            {t(
                                `settingsPage.gradeRevealMode.${gradeRevealMode}`
                            )}
                        </span>
                    </div>
                </div>
                <div className="flex shrink-0 justify-end">
                    <Select
                        value={gradeRevealMode}
                        onValueChange={handleGradeRevealModeChange}
                    >
                        <SelectTrigger
                            className="h-8 w-[150px] justify-between rounded-md border border-border/50 px-2 text-xs focus:ring-0 focus:ring-offset-0"
                            aria-label={t("settingsPage.gradeRevealMode.title")}
                        >
                            <SelectValue
                                placeholder={t(
                                    "settingsPage.gradeRevealMode.title"
                                )}
                                className="!items-end flex"
                            />
                        </SelectTrigger>
                        <SelectContent className="text-xs">
                            {GRADE_REVEAL_MODES.map((mode) => (
                                <SelectItem key={mode} value={mode}>
                                    {t(`settingsPage.gradeRevealMode.${mode}`)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}
