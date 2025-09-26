import { Card } from "@/components/ui/card";
import { Absence } from "@/types/aurion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
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
            className="border-none bg-white shadow-md transition-shadow dark:bg-mauria-card"
        >
            <div className="flex p-4 items-center h-full">
                <div className="w-20 mr-4 items-center justify-center text-center">
                    <div className="text-2xl font-bold text-mauria-accent dark:text-mauria-accent">
                        {absence.duration.replace(":", "h") ?? absence.duration}
                    </div>
                </div>
                <div className="flex-1">
                    <div
                        className={`text-lg font-medium ${
                            absence.type.toLowerCase().includes("non")
                                ? "text-mauria-accent"
                                : "text-mauria-purple"
                        } dark:text-white`}
                    >
                        {absence.type}
                    </div>
                    <div className="text-foreground">{absence.class}</div>
                    <div className="text-sm text-muted-foreground">
                        {(() => {
                            const [day, month, year] = absence.date.split("/");
                            const date = new Date(
                                parseInt(year),
                                parseInt(month) - 1,
                                parseInt(day)
                            );
                            return format(date, "EEEE d MMM", { locale: fr });
                        })()}
                        {", "}
                        {absence.time}
                    </div>
                </div>
            </div>
        </MotionCard>
    );
}
