import { Card } from "@/components/ui/card";
import { Grade } from "@/utils/notes";

export function GradeCard({ note }: { note: Grade }) {
    return (
        <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex">
                <div className="w-20 mr-4">
                    <div className="text-2xl font-bold text-mauria-light-accent dark:text-mauria-dark-accent">
                        {note.grade}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        Coef {note.coefficient}
                    </div>
                </div>
                <div className="flex-1">
                    <div className="text-lg font-medium text-mauria-light-purple dark:text-white">
                        {note.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        {note.date}
                    </div>
                </div>
            </div>
        </Card>
    );
}
