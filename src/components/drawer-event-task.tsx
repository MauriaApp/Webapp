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
import { useState } from "react";
import { TimePicker } from "./ui/time-picker/time-picker";
import { saveTaskToLocalStorage } from "@/lib/utils/agenda";
import { Lesson } from "@/types/aurion";
import { saveUserEventToLocalStorage } from "@/lib/utils/planning";
import { toast } from "sonner";
import { format } from "date-fns";
import { useTranslation } from 'react-i18next';

export function DrawerEventTask({
    type,
    onClose,
}: {
    type: "event" | "task";
    onClose: () => void;
}) {
    const [open, setOpen] = useState(false);
    const { t } = useTranslation();

    const [title, setTitle] = useState<string>("");
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [startTime, setStartTime] = useState<Date | undefined>(new Date());
    const [endTime, setEndTime] = useState<Date | undefined>(new Date());

    const handleValidate = () => {
        if (!title || !date || !startTime || (type === "event" && !endTime))
            return;

        switch (type) {
            case "event": {
                if (!endTime) return;
                const newUserEvent: Lesson = {
                    id: crypto.randomUUID(),
                    title: title,
                    start: new Date(
                        date.getFullYear(),
                        date.getMonth(),
                        date.getDate(),
                        startTime.getHours(),
                        startTime.getMinutes()
                    ).toISOString(),
                    end: new Date(
                        date.getFullYear(),
                        date.getMonth(),
                        date.getDate(),
                        endTime.getHours(),
                        endTime.getMinutes()
                    ).toISOString(),
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
                saveTaskToLocalStorage({
                    task: {
                        id: crypto.randomUUID(),
                        task: title,
                        date: new Date(startTime),
                    },
                });
                toast.success("Tâche ajoutée", {
                    description: "La tâche a été ajoutée à l’agenda.",
                    duration: 3000,
                });
                break;
            }
            default:
                break;
        }
        handleClose();
    };

    const handleClose = () => {
        onClose();
        setOpen(false);
        setTitle("");
        setDate(new Date());
        setStartTime(new Date());
        setEndTime(new Date());
    };

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild className="z-50">
                <Button className="fixed z-50 bottom-safe-offset-20 right-6 bg-accent text-white rounded-full size-10 shadow-lg hover:bg-accent/90 focus:outline-hidden focus:ring-2 focus:ring-accent/50 transition">
                    <Plus className="scale-150" />
                </Button>
            </DrawerTrigger>

            <DrawerContent>
                <DrawerHeader>
                    <DrawerTitle>
                        {type === "event"
                            ? "Ajouter un événement"
                            : "Ajouter une tâche"}
                    </DrawerTitle>
                </DrawerHeader>

                <div className="p-4 space-y-4">
                    <div>
                        <Label className="block text-sm font-medium mb-2">
                            {t('agendaPage.taskTitle')}
                        </Label>
                        <Input
                            type="text"
                            className="w-full p-2 border rounded-md"
                            placeholder={t('agendaPage.taskDescription')}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="flex w-full justify-between items-center px-10">
                        <div>
                            <DatePickerComponent
                                onChange={(date) => setDate(date)}
                            />
                        </div>
                        <div>
                            {type === "task" ? (
                                <TimePickerComponent
                                    label={t('agendaPage.hour')}
                                    onChange={(time) => setStartTime(time)}
                                />
                            ) : (
                                <>
                                    <TimePickerComponent
                                        label="Heure de début"
                                        onChange={(time) => setStartTime(time)}
                                    />
                                    <TimePickerComponent
                                        label="Heure de fin"
                                        onChange={(time) => setEndTime(time)}
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
                            (endTime &&
                                (startTime.getTime() === endTime.getTime() ||
                                    startTime.getTime() > endTime.getTime())) ||
                            (type === "event" && !endTime)
                        }
                    >
                        {type === "event"
                            ? "Créer l'événement"
                            : "Créer la tâche"}
                    </Button>
                </div>
            </DrawerContent>
        </Drawer>
    );
}

const DatePickerComponent = ({
    onChange,
}: {
    onChange: (date: Date | undefined) => void;
}) => {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [open, setOpen] = useState(false);
    const { t } = useTranslation();

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
    onChange,
}: {
    label: string;
    onChange: (time: Date) => void;
}) => {
    const [time, setTime] = useState<Date | undefined>(new Date());

    const handleTimeChange = (newTime: Date | undefined) => {
        if (!newTime) return;
        setTime(newTime);
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
