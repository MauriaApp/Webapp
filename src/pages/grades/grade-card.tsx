import { Card } from "@/components/ui/card";
import { Grade } from "@/types/aurion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";

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

export function GradeCard({
    grade,
    onGradeClick,
}: {
    grade: Grade;
    onGradeClick: (grade: Grade) => void;
}) {
    return (
        <MotionCard
            layout
            variants={gradeVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className="border-none bg-white shadow-md transition-shadow dark:bg-mauria-dark-card"
            onClick={onGradeClick.bind(null, grade)}
        >
            <div className="flex p-4 items-center h-full">
                <div className="mr-4 w-20 ">
                    <div className="text-2xl font-bold text-mauria-light-accent dark:text-mauria-dark-accent">
                        {grade.grade}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        Coef {grade.coefficient}
                    </div>
                </div>
                <div className="flex-1">
                    <div className="text-lg font-medium text-mauria-light-purple dark:text-white">
                        {grade.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
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
                    </div>
                </div>
            </div>
        </MotionCard>
    );
}
