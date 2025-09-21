import { Card } from "@/components/ui/card";
import { Grade } from "@/types/aurion";
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

export function GradeCard({ grade }: { grade: Grade }) {
    return (
        <MotionCard
            layout
            variants={gradeVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className="transition-shadow hover:shadow-md"
        >
            <div className="flex p-4">
                <div className="mr-4 w-20">
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
                        {grade.date}
                    </div>
                </div>
            </div>
        </MotionCard>
    );
}
