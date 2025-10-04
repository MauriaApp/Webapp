import { DrawerEventTask } from "@/components/drawer-event-task";
import { Button } from "@/components/ui/button";
import {
    getTasksFromLocalStorage,
    removeTaskFromLocalStorage,
} from "@/lib/utils/agenda";
import { TaskData } from "@/types/data";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, Check, ClipboardListIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from 'react-i18next';

export function AgendaPage() {
    const [tasks, setTasks] = useState<TaskData[]>(getTasksFromLocalStorage());
    const { t } = useTranslation();

    const handleTaskComplete = (taskId: string) => {
        removeTaskFromLocalStorage({ taskId });
        setTasks(getTasksFromLocalStorage());
    };

    return (
        <div className="flex min-h-[calc(100vh-16rem)] flex-col py-6">
            <div className="max-w-4xl mx-auto">
                {/* Header Section */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold  mb-4">{t("agendaPage.title")}</h1>
                    <div className="bg-mauria-card rounded-lg p-4 border border-mauria-border">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-accent rounded-full"></div>
                            <p className="text-sm">
                                {t("agendaPage.notifications")}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tasks List */}
                {tasks.length > 0 ? (
                    <div className="space-y-4">
                        {tasks.map((task: TaskData, index: number) => (
                            <div
                                className="group cursor-pointer transform transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
                                key={index}
                            >
                                <div className="bg-mauria-card rounded-xl shadow-md border border-mauria-border  p-6 hover:border-accent transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold  mb-2 group-hover:text-accent transition-colors">
                                                {task.task}
                                            </h3>
                                            <div className="flex items-center gap-4 text-sm">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                                    <span>
                                                        {format(
                                                            task.date,
                                                            "EEEE d MMM p",
                                                            { locale: fr }
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="ml-4">
                                            <Button
                                                variant="secondary"
                                                size="icon"
                                                className="bg-green-100 hover:bg-green-200 focus:ring-green-300 oled:bg-neutral-900 oled:hover:bg-neutral-800 oled:focus:ring-neutral-700"
                                                onClick={() =>
                                                    handleTaskComplete(task.id)
                                                }
                                            >
                                                <Check className="w-5 h-5 text-green-500 oled:text-gray-200" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="bg-mauria-card rounded-xl shadow-md p-8 max-w-md mx-auto">
                            <div className="w-16 h-16 bg-muted-foreground/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ClipboardListIcon className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold  mb-2">
                                {t("agendaPage.noTasks")}
                            </h3>
                            <p className="text-muted-foreground">
                                {t("agendaPage.noTaskPlaceholder")}
                            </p>
                        </div>
                    </div>
                )}
            </div>
            <DrawerEventTask
                type="task"
                onClose={() => {
                    setTasks(getTasksFromLocalStorage());
                }}
            />
        </div>
    );
}
