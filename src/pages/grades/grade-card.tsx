import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Grade } from "@/types/aurion";
import { format } from "date-fns";
import { getDateLocale } from "@/lib/utils/translations";
import { motion } from "framer-motion";
import { ChevronsRight, SquareArrowOutDownRightIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getGradeBadgeInfoFromCode } from "@/lib/utils/grades";
import { fadeInIndexed } from "@/lib/motion";
import type { GradeRevealMode } from "@/lib/utils/experimental";
import { REVEAL_CARD_THEMES } from "./reveal/reveal-theme";

const MotionCard = motion(Card);

function parseGradeNum(val?: string | null): number {
    if (!val) return NaN;
    return parseFloat(val.replace(",", "."));
}

export function GradeCardAnimate({
    grade,
    onGradeClick,
    index = 0,
}: {
    grade: Grade;
    onGradeClick: (grade: Grade) => void;
    index?: number;
}) {
    const { t, i18n } = useTranslation();
    const gradeNum = parseGradeNum(grade.grade);
    const avgNum = parseGradeNum(grade.average);
    const gradeColor =
        !isNaN(gradeNum) && !isNaN(avgNum)
            ? gradeNum >= avgNum
                ? "text-green-700/70 dark:text-green-400/60 oled:text-green-300/65"
                : "text-amber-700/70 dark:text-amber-400/60 oled:text-amber-400/60"
            : "text-mauria-accent dark:text-mauria-accent";
    return (
        <MotionCard
            layout
            variants={fadeInIndexed}
            custom={index}
            initial="hidden"
            animate="show"
            exit="exit"
            className="relative cursor-pointer border-none bg-white shadow-md transition-transform duration-150 hover:-translate-y-0.5 dark:bg-mauria-card p-4 h-full overflow-visible"
            onClick={onGradeClick.bind(null, grade)}
        >
            <div className="flex items-center ">
                <div className="mr-4 w-20 items-center justify-center text-center">
                    <div className="inline-flex items-start">
                        <span className={`text-2xl font-bold ${gradeColor}`}>
                            {grade.grade}
                        </span>
                        {grade.coefficient && (
                            <span className="ml-0.5 mt-1 text-[10px] font-medium text-gray-400 dark:text-gray-500">
                                ×{grade.coefficient}
                            </span>
                        )}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        {grade.average
                            ? `${t("gradesPage.avgShort")} ${grade.average}`
                            : ""}
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0 truncate text-lg font-medium text-black dark:text-white">
                            {grade.name}
                        </div>
                        <GradeTypeBadge code={grade.code} />
                    </div>
                    <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                        <p>
                            {grade.date
                                ? format(
                                      new Date(
                                          grade.date
                                              .split("/")
                                              .reverse()
                                              .join("-")
                                      ),
                                      "EEEE d MMM yyyy",
                                      { locale: getDateLocale(i18n.language) }
                                  )
                                : t("gradesPage.dateNotSpecified")}
                        </p>
                        <div className="mb-0 flex items-end justify-end">
                            <SquareArrowOutDownRightIcon className="text-muted-foreground/50 h-3 w-3" />
                        </div>
                    </div>
                </div>
            </div>
        </MotionCard>
    );
}

export function GradeCard({
    grade,
    onGradeClick,
}: {
    grade: Grade;
    onGradeClick: (grade: Grade) => void;
}) {
    const { t, i18n } = useTranslation();
    const gradeNum = parseGradeNum(grade.grade);
    const avgNum = parseGradeNum(grade.average);
    const gradeColor =
        !isNaN(gradeNum) && !isNaN(avgNum)
            ? gradeNum >= avgNum
                ? "text-green-700/70 dark:text-green-400/60 oled:text-green-300/65"
                : "text-amber-700/70 dark:text-amber-400/60 oled:text-amber-400/60"
            : "text-mauria-accent dark:text-mauria-accent";

    return (
        <Card
            className="relative cursor-pointer border-none bg-white shadow-md transition-transform duration-150 hover:-translate-y-0.5 dark:bg-mauria-card p-4 h-full overflow-visible"
            onClick={onGradeClick.bind(null, grade)}
        >
            <div className="flex items-center ">
                <div className="mr-4 w-20 items-center justify-center text-center">
                    <div className="inline-flex items-start">
                        <span className={`text-2xl font-bold ${gradeColor}`}>
                            {grade.grade}
                        </span>
                        {grade.coefficient && (
                            <span className="ml-0.5 mt-1 text-[10px] font-medium text-gray-400 dark:text-gray-500">
                                ×{grade.coefficient}
                            </span>
                        )}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        {grade.average
                            ? `${t("gradesPage.avgShort")} ${grade.average}`
                            : ""}
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0 truncate text-lg font-medium text-black dark:text-white">
                            {grade.name}
                        </div>
                        <GradeTypeBadge code={grade.code} />
                    </div>
                    <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                        <p>
                            {grade.date
                                ? format(
                                      new Date(
                                          grade.date
                                              .split("/")
                                              .reverse()
                                              .join("-")
                                      ),
                                      "EEEE d MMM yyyy",
                                      { locale: getDateLocale(i18n.language) }
                                  )
                                : t("gradesPage.dateNotSpecified")}
                        </p>
                        <div className="mb-0 flex items-end justify-end">
                            <SquareArrowOutDownRightIcon className="text-muted-foreground/50 h-3 w-3" />
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}

// Same layout as the grade cards, dressed up by the active reveal mode
export function UnopenedGradeCard({
    grade,
    mode,
    onOpen,
    index = 0,
}: {
    grade: Grade;
    mode: Exclude<GradeRevealMode, "off">;
    onOpen: (grade: Grade) => void;
    index?: number;
}) {
    const { t, i18n } = useTranslation();
    const theme = REVEAL_CARD_THEMES[mode];
    const CaseIcon = theme.icon;
    const badgeInfo = grade.code?.trim()
        ? getGradeBadgeInfoFromCode(grade.code)
        : null;

    return (
        <MotionCard
            layout
            variants={fadeInIndexed}
            custom={Math.min(index, 8)}
            initial="hidden"
            animate="show"
            exit="exit"
            className="reveal-card relative cursor-pointer border-none bg-white shadow-md transition-transform duration-150 hover:-translate-y-0.5 dark:bg-mauria-card p-4 h-full overflow-visible"
            onClick={onOpen.bind(null, grade)}
        >
            <div
                className={`${theme.caseClass} pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]`}
            >
                <span
                    className={`absolute left-1 top-1 size-2.5 rounded-tl-sm border-l-2 border-t-2 ${theme.cornerClass}`}
                />
                <span
                    className={`absolute right-1 top-1 size-2.5 rounded-tr-sm border-r-2 border-t-2 ${theme.cornerClass}`}
                />
                <span
                    className={`absolute bottom-1 left-1 size-2.5 rounded-bl-sm border-b-2 border-l-2 ${theme.cornerClass}`}
                />
                <span
                    className={`absolute bottom-1 right-1 size-2.5 rounded-br-sm border-b-2 border-r-2 ${theme.cornerClass}`}
                />
            </div>
            <div className="relative flex items-center">
                <div className="mr-4 w-20 items-center justify-center text-center">
                    <CaseIcon
                        className={`reveal-icon mx-auto size-8 ${theme.iconClass}`}
                    />
                    <div
                        className={`font-mono text-sm font-bold leading-5 tracking-[0.2em] ${theme.valueClass}`}
                    >
                        ??/20
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0 truncate text-lg font-medium text-white">
                            {grade.name}
                        </div>
                        {badgeInfo?.labelKey && (
                            <span
                                className={`max-w-[38%] shrink-0 truncate rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase leading-none tracking-widest ${theme.badgeClass}`}
                            >
                                {t(badgeInfo.labelKey)}
                            </span>
                        )}
                    </div>
                    <div className="flex h-5 items-center justify-between gap-2 text-sm text-zinc-500">
                        <span
                            className={`inline-flex h-5 shrink-0 items-center gap-1 whitespace-nowrap pl-1.5 pr-2.5 text-[10px] font-extrabold uppercase leading-none tracking-wide [clip-path:polygon(0_0,calc(100%-6px)_0,100%_50%,calc(100%-6px)_100%,0_100%)] ${theme.ctaClass}`}
                        >
                            <ChevronsRight className="size-3 shrink-0 animate-pulse" />
                            <span className="sm:hidden">
                                {t(theme.ctaShortKey)}
                            </span>
                            <span className="hidden sm:inline">
                                {t(theme.ctaKey)}
                            </span>
                        </span>
                        <p
                            className={`min-w-0 truncate font-mono text-[11px] uppercase tracking-wide ${theme.dateClass}`}
                        >
                            {grade.date
                                ? format(
                                      new Date(
                                          grade.date
                                              .split("/")
                                              .reverse()
                                              .join("-")
                                      ),
                                      "d MMM yyyy",
                                      { locale: getDateLocale(i18n.language) }
                                  )
                                : ""}
                        </p>
                    </div>
                </div>
            </div>
        </MotionCard>
    );
}

const GradeTypeBadge = ({ code }: { code?: string | null }) => {
    const { t } = useTranslation();
    if (!code?.trim()) return null;

    const badgeInfo = getGradeBadgeInfoFromCode(code);
    if (!badgeInfo?.labelKey) return null;

    return (
        <Badge
            data-grade-code={badgeInfo?.rawCode ?? code}
            className="pointer-events-none shrink-0 rounded-md bg-mauria-accent/20 px-2 py-1 text-xs font-medium text-black dark:text-white whitespace-nowrap"
        >
            {t(badgeInfo.labelKey)}
        </Badge>
    );
};
