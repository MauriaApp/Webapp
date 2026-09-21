/* eslint-disable i18next/no-literal-string */
"use client";

import { useEffect, useState, type CSSProperties } from "react";
import {
    Menu,
    HeartHandshake,
    BadgeX,
    ThumbsDown,
    Book,
    Printer,
    FileText,
    Radar,
    MailQuestionMark,
    ArrowDownRightFromSquare,
    Settings,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
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
import { clearStorage } from "@/lib/utils/storage";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchUpdates } from "@/lib/api/supa";
import { useTranslation } from "react-i18next";

import { applyLocale, readInitialLocale } from "@/lib/utils/translations";

const aurionURL = "https://aurion.junia.com";
const juniaLearningURL = "https://junia-learning.com";
const contactURL =
    "mailto:louis.soltysiak@student.junia.com?subject=" +
    encodeURIComponent("Support/feature pour Mauria");
const githubURL = "https://github.com/MauriaApp";
// const preprodURL = "https://mauria-preprod.fly.dev";

export default function Sidebar() {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const { setTheme } = useTheme();
    const { data: updates } = useQuery({
        queryKey: ["updates"],
        queryFn: fetchUpdates,
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 60 * 24,
    });
    const appVersion = updates?.[0]?.version ?? "?";

    useEffect(() => {
        applyScale(readInitialSize());
        applyLocale(readInitialLocale());
    }, []);

    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const handleNavigate = (path: string) => {
        setOpen(false);
        navigate(path);
    };

    const signOut = () => {
        setTheme("light");
        clearStorage();
        queryClient.clear();
        handleNavigate("/login");
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-white [&_svg]:size-7! hover:bg-white/15 hover:text-white"
                >
                    <Menu />
                    <span className="sr-only">{t("sidebar.openMenu")}</span>
                </Button>
            </SheetTrigger>

            <SheetContent
                side="right"
                className="w-[85%] sm:max-w-sm flex flex-col gap-2 border-none oled:bg-black px-5 pb-5 pt-[var(--sidebar-safe-area-top)]"
                style={
                    {
                        "--sidebar-safe-area-top":
                            "calc(var(--safe-area-top) + 12px)",
                        "--sheet-close-top":
                            "calc(var(--safe-area-top) + 14px)",
                        "--sheet-close-right": "24px",
                    } as CSSProperties
                }
            >
                <SheetHeader className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-6 [mask-image:linear-gradient(to_bottom,black_calc(100%-1.5rem),transparent)]">
                    <SheetTitle>{t("sidebar.title")}</SheetTitle>

                    <div className="mt-4 space-y-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="group w-full justify-start gap-3 px-0 h-10 [&_svg]:size-7 hover:bg-mauria-purple/10 dark:hover:bg-white/10 oled:hover:bg-white/10"
                            onClick={() => handleNavigate("/settings")}
                        >
                            <Settings className="h-5 w-5" />
                            {t("sidebar.actions.settings")}
                        </Button>

                        <Separator />

                        <Button
                            variant="ghost"
                            size="sm"
                            className="group w-full justify-start gap-3 px-0 h-10 [&_svg]:size-7 hover:bg-mauria-purple/10 dark:hover:bg-white/10 oled:hover:bg-white/10"
                            onClick={() => handleNavigate("/associations")}
                        >
                            <HeartHandshake className="h-5 w-5" />
                            {t("sidebar.actions.associations")}
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            className="group w-full justify-start gap-3 px-0 h-10 [&_svg]:size-7 hover:bg-mauria-purple/10 dark:hover:bg-white/10 oled:hover:bg-white/10"
                            onClick={() => handleNavigate("/documents")}
                        >
                            <FileText className="h-5 w-5" />
                            <span className="inline-flex items-center gap-1.5">
                                {t("sidebar.actions.documents")}
                                <Badge
                                    variant="secondary"
                                    className="px-1.5 py-0 text-[10px] font-semibold"
                                >
                                    Beta
                                </Badge>
                            </span>
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            className="group w-full justify-start gap-3 px-0 h-10 [&_svg]:size-7 hover:bg-mauria-purple/10 dark:hover:bg-white/10 oled:hover:bg-white/10"
                            onClick={() => handleNavigate("/print")}
                        >
                            <Printer className="h-5 w-5" />
                            {t("sidebar.actions.print")}
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            className="group w-full justify-start gap-3 px-0 h-10 [&_svg]:size-7 hover:bg-mauria-purple/10 dark:hover:bg-white/10 oled:hover:bg-white/10"
                            onClick={() => handleNavigate("/palantir")}
                        >
                            <Radar className="h-5 w-5" />
                            <span className="inline-flex items-center gap-1.5">
                                {t("sidebar.actions.palantir")}
                                <Badge
                                    variant="secondary"
                                    className="px-1.5 py-0 text-[10px] font-semibold"
                                >
                                    Beta
                                </Badge>
                            </span>
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            className="group w-full justify-start gap-3 px-0 h-10 [&_svg]:size-7 hover:bg-mauria-purple/10 dark:hover:bg-white/10 oled:hover:bg-white/10"
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
                            className="group w-full justify-start gap-3 px-0 h-10 [&_svg]:size-7 hover:bg-mauria-purple/10 dark:hover:bg-white/10 oled:hover:bg-white/10"
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
                    </div>
                </SheetHeader>

                <SheetFooter className="relative z-10 shrink-0 flex-col! gap-2 bg-background px-0 oled:bg-black">
                    <div className="w-full mt-4 space-y-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="group w-full justify-start gap-3 px-0 h-10 [&_svg]:size-7 hover:bg-mauria-purple/10 dark:hover:bg-white/10 oled:hover:bg-white/10"
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
                            className="group w-full justify-start gap-3 px-0 h-10 [&_svg]:size-7 text-red-500 oled:text-gray-200 hover:bg-mauria-purple/10 dark:hover:bg-white/10 oled:hover:bg-white/10"
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
                        <button
                            onClick={() => handleNavigate("/versions")}
                            className="underline underline-offset-4"
                        >
                            Version {appVersion}
                        </button>
                        <span className="mx-1">—</span>
                        <a
                            href={githubURL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline underline-offset-4"
                        >
                            {t("sidebar.contribute")}
                        </a>
                        {/* TODO Fix beta link (think how to do this shit) */}
                        {/* <Button
                            variant="link"
                            size="sm"
                            className="p-0 ml-2"
                            onClick={handleModeBeta}
                        >
                            <span className="text-xs text-muted-foreground">
                                <span className="">beta</span>
                            </span>
                        </Button> 
                        <span className="ml-1">—</span>*/}
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
