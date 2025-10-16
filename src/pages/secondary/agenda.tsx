import { DrawerEventTask } from "@/components/drawer-event-task";
import { Button } from "@/components/ui/button";
import {
    getTasksFromLocalStorage,
    removeTaskFromLocalStorage,
    saveTaskToLocalStorage,
} from "@/lib/utils/agenda";
import { TaskData } from "@/types/data";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, Check, ClipboardListIcon, Undo2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils/cn";

export function AgendaPage() {
    const [tasks, setTasks] = useState<TaskData[]>(() =>
        getTasksFromLocalStorage()
    );
    const [pendingTaskIds, setPendingTaskIds] = useState<
        Record<string, boolean>
    >({});
    const pendingTimeoutsRef = useRef<
        Map<string, ReturnType<typeof setTimeout>>
    >(new Map());
    const pendingTasksRef = useRef<Map<string, TaskData>>(new Map());
    const [editingTask, setEditingTask] = useState<TaskData | null>(null);
    const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
    const { t } = useTranslation();

    const refreshTasks = useCallback(() => {
        const storedTasks = getTasksFromLocalStorage();
        const pendingTasks = Array.from(pendingTasksRef.current.values());
        const combined = [
            ...storedTasks,
            ...pendingTasks.filter(
                (pendingTask) =>
                    !storedTasks.some((task) => task.id === pendingTask.id)
            ),
        ];
        combined.sort(
            (a, b) => a.date.getTime() - b.date.getTime()
        );
        setTasks(combined);
    }, []);

    const finalizeTaskCompletion = useCallback(
        (taskId: string) => {
            pendingTimeoutsRef.current.delete(taskId);
            pendingTasksRef.current.delete(taskId);
            setPendingTaskIds((prev) => {
                const { [taskId]: _removed, ...rest } = prev;
                return rest;
            });
            setTasks((prev) => prev.filter((task) => task.id !== taskId));
            if (editingTask?.id === taskId) {
                setIsEditDrawerOpen(false);
                setEditingTask(null);
            }
        },
        [editingTask]
    );

    const handleTaskCompletionToggle = (taskId: string) => {
        const isPending = Boolean(pendingTaskIds[taskId]);

        if (isPending) {
            const existingTimeout = pendingTimeoutsRef.current.get(taskId);
            if (existingTimeout) {
                clearTimeout(existingTimeout);
            }
            pendingTimeoutsRef.current.delete(taskId);
            const pendingTask = pendingTasksRef.current.get(taskId);
            if (pendingTask) {
                saveTaskToLocalStorage({ task: pendingTask });
            }
            pendingTasksRef.current.delete(taskId);
            setPendingTaskIds((prev) => {
                const { [taskId]: _removed, ...rest } = prev;
                return rest;
            });
            refreshTasks();
            return;
        }

        const taskToComplete = tasks.find((task) => task.id === taskId);
        if (!taskToComplete) return;
        pendingTasksRef.current.set(taskId, taskToComplete);
        removeTaskFromLocalStorage({ taskId });
        if (editingTask?.id === taskId) {
            setIsEditDrawerOpen(false);
            setEditingTask(null);
        }
        setPendingTaskIds((prev) => ({ ...prev, [taskId]: true }));
        const timeoutId = setTimeout(
            () => finalizeTaskCompletion(taskId),
            5000
        );
        pendingTimeoutsRef.current.set(taskId, timeoutId);
    };

    const handleTaskCardClick = useCallback(
        (task: TaskData) => {
            if (pendingTaskIds[task.id]) return;
            setEditingTask(task);
            setIsEditDrawerOpen(true);
        },
        [pendingTaskIds]
    );

    useEffect(() => {
        return () => {
            pendingTimeoutsRef.current.forEach((timeoutId) =>
                clearTimeout(timeoutId)
            );
            pendingTimeoutsRef.current.clear();
        };
    }, []);

    useEffect(() => {
        refreshTasks();
    }, [refreshTasks]);

    return (
        <div className="flex min-h-[calc(100vh-16rem)] flex-col py-6">
            <div className="max-w-4xl mx-auto">
                {/* Header Section */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold  mb-4">
                        {t("agendaPage.title")}
                    </h1>
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
                        {tasks.map((task: TaskData) => {
                            const isPending = Boolean(pendingTaskIds[task.id]);
                            return (
                                <div
                                    className="group cursor-pointer transform transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
                                    key={task.id}
                                    onClick={() => handleTaskCardClick(task)}
                                >
                                    <div
                                        className={cn(
                                            "bg-mauria-card rounded-xl shadow-md border border-mauria-border p-6 transition-all duration-500 ease-out hover:border-accent",
                                            isPending &&
                                                "animate-task-complete border-green-200/70 opacity-80"
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <h3
                                                    className={cn(
                                                        "text-lg font-semibold mb-2 group-hover:text-accent transition-colors",
                                                        isPending &&
                                                            "line-through text-muted-foreground"
                                                    )}
                                                >
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
                                                    className={cn(
                                                        "bg-green-100 hover:bg-green-200 focus:ring-green-300 oled:bg-neutral-900 oled:hover:bg-neutral-800 oled:focus:ring-neutral-700",
                                                        isPending &&
                                                            "bg-amber-100 hover:bg-amber-200 focus:ring-amber-300 oled:bg-neutral-900 oled:hover:bg-neutral-900/90"
                                                    )}
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        handleTaskCompletionToggle(
                                                            task.id
                                                        );
                                                    }}
                                                    title={
                                                        isPending
                                                            ? t(
                                                                  "agendaPage.undoTaskCompletion"
                                                              )
                                                            : t(
                                                                  "agendaPage.markTaskDone"
                                                              )
                                                    }
                                                    aria-label={
                                                        isPending
                                                            ? t(
                                                                  "agendaPage.undoTaskCompletion"
                                                              )
                                                            : t(
                                                                  "agendaPage.markTaskDone"
                                                              )
                                                    }
                                                >
                                                    {isPending ? (
                                                        <Undo2 className="w-5 h-5 text-amber-500 oled:text-gray-200" />
                                                    ) : (
                                                        <Check className="w-5 h-5 text-green-500 oled:text-gray-200" />
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
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
            <DrawerEventTask type="task" onClose={refreshTasks} />
            <DrawerEventTask
                type="task"
                mode="edit"
                hideTrigger
                initialTask={editingTask ?? undefined}
                open={isEditDrawerOpen && Boolean(editingTask)}
                onOpenChange={(open) => {
                    setIsEditDrawerOpen(open);
                    if (!open) {
                        setEditingTask(null);
                    }
                }}
                onClose={refreshTasks}
                onSave={refreshTasks}
            />
        </div>
    );
}
