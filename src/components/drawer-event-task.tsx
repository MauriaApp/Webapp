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

export function DrawerEventTask({
    type,
    onClose,
}: {
    type: "event" | "task";
    onClose: () => void;
}) {
    const [open, setOpen] = useState(false);

    const [title, setTitle] = useState<string>("");
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [startTime, setStartTime] = useState<Date | undefined>(new Date());
    const [endTime, setEndTime] = useState<Date | undefined>(new Date());

    const handleValidate = () => {
        if (!title || !date || !startTime || (type === "event" && !endTime))
            return;

        switch (type) {
            case "event":
                console.log({ date, startTime, endTime });
                break;

            case "task":
                saveTaskToLocalStorage({
                    task: {
                        id: crypto.randomUUID(),
                        task: title,
                        date: new Date(startTime),
                    },
                });
                break;
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
                <Button className="fixed z-50 bottom-12 right-6 bg-accent text-white rounded-full p-4 shadow-lg hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent/50 transition">
                    <Plus />
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
                            Titre
                        </Label>
                        <Input
                            type="text"
                            className="w-full p-2 border rounded-md"
                            placeholder="Entrez le titre..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <DatePickerComponent
                                onChange={(date) => setDate(date)}
                            />
                        </div>
                        <div>
                            {type === "task" ? (
                                <TimePickerComponent
                                    onChange={(time) => setStartTime(time)}
                                />
                            ) : (
                                <>
                                    <TimePickerComponent
                                        onChange={(time) => setStartTime(time)}
                                    />
                                    <TimePickerComponent
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

    const handleDateChange = (selectedDate: Date | undefined) => {
        setDate(selectedDate);
        onChange(selectedDate);
    };

    return (
        <div className="flex gap-4">
            <div className="flex flex-col gap-3">
                <Label htmlFor="date-picker" className="px-1">
                    Date
                </Label>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            id="date-picker"
                            className="w-32 justify-between font-normal"
                        >
                            {date ? date.toLocaleDateString() : "Select date"}
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
    onChange,
}: {
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
                Heure
            </Label>
            <TimePicker date={time} setDate={handleTimeChange} />
        </div>
    );
};
