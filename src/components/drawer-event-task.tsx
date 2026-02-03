import { ChevronDownIcon, Plus } from "lucide-react";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "./ui/drawer";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";
import { useCallback, useEffect, useState } from "react";
import { TimePicker } from "./ui/time-picker/time-picker";
import {
    saveTaskToLocalStorage,
    updateTaskInLocalStorage,
} from "@/lib/utils/agenda";
import { Lesson } from "@/types/aurion";
import { saveUserEventToLocalStorage } from "@/lib/utils/planning";
import { toast } from "sonner";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { TaskData } from "@/types/data";

const combineDateAndTime = (
    targetDate: Date | undefined,
    time: Date | undefined
): Date | undefined => {
    if (!targetDate || !time) return undefined;

    return new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate(),
        time.getHours(),
        time.getMinutes(),
        time.getSeconds(),
        time.getMilliseconds()
    );
};

const createDefaultDateTimes = () => {
    const start = new Date();
    start.setHours(start.getHours() + 1); // Add an hour to the default time

    const date = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate()
    );

    const end = new Date(start);
    end.setHours(end.getHours() + 1); // Add an hour to the default time

    return {
        date,
        startTime: start,
        endTime: end,
    };
};

interface DrawerEventTaskProps {
    type: "event" | "task";
    onClose: () => void;
    mode?: "create" | "edit";
    initialTask?: TaskData;
    onSave?: () => void;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    hideTrigger?: boolean;
}

export function DrawerEventTask({
    type,
    onClose,
    mode = "create",
    initialTask,
    onSave,
    open: controlledOpen,
    onOpenChange,
    hideTrigger = false,
}: DrawerEventTaskProps) {
    const { t } = useTranslation();
    const isEditMode = mode === "edit";
    const isTaskDrawer = type === "task";

    const [title, setTitle] = useState<string>("");
    const [date, setDate] = useState<Date | undefined>();
    const [startTime, setStartTime] = useState<Date | undefined>();
    const [endTime, setEndTime] = useState<Date | undefined>();

    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = typeof controlledOpen === "boolean";
    const open = isControlled ? Boolean(controlledOpen) : internalOpen;

    const setDrawerOpen = useCallback(
        (next: boolean) => {
            if (!isControlled) {
                setInternalOpen(next);
            }
            onOpenChange?.(next);
        },
        [isControlled, onOpenChange]
    );

    const initializeForm = useCallback(() => {
        if (isEditMode && isTaskDrawer && initialTask) {
            const taskDate = new Date(initialTask.date);
            setTitle(initialTask.task);
            setDate(new Date(taskDate));
            setStartTime(new Date(taskDate));
            setEndTime(new Date(taskDate));
            return;
        }

        const defaults = createDefaultDateTimes();
        setTitle("");
        setDate(defaults.date);
        setStartTime(defaults.startTime);
        setEndTime(defaults.endTime);
    }, [initialTask, isEditMode, isTaskDrawer]);

    const handleOpen = useCallback(() => {
        initializeForm();
        setDrawerOpen(true);
    }, [initializeForm, setDrawerOpen]);

    const closeDrawer = useCallback(() => {
        setDrawerOpen(false);
        onClose();
    }, [onClose, setDrawerOpen]);

    const handleDrawerOpenChange = useCallback(
        (next: boolean) => {
            if (next) {
                handleOpen();
            } else {
                closeDrawer();
            }
        },
        [closeDrawer, handleOpen]
    );

    const now = new Date();
    const startDateTimeForValidation = combineDateAndTime(date, startTime);
    const endDateTimeForValidation = combineDateAndTime(date, endTime);
    const isEventDisabled =
        type === "event" &&
        (!startDateTimeForValidation ||
            !endDateTimeForValidation ||
            endDateTimeForValidation.getTime() <=
                startDateTimeForValidation.getTime() ||
            startDateTimeForValidation.getTime() < now.getTime());
    const isTaskDisabled =
        type === "task" &&
        (!startDateTimeForValidation ||
            startDateTimeForValidation.getTime() < now.getTime());

    const handleValidate = () => {
        const validationNow = new Date();
        const startDateTime = combineDateAndTime(date, startTime);
        const endDateTime = combineDateAndTime(date, endTime);

        if (!title || !startDateTime || (type === "event" && !endDateTime))
            return;

        if (startDateTime.getTime() < validationNow.getTime()) return;
        if (
            type === "event" &&
            endDateTime &&
            endDateTime.getTime() <= startDateTime.getTime()
        )
            return;

        switch (type) {
            case "event": {
                if (!endDateTime) return;
                const newUserEvent: Lesson = {
                    id: crypto.randomUUID(),
                    title: title,
                    start: startDateTime.toISOString(),
                    end: endDateTime.toISOString(),
                    allDay: false,
                    editable: true,
                    className: "est-perso",
                };
                saveUserEventToLocalStorage({ userEvent: newUserEvent });
                toast.success("Événement ajouté", {
                    description: "L’événement a été ajouté au planning.",
                    duration: 3000,
                });
                break;
            }

            case "task": {
                if (isEditMode && initialTask) {
                    const updatedTask: TaskData = {
                        ...initialTask,
                        task: title,
                        date: startDateTime,
                    };
                    updateTaskInLocalStorage({ task: updatedTask });
                    toast.success(t("agendaPage.taskUpdated"), {
                        description: t(
                            "agendaPage.taskUpdatedDescription"
                        ),
                        duration: 3000,
                    });
                } else {
                    saveTaskToLocalStorage({
                        task: {
                            id: crypto.randomUUID(),
                            task: title,
                            date: startDateTime,
                        },
                    });
                    toast.success("Tâche ajoutée", {
                        description: "La tâche a été ajoutée à l’agenda.",
                        duration: 3000,
                    });
                }
                break;
            }
            default:
                break;
        }

        onSave?.();
        closeDrawer();
    };

    const drawerTitle =
        type === "event"
            ? isEditMode
                ? "Modifier l'événement"
                : "Ajouter un événement"
            : isEditMode
            ? t("agendaPage.editTaskTitle")
            : t("agendaPage.addTask");

    const submitLabel =
        type === "event"
            ? isEditMode
                ? "Mettre à jour l'événement"
                : "Créer l'événement"
            : isEditMode
            ? t("agendaPage.updateTaskBtn")
            : t("agendaPage.createTaskBtn");

    return (
        <Drawer open={open} onOpenChange={handleDrawerOpenChange}>
            {!hideTrigger && (
                <DrawerTrigger asChild className="z-50">
                    <Button className="fixed z-50 bottom-safe-offset-20 right-6 bg-accent text-white rounded-full size-10 shadow-lg hover:bg-accent/90 focus:outline-hidden focus:ring-2 focus:ring-accent/50 transition">
                        <Plus className="scale-150" />
                    </Button>
                </DrawerTrigger>
            )}

            <DrawerContent className="bg-mauria-card shadow-2xl">
                <DrawerHeader>
                    <DrawerTitle>{drawerTitle}</DrawerTitle>
                </DrawerHeader>

                <div className="p-4 space-y-4">
                    <div>
                        <Label className="block text-sm font-medium mb-2">
                            {t("agendaPage.taskTitle")}
                        </Label>
                        <Input
                            type="text"
                            className="w-full p-2 border rounded-md"
                            placeholder={t("agendaPage.taskDescription")}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="flex w-full justify-between items-center px-10">
                        <div>
                            <DatePickerComponent
                                value={date}
                                onChange={setDate}
                            />
                        </div>
                        <div>
                            {type === "task" ? (
                                <TimePickerComponent
                                    label={t("agendaPage.hour")}
                                    value={startTime}
                                    onChange={setStartTime}
                                />
                            ) : (
                                <>
                                    <TimePickerComponent
                                        label="Heure de début"
                                        value={startTime}
                                        onChange={setStartTime}
                                    />
                                    <TimePickerComponent
                                        label="Heure de fin"
                                        value={endTime}
                                        onChange={setEndTime}
                                    />
                                </>
                            )}
                        </div>
                    </div>

                    <Button
                        className="w-full"
                        onClick={handleValidate}
                        disabled={
                            !title ||
                            !date ||
                            !startTime ||
                            isEventDisabled ||
                            isTaskDisabled
                        }
                    >
                        {submitLabel}
                    </Button>
                </div>
            </DrawerContent>
        </Drawer>
    );
}

const DatePickerComponent = ({
    value,
    onChange,
}: {
    value: Date | undefined;
    onChange: (date: Date | undefined) => void;
}) => {
    const [date, setDate] = useState<Date | undefined>(() =>
        value ? new Date(value) : undefined
    );
    const [open, setOpen] = useState(false);
    const { t } = useTranslation();

    useEffect(() => {
        setDate(value ? new Date(value) : undefined);
    }, [value]);

    const handleDateChange = (selectedDate: Date | undefined) => {
        setDate(selectedDate);
        onChange(selectedDate);
    };

    return (
        <div className="flex gap-4">
            <div className="flex flex-col gap-3">
                <Label htmlFor="date-picker" className="px-1">
                    {t("agendaPage.date")}
                </Label>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            id="date-picker"
                            className="w-32 justify-between font-normal"
                        >
                            {date ? format(date, "dd/MM/yyyy") : "Select date"}
                            <ChevronDownIcon />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent
                        className="w-auto overflow-hidden p-0"
                        align="start"
                    >
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={(date) => {
                                handleDateChange(date);
                                setOpen(false);
                            }}
                        />
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
};

const TimePickerComponent = ({
    label,
    value,
    onChange,
}: {
    label: string;
    value: Date | undefined;
    onChange: (time: Date | undefined) => void;
}) => {
    const time = value ? new Date(value) : new Date();

    const handleTimeChange = (newTime: Date | undefined) => {
        if (!newTime) return;
        onChange(newTime);
    };

    return (
        <div className="flex flex-col gap-3">
            <Label htmlFor="time-picker" className="px-1">
                {label}
            </Label>
            <TimePicker date={time} setDate={handleTimeChange} />
        </div>
    );
};
