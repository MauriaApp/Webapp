import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Grade } from "@/types/aurion";
import { format } from "date-fns";
import { getDateLocale } from "@/lib/utils/translations";
import { motion } from "framer-motion";
import { SquareArrowOutDownRightIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getGradeBadgeInfoFromCode } from "@/lib/utils/grades";
import { fadeInIndexed } from "@/lib/motion";

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
            className="relative border-none bg-white shadow-md transition-shadow dark:bg-mauria-card p-4 h-full overflow-visible"
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
            className="relative border-none bg-white shadow-md transition-shadow dark:bg-mauria-card p-4 h-full overflow-visible"
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
