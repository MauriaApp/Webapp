import { ComponentProps, useState } from "react";
import { addDays, format, isToday, isTomorrow, startOfDay } from "date-fns";
import { CalendarDays } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { cn } from "@/lib/utils/cn";
import { getDateLocale } from "@/lib/utils/translations";
import { formatTime, pad } from "@/lib/utils/date-time";

// Shared by the personal event and task forms.

export const ChipButton = ({
    active,
    className,
    ...props
}: ComponentProps<typeof Button> & { active: boolean }) => (
    <Button
        type="button"
        size="sm"
        variant={active ? "default" : "outline"}
        className={cn("rounded-full", className)}
        aria-pressed={active}
        {...props}
    />
);

/** Today / Tomorrow / any other day from a calendar popover. */
export const DayChips = ({
    day,
    onChange,
}: {
    day: Date;
    onChange: (day: Date) => void;
}) => {
    const { t, i18n } = useTranslation();
    const locale = getDateLocale(i18n.language);
    const [pickerOpen, setPickerOpen] = useState(false);
    const isOtherDay = !isToday(day) && !isTomorrow(day);

    return (
        <div className="flex flex-wrap gap-2">
            <ChipButton
                active={isToday(day)}
                onClick={() => onChange(startOfDay(new Date()))}
            >
                {t("dateTimeFields.today")}
            </ChipButton>
            <ChipButton
                active={isTomorrow(day)}
                onClick={() => onChange(startOfDay(addDays(new Date(), 1)))}
            >
                {t("dateTimeFields.tomorrow")}
            </ChipButton>
            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                <PopoverTrigger asChild>
                    <ChipButton active={isOtherDay}>
                        <CalendarDays className="h-4 w-4" />
                        {isOtherDay
                            ? format(day, "EEE d MMM", { locale })
                            : t("dateTimeFields.otherDate")}
                    </ChipButton>
                </PopoverTrigger>
                <PopoverContent
                    className="w-auto overflow-hidden p-0"
                    align="start"
                >
                    <Calendar
                        mode="single"
                        selected={day}
                        defaultMonth={day}
                        locale={locale}
                        weekStartsOn={1}
                        onSelect={(date) => {
                            if (date) onChange(startOfDay(date));
                            setPickerOpen(false);
                        }}
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
};

/**
 * Shows a time in the app's language rather than the device's: native time
 * inputs follow the OS locale, which can't be overridden.
 */
export const TimeField = ({
    value,
    hour12,
    active,
    invalid = false,
    ...props
}: ComponentProps<typeof Button> & {
    value: string;
    hour12: boolean;
    active: boolean;
    invalid?: boolean;
}) => (
    <Button
        type="button"
        variant="outline"
        className={cn(
            "w-full text-base tabular-nums",
            active && "ring-2 ring-ring ring-offset-2 ring-offset-background",
            invalid && "border-destructive text-destructive"
        )}
        aria-expanded={active}
        aria-invalid={invalid}
        {...props}
    >
        {formatTime(value, hour12)}
    </Button>
);

const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

/**
 * Hours then minutes (5 min steps) laid out as tap targets, inline in the
 * form: no scrolling list, which the drawer would fight over. Picking the
 * minutes closes it, being the last thing set.
 */
export const TimeGrid = ({
    value,
    hour12,
    onChange,
    onDone,
}: {
    value: string;
    hour12: boolean;
    onChange: (time: string) => void;
    onDone: () => void;
}) => {
    const { t } = useTranslation();
    const [hours = 0, minutes = 0] = value.split(":").map(Number);
    const isPm = hours >= 12;
    const hourOptions = hour12
        ? [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
        : Array.from({ length: 24 }, (_, i) => i);
    const shownHour = hour12 ? hours % 12 || 12 : hours;

    const setTime = (h: number, m: number) => onChange(`${pad(h)}:${pad(m)}`);

    return (
        <div className="space-y-3 rounded-lg border p-3">
            <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                    {t("dateTimeFields.hours")}
                </p>
                <div className="grid grid-cols-6 gap-1.5">
                    {hourOptions.map((h) => (
                        <TimeCell
                            key={h}
                            active={shownHour === h}
                            onClick={() =>
                                setTime(
                                    hour12 ? (h % 12) + (isPm ? 12 : 0) : h,
                                    minutes
                                )
                            }
                        >
                            {hour12 ? h : pad(h)}
                        </TimeCell>
                    ))}
                </div>
                {hour12 && (
                    <div className="grid grid-cols-2 gap-1.5">
                        {[false, true].map((pm) => (
                            <TimeCell
                                key={String(pm)}
                                active={isPm === pm}
                                onClick={() =>
                                    setTime(
                                        (hours % 12) + (pm ? 12 : 0),
                                        minutes
                                    )
                                }
                            >
                                {pm ? "PM" : "AM"}
                            </TimeCell>
                        ))}
                    </div>
                )}
            </div>
            <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                    {t("dateTimeFields.minutes")}
                </p>
                <div className="grid grid-cols-6 gap-1.5">
                    {MINUTES.map((m) => (
                        <TimeCell
                            key={m}
                            active={minutes === m}
                            onClick={() => {
                                setTime(hours, m);
                                onDone();
                            }}
                        >
                            {`:${pad(m)}`}
                        </TimeCell>
                    ))}
                </div>
            </div>
        </div>
    );
};

const TimeCell = ({
    active,
    ...props
}: ComponentProps<typeof Button> & { active: boolean }) => (
    <Button
        type="button"
        size="sm"
        variant={active ? "default" : "ghost"}
        className="px-0 tabular-nums"
        aria-pressed={active}
        {...props}
    />
);
