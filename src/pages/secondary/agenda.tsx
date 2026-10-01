import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { format, isToday, isTomorrow, startOfDay } from "date-fns";
import { Check, ClipboardListIcon, Clock, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { DrawerTask } from "@/components/drawer-task";
import { formatTime, toTime, useHour12 } from "@/lib/utils/date-time";
import { Button } from "@/components/ui/button";
import {
    getTasksFromLocalStorage,
    removeTaskFromLocalStorage,
    saveTaskToLocalStorage,
} from "@/lib/utils/agenda";
import { cn } from "@/lib/utils/cn";
import { getDateLocale } from "@/lib/utils/translations";
import { TaskData } from "@/types/data";

type TaskGroup = {
    key: string;
    label: string;
    overdue: boolean;
    tasks: TaskData[];
};

export function AgendaPage() {
    const { t, i18n } = useTranslation();
    const locale = getDateLocale(i18n.language);
    const hour12 = useHour12();
    const [tasks, setTasks] = useState<TaskData[]>(getTasksFromLocalStorage);
    const [formOpen, setFormOpen] = useState(false);
    const [editedTask, setEditedTask] = useState<TaskData | null>(null);
    // Ticks every minute so tasks slide into "overdue" while the page is open.
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const interval = window.setInterval(() => setNow(new Date()), 60_000);
        return () => window.clearInterval(interval);
    }, []);

    const refreshTasks = useCallback(() => {
        setTasks(getTasksFromLocalStorage());
    }, []);

    const openForm = (task: TaskData | null) => {
        setEditedTask(task);
        setFormOpen(true);
    };

    // Completing and deleting both drop the task, with a way back.
    const removeTask = (task: TaskData, messageKey: string) => {
        removeTaskFromLocalStorage({ taskId: task.id });
        refreshTasks();
        toast.success(t(messageKey), {
            duration: 5000,
            action: {
                label: t("agendaPage.undo"),
                onClick: () => {
                    saveTaskToLocalStorage({ task });
                    refreshTasks();
                },
            },
        });
    };

    const groups = useMemo<TaskGroup[]>(() => {
        const result: TaskGroup[] = [];
        const overdue = tasks.filter((task) => task.date < now);
        if (overdue.length > 0) {
            result.push({
                key: "overdue",
                label: t("agendaPage.overdue"),
                overdue: true,
                tasks: overdue,
            });
        }
        tasks
            .filter((task) => task.date >= now)
            .forEach((task) => {
                const day = startOfDay(task.date);
                const key = day.toISOString();
                const last = result[result.length - 1];
                if (last?.key === key) {
                    last.tasks.push(task);
                    return;
                }
                const label = isToday(day)
                    ? t("dateTimeFields.today")
                    : isTomorrow(day)
                      ? t("dateTimeFields.tomorrow")
                      : format(day, "EEEE d MMMM", { locale });
                result.push({ key, label, overdue: false, tasks: [task] });
            });
        return result;
    }, [tasks, now, t, locale]);

    const formatDue = (task: TaskData, overdue: boolean) => {
        const time = formatTime(toTime(task.date), hour12);
        // Overdue tasks share one group: each one needs its own day.
        return overdue
            ? `${format(task.date, "EEE d MMM", { locale })} · ${time}`
            : time;
    };

    return (
        <div className="pb-6">
            <div className="mt-4 mb-6 flex items-center justify-between gap-2">
                <h2 className="text-3xl font-bold text-mauria-purple dark:text-white">
                    {t("agendaPage.title")}
                </h2>
                <Button
                    size="sm"
                    className="w-9 px-0"
                    onClick={() => openForm(null)}
                    aria-label={t("agendaPage.addTask")}
                >
                    <Plus className="h-5 w-5" />
                </Button>
            </div>

            {tasks.length > 0 ? (
                <div className="space-y-6">
                    <AnimatePresence initial={false}>
                        {groups.map((group) => (
                            <motion.section
                                key={group.key}
                                layout
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-2"
                            >
                                <h3
                                    className={cn(
                                        "text-sm font-semibold first-letter:uppercase",
                                        group.overdue
                                            ? "text-destructive"
                                            : "text-muted-foreground"
                                    )}
                                >
                                    {group.label}
                                </h3>
                                <AnimatePresence initial={false}>
                                    {group.tasks.map((task) => (
                                        <TaskCard
                                            key={task.id}
                                            task={task}
                                            overdue={group.overdue}
                                            due={formatDue(task, group.overdue)}
                                            onOpen={() => openForm(task)}
                                            onComplete={() =>
                                                removeTask(
                                                    task,
                                                    "agendaPage.taskDone"
                                                )
                                            }
                                        />
                                    ))}
                                </AnimatePresence>
                            </motion.section>
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                <div className="py-12 text-center">
                    <div className="mx-auto max-w-md rounded-xl bg-mauria-card p-8 shadow-md">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted-foreground/10">
                            <ClipboardListIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="mb-2 text-lg font-semibold">
                            {t("agendaPage.noTasks")}
                        </h3>
                        <p className="mb-4 text-muted-foreground">
                            {t("agendaPage.noTaskPlaceholder")}
                        </p>
                        <Button onClick={() => openForm(null)}>
                            <Plus className="h-4 w-4" />
                            {t("agendaPage.addTask")}
                        </Button>
                    </div>
                </div>
            )}

            <DrawerTask
                open={formOpen}
                onOpenChange={setFormOpen}
                task={editedTask}
                onSaved={refreshTasks}
                onDelete={(task) => {
                    setFormOpen(false);
                    removeTask(task, "agendaPage.taskDeleted");
                }}
            />
        </div>
    );
}

function TaskCard({
    task,
    overdue,
    due,
    onOpen,
    onComplete,
}: {
    task: TaskData;
    overdue: boolean;
    due: string;
    onOpen: () => void;
    onComplete: () => void;
}) {
    const { t } = useTranslation();

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.2 }}
            onClick={onOpen}
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-mauria-border bg-mauria-card p-4 shadow-md transition-colors hover:border-accent"
        >
            <button
                type="button"
                className="group/check flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-muted-foreground/40 transition-colors hover:border-mauria-green hover:bg-mauria-green/10"
                onClick={(event) => {
                    event.stopPropagation();
                    onComplete();
                }}
                title={t("agendaPage.markTaskDone")}
                aria-label={t("agendaPage.markTaskDone")}
            >
                <Check className="size-4 text-muted-foreground/40 transition-colors group-hover/check:text-mauria-green" />
            </button>
            <div className="min-w-0 flex-1 space-y-1">
                <p className="break-words font-semibold leading-tight">
                    {task.task}
                </p>
                <p
                    className={cn(
                        "flex items-center gap-1 text-sm",
                        overdue ? "text-destructive" : "text-muted-foreground"
                    )}
                >
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    {due}
                </p>
                {task.notes && (
                    <p className="line-clamp-2 whitespace-pre-line text-sm text-muted-foreground">
                        {task.notes}
                    </p>
                )}
            </div>
        </motion.div>
    );
}
