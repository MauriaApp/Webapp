import { Card } from "@/components/ui/card";
import { Absence } from "@/utils/absences";

export function AbsenceCard({ absence }: { absence: Absence }) {
    return (
        <Card className="bg-white dark:bg-mauria-dark-card border-none shadow-md p-4">
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
                                ? "text-mauria-light-purple"
                                : "text-mauria-light-accent"
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
        </Card>
    );
}
