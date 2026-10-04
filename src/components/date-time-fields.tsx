import { ComponentProps, useEffect, useRef, useState, type ReactNode } from "react";
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

// Row height of a wheel item; keep in sync with the h-10 classes below.
const WHEEL_ITEM_HEIGHT = 40;
// Visible rows per wheel: the centered one plus one faded on each side.
const WHEEL_HEIGHT = WHEEL_ITEM_HEIGHT * 3;

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
    extra,
}: {
    day: Date;
    onChange: (day: Date) => void;
    /** Rendered at the end of the row, e.g. the next-lesson shortcut. */
    extra?: ReactNode;
}) => {
    const { t, i18n } = useTranslation();
    const locale = getDateLocale(i18n.language);
    const [pickerOpen, setPickerOpen] = useState(false);
    const isOtherDay = !isToday(day) && !isTomorrow(day);

    return (
        <div className="flex flex-wrap items-center gap-2">
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
            {extra}
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
 * One wheel of the time picker: a vertical snap-scroll list whose centered
 * row is the value, iOS-style. Flick it, or tap a row to center it.
 */
const WheelColumn = ({
    options,
    selected,
    onSelect,
    className,
}: {
    options: string[];
    selected: number;
    onSelect: (index: number) => void;
    className?: string;
}) => {
    const ref = useRef<HTMLDivElement>(null);
    const [centered, setCentered] = useState(selected);
    // A new selection only scrolls the wheel when it came from elsewhere
    // (quick chips, durations): never to echo back the user's own scroll.
    const fromWheel = useRef(false);
    const selectedRef = useRef(selected);
    selectedRef.current = selected;
    const timer = useRef<number | null>(null);
    // Open right on the selection: no scroll-up animation on mount, only
    // later changes (quick chips, durations) move the wheel smoothly.
    const mounted = useRef(false);

    useEffect(() => {
        return () => {
            if (timer.current !== null) window.clearTimeout(timer.current);
        };
    }, []);

    useEffect(() => {
        if (fromWheel.current) {
            fromWheel.current = false;
            return;
        }
        setCentered(selected);
        ref.current?.scrollTo({
            top: selected * WHEEL_ITEM_HEIGHT,
            behavior: mounted.current ? "smooth" : "auto",
        });
        mounted.current = true;
    }, [selected]);

    const handleScroll = () => {
        const row = ref.current;
        if (!row) return;
        const index = Math.min(
            Math.round(row.scrollTop / WHEEL_ITEM_HEIGHT),
            options.length - 1
        );
        setCentered(index);
        // Commit once the wheel settles, not for every row it passes.
        if (timer.current !== null) window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => {
            timer.current = null;
            if (index !== selectedRef.current) {
                fromWheel.current = true;
                onSelect(index);
            }
        }, 120);
    };

    return (
        <div className={cn("relative", className)}>
            {/* The selection band and the fades sit above the wheel. */}
            <div className="pointer-events-none absolute inset-x-0 top-[calc(50%-20px)] h-10 rounded-lg bg-mauria-purple/10 dark:bg-white/10" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-[hsl(var(--mauria-card))] to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[hsl(var(--mauria-card))] to-transparent" />
            <div
                ref={ref}
                onScroll={handleScroll}
                className="snap-y snap-mandatory overflow-y-auto overscroll-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                style={{ height: WHEEL_HEIGHT }}
            >
                <div className="py-10">
                    {options.map((option, i) => (
                        <button
                            type="button"
                            key={option}
                            onClick={() => onSelect(i)}
                            className={cn(
                                "flex h-10 w-full cursor-pointer snap-center items-center justify-center text-base tabular-nums transition-colors",
                                i === centered
                                    ? "font-semibold text-mauria-purple dark:text-white"
                                    : "text-muted-foreground"
                            )}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

/**
 * The time picker itself: hours and minutes as side-by-side wheels (plus
 * AM/PM in 12 h locales), centered on the current value. Closing happens
 * through the field toggle, the wheels never dismiss on their own.
 */
export const TimeGrid = ({
    value,
    hour12,
    onChange,
}: {
    value: string;
    hour12: boolean;
    onChange: (time: string) => void;
}) => {
    const [hours = 0, minutes = 0] = value.split(":").map(Number);
    const isPm = hours >= 12;

    const setTime = (h: number, m: number) => onChange(`${pad(h)}:${pad(m)}`);

    const hourOptions = hour12
        ? ["12", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"]
        : Array.from({ length: 24 }, (_, i) => pad(i));
    const minuteOptions = MINUTES.map((m) => pad(m));
    const shownHour = hour12 ? hours % 12 || 12 : hours;
    // A value the wheel can't show exactly (23:59) centers on the closest
    // row below rather than rewriting it.
    const minuteIndex = Math.min(Math.floor(minutes / 5), MINUTES.length - 1);

    return (
        <div className="flex items-start justify-center gap-6 pt-2">
            {hour12 && (
                <WheelColumn
                    className="w-14"
                    options={["AM", "PM"]}
                    selected={isPm ? 1 : 0}
                    onSelect={(i) =>
                        setTime((hours % 12) + (i ? 12 : 0), minutes)
                    }
                />
            )}
            <WheelColumn
                className="w-16"
                options={hourOptions}
                selected={hour12 ? hourOptions.indexOf(String(shownHour)) : hours}
                onSelect={(i) =>
                    setTime(
                        hour12
                            ? (Number(hourOptions[i]) % 12) + (isPm ? 12 : 0)
                            : i,
                        minutes
                    )
                }
            />
            <WheelColumn
                className="w-16"
                options={minuteOptions}
                selected={minuteIndex}
                onSelect={(i) => setTime(hours, i * 5)}
            />
        </div>
    );
};
