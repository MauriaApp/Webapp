import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Grade } from "@/types/aurion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";
import { SquareArrowOutDownRightIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getGradeBadgeInfoFromCode } from "@/lib/utils/grades";

const MotionCard = motion(Card);

const gradeVariants = {
    hidden: { opacity: 0, y: 16, scale: 0.98 },
    show: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] as const },
    },
    exit: {
        opacity: 0,
        y: -14,
        scale: 0.98,
        transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] as const },
    },
};

export function GradeCardAnimate({
    grade,
    onGradeClick,
}: {
    grade: Grade;
    onGradeClick: (grade: Grade) => void;
}) {
    const { t } = useTranslation();
    return (
        <MotionCard
            layout
            variants={gradeVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className="relative border-none bg-white shadow-md transition-shadow dark:bg-mauria-card p-4 h-full overflow-visible"
            onClick={onGradeClick.bind(null, grade)}
        >
            <GradeTypeBadge code={grade.code} />
            <div className="flex items-center ">
                <div className="mr-4 w-20 items-center justify-center text-center">
                    <div className="text-2xl font-bold text-mauria-accent dark:text-mauria-accent">
                        {grade.grade}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        {t("gradesPage.coef")} {grade.coefficient}
                    </div>
                </div>
                <div className="flex-1">
                    <div className="text-lg font-medium text-black dark:text-white">
                        {grade.name}
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
                                      { locale: fr }
                                  )
                                : "Non spécifiée"}
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
    const { t } = useTranslation();

    return (
        <Card
            className="relative border-none bg-white shadow-md transition-shadow dark:bg-mauria-card p-4 h-full overflow-visible"
            onClick={onGradeClick.bind(null, grade)}
        >
            <GradeTypeBadge code={grade.code} />
            <div className="flex items-center ">
                <div className="mr-4 w-20 items-center justify-center text-center">
                    <div className="text-2xl font-bold text-mauria-accent dark:text-mauria-accent">
                        {grade.grade}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        {t("gradesPage.coef")} {grade.coefficient}
                    </div>
                </div>
                <div className="flex-1">
                    <div className="text-lg font-medium text-black dark:text-white">
                        {grade.name}
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
                                      { locale: fr }
                                  )
                                : "Non spécifiée"}
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
    if (!code?.trim()) return null;

    const badgeInfo = getGradeBadgeInfoFromCode(code);
    if (!badgeInfo?.label) return null;

    return (
        <Badge
            data-grade-code={badgeInfo?.rawCode ?? code}
            className="pointer-events-none absolute right-4 top-4 rounded-md bg-mauria-accent/20 px-2 py-1 text-xs font-medium text-black dark:text-white whitespace-nowrap"
        >
            {badgeInfo.label}
        </Badge>
    );
};
