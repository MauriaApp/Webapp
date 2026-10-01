import { FormEvent, useEffect, useMemo, useState } from "react";
import { addHours, isSameDay, startOfDay, startOfHour } from "date-fns";
import { BookOpen, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "./ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "./ui/drawer";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { ChipButton, DayChips, TimeField, TimeGrid } from "./date-time-fields";
import { atTime, formatTime, toTime, useHour12 } from "@/lib/utils/date-time";
import { saveTaskToLocalStorage } from "@/lib/utils/agenda";
import { findNextLessonOfCurrentCourse } from "@/lib/utils/home";
import { usePlanning } from "@/lib/hooks/use-planning";
import { useColles } from "@/lib/hooks/use-colles";
import { TaskData } from "@/types/data";

// The usual deadlines: morning class, noon, end of the day, midnight.
const QUICK_TIMES = ["08:00", "12:00", "18:00", "23:59"];

export function DrawerTask({
    open,
    onOpenChange,
    task,
    onSaved,
    onDelete,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** The task being edited; a new one is created when absent. */
    task?: TaskData | null;
    onSaved: () => void;
    /** Offered on an edited task only. */
    onDelete?: (task: TaskData) => void;
}) {
    const { t } = useTranslation();
    const hour12 = useHour12();
    const isEdit = Boolean(task);

    const [title, setTitle] = useState("");
    const [notes, setNotes] = useState("");
    const [day, setDay] = useState(() => startOfDay(new Date()));
    const [time, setTime] = useState("");
    const [timeOpen, setTimeOpen] = useState(false);

    const planning = usePlanning();
    const colles = useColles();
    // A task noted in (or right after) class is usually due for the next
    // class of that course: offered as a one-tap due date. Looked up as the
    // drawer opens, so it doesn't shift under the user's finger.
    const nextLesson = useMemo(
        () =>
            open
                ? findNextLessonOfCurrentCourse([...planning, ...colles])
                : null,
        [open, planning, colles]
    );

    // Reset the form each time the drawer opens, from the edited task or the
    // next full hour.
    useEffect(() => {
        if (!open) return;
        const due = task
            ? new Date(task.date)
            : startOfHour(addHours(new Date(), 1));
        setTitle(task?.task ?? "");
        setNotes(task?.notes ?? "");
        setDay(startOfDay(due));
        setTime(toTime(due));
        setTimeOpen(false);
    }, [open, task]);

    const canSubmit = title.trim() !== "" && time !== "";

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;

        saveTaskToLocalStorage({
            task: {
                id: task?.id ?? crypto.randomUUID(),
                task: title.trim(),
                date: atTime(day, time),
                notes: notes.trim() || undefined,
            },
        });
        toast.success(
            t(isEdit ? "agendaPage.taskUpdated" : "agendaPage.taskAdded"),
            { duration: 3000 }
        );
        onSaved();
        onOpenChange(false);
    };

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent
                className="bg-mauria-card shadow-2xl max-h-[92dvh]"
                aria-describedby={undefined}
            >
                <DrawerHeader className="text-left">
                    <DrawerTitle>
                        {t(
                            isEdit
                                ? "agendaPage.editTaskTitle"
                                : "agendaPage.addTask"
                        )}
                    </DrawerTitle>
                </DrawerHeader>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-5 overflow-y-auto px-4 pb-4"
                >
                    <div className="space-y-2">
                        <Label htmlFor="task-title">
                            {t("agendaPage.taskTitle")}
                        </Label>
                        <Input
                            id="task-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={t("agendaPage.taskTitlePlaceholder")}
                            maxLength={120}
                            enterKeyHint="done"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>{t("agendaPage.dueDate")}</Label>
                        {nextLesson && (
                            <ChipButton
                                className="h-auto max-w-full py-1.5 text-left whitespace-normal"
                                active={
                                    isSameDay(day, nextLesson.start) &&
                                    time === toTime(nextLesson.start)
                                }
                                onClick={() => {
                                    setDay(startOfDay(nextLesson.start));
                                    setTime(toTime(nextLesson.start));
                                    setTimeOpen(false);
                                }}
                            >
                                <BookOpen className="h-4 w-4 shrink-0" />
                                {t("agendaPage.nextLesson", {
                                    course: nextLesson.course,
                                })}
                            </ChipButton>
                        )}
                        <DayChips day={day} onChange={setDay} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="task-time">
                            {t("agendaPage.dueTime")}
                        </Label>
                        <TimeField
                            id="task-time"
                            value={time}
                            hour12={hour12}
                            active={timeOpen}
                            onClick={() => setTimeOpen((o) => !o)}
                        />
                        {timeOpen && (
                            <TimeGrid
                                value={time}
                                hour12={hour12}
                                onChange={setTime}
                                onDone={() => setTimeOpen(false)}
                            />
                        )}
                        <div className="flex flex-wrap gap-2 pt-1">
                            {QUICK_TIMES.map((quick) => (
                                <ChipButton
                                    key={quick}
                                    active={time === quick}
                                    onClick={() => {
                                        setTime(quick);
                                        setTimeOpen(false);
                                    }}
                                >
                                    {formatTime(quick, hour12)}
                                </ChipButton>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="task-notes">
                            {t("agendaPage.notes")}
                        </Label>
                        <Textarea
                            id="task-notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder={t("agendaPage.optional")}
                            rows={2}
                            maxLength={500}
                        />
                    </div>

                    <div
                        className={
                            task && onDelete ? "grid grid-cols-2 gap-3" : ""
                        }
                    >
                        {task && onDelete && (
                            <Button
                                type="button"
                                variant="outline"
                                className="text-destructive hover:text-destructive"
                                onClick={() => onDelete(task)}
                            >
                                <Trash2 className="h-4 w-4" />
                                {t("agendaPage.delete")}
                            </Button>
                        )}
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={!canSubmit}
                        >
                            {t(
                                isEdit
                                    ? "agendaPage.save"
                                    : "agendaPage.createTaskBtn"
                            )}
                        </Button>
                    </div>
                </form>
            </DrawerContent>
        </Drawer>
    );
}
