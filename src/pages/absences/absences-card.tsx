import { Card } from "@/components/ui/card";
import { Absence } from "@/types/aurion";
import { format } from "date-fns";
import { getDateLocale } from "@/lib/utils/translations";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { fadeInIndexed } from "@/lib/motion";

const MotionCard = motion(Card);
export function AbsenceCardAnimate({
    absence,
    index = 0,
}: {
    absence: Absence;
    index?: number;
}) {
    const { i18n } = useTranslation();
    const locale = getDateLocale(i18n.language);
    const isJustified = !absence.type.toLowerCase().includes("non");
    return (
        <MotionCard
            layout
            variants={fadeInIndexed}
            custom={index}
            initial="hidden"
            animate="show"
            exit="exit"
            className="border-none bg-white shadow-md transition-shadow dark:bg-mauria-card"
        >
            <div className="flex p-4 items-center h-full">
                <div className="w-20 mr-4 items-center justify-center text-center">
                    <div
                        className={`text-2xl font-bold ${isJustified ? "text-green-700/70 dark:text-green-400/60 oled:text-green-300/65" : "text-amber-700/70 dark:text-amber-400/60 oled:text-amber-400/60"}`}
                    >
                        {absence.duration.replace(":", "h") ?? absence.duration}
                    </div>
                </div>
                <div className="flex-1">
                    <div className="text-lg font-medium">{absence.type}</div>
                    <div className="text-foreground">{absence.class}</div>
                    <div className="text-sm text-muted-foreground">
                        {(() => {
                            const [day, month, year] = absence.date.split("/");
                            const fullYear =
                                year.length === 2
                                    ? 2000 + parseInt(year)
                                    : parseInt(year);
                            const date = new Date(
                                fullYear,
                                parseInt(month) - 1,
                                parseInt(day)
                            );
                            return format(date, "EEEE d MMM", { locale });
                        })()}
                        {", "}
                        {absence.time}
                    </div>
                </div>
            </div>
        </MotionCard>
    );
}

export function AbsenceCard({ absence }: { absence: Absence }) {
    const { i18n } = useTranslation();
    const locale = getDateLocale(i18n.language);
    const isJustified = !absence.type.toLowerCase().includes("non");
    return (
        <Card className="border-none bg-white shadow-md transition-shadow dark:bg-mauria-card">
            <div className="flex p-4 items-center h-full">
                <div className="w-20 mr-4 items-center justify-center text-center">
                    <div
                        className={`text-2xl font-bold ${isJustified ? "text-green-700/70 dark:text-green-400/60 oled:text-green-300/65" : "text-amber-700/70 dark:text-amber-400/60 oled:text-amber-400/60"}`}
                    >
                        {absence.duration.replace(":", "h") ?? absence.duration}
                    </div>
                </div>
                <div className="flex-1">
                    <div className="text-lg font-medium">{absence.type}</div>
                    <div className="text-foreground">{absence.class}</div>
                    <div className="text-sm text-muted-foreground">
                        {(() => {
                            const [day, month, year] = absence.date.split("/");
                            const fullYear =
                                year.length === 2
                                    ? 2000 + parseInt(year)
                                    : parseInt(year);
                            const date = new Date(
                                fullYear,
                                parseInt(month) - 1,
                                parseInt(day)
                            );
                            return format(date, "EEEE d MMM", { locale });
                        })()}
                        {", "}
                        {absence.time}
                    </div>
                </div>
            </div>
        </Card>
    );
}
