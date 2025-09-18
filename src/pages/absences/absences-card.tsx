import { Card } from "@/components/ui/card";

export function AbsenceCard({
    duration,
    type,
    course,
    time,
    date,
    excused = false,
}: {
    duration: string;
    type: string;
    course: string;
    time: string;
    date: string;
    excused?: boolean;
}) {
    return (
        <Card className="bg-white dark:bg-mauria-dark-card border-none shadow-md p-4">
            <div className="flex">
                <div className="w-20 mr-4">
                    <div className="text-2xl font-bold text-mauria-light-accent dark:text-mauria-dark-accent">
                        {duration}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        {time}
                    </div>
                </div>
                <div className="flex-1">
                    <div
                        className={`text-lg font-medium ${
                            excused
                                ? "text-mauria-light-purple"
                                : "text-mauria-light-accent"
                        } dark:text-white`}
                    >
                        {type}
                    </div>
                    <div className="text-gray-700 dark:text-gray-300">
                        {course}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        {date}
                    </div>
                </div>
            </div>
        </Card>
    );
}
