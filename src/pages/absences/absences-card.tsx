import { Card } from "@/components/ui/card";
import { Absence } from "@/types/aurion";
import { motion } from "framer-motion";

const MotionCard = motion(Card);

const absenceVariants = {
    hidden: { opacity: 0, y: 18, scale: 0.98 },
    show: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const },
    },
    exit: {
        opacity: 0,
        y: -16,
        scale: 0.98,
        transition: { duration: 0.22, ease: [0.4, 0, 0.2, 1] as const },
    },
};
export function AbsenceCard({ absence }: { absence: Absence }) {
    return (
        <MotionCard
            layout
            variants={absenceVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className="border-none bg-white p-4 shadow-md transition-shadow dark:bg-mauria-dark-card"
        >
            {" "}
            <div className="flex">
                <div className="w-20 mr-4">
                    <div className="text-2xl font-bold text-mauria-light-accent dark:text-mauria-dark-accent">
                        {absence.duration}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        {absence.time}
                    </div>
                </div>
                <div className="flex-1">
                    <div
                        className={`text-lg font-medium ${
                            absence.type.toLowerCase().includes("non")
                                ? "text-mauria-light-accent"
                                : "text-mauria-light-purple"
                        } dark:text-white`}
                    >
                        {absence.type}
                    </div>
                    <div className="text-gray-700 dark:text-gray-300">
                        {absence.class}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        {absence.date}
                    </div>
                </div>
            </div>
        </MotionCard>
    );
}
