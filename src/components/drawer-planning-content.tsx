import { fr } from "date-fns/locale";
import { DrawerContent, DrawerTitle, Drawer } from "./ui/drawer";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { PreparedLesson } from "@/types/home";
import {
    BookOpen,
    MapPin,
    Tag,
    User,
    Clock,
    Timer,
    Info,
    ChevronDownIcon,
    CalendarDays,
} from "lucide-react";
import { formatLessonType } from "@/lib/utils/home";
import { useTranslation } from "react-i18next";
import { useState } from "react";

export function DrawerPlanningContent({
    drawerOpen,
    setDrawerOpen,
    eventInfo,
}: {
    drawerOpen: boolean;
    setDrawerOpen: (open: boolean) => void;
    eventInfo: PreparedLesson | null;
}) {
    const { t } = useTranslation();
    const [isTechnicalDetailsOpen, setIsTechnicalDetailsOpen] = useState(false);
    return (
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
            <DrawerContent aria-describedby={undefined}>
                {eventInfo && (
                    <div className="p-6">
                        <DrawerTitle className="text-2xl font-bold mb-6 text-mauria-purple dark:text-white oled:text-gray-100 flex items-center gap-2">
                            <BookOpen className="w-6 h-6" />
                            {eventInfo.courseTitle}
                        </DrawerTitle>

                        <div className="mb-4 space-y-2">
                            {eventInfo.location && (
                                <div className="flex items-center gap-3 px-3 py-1">
                                    <MapPin className="w-5 h-5 shrink-0 text-mauria-purple dark:text-gray-300 oled:text-gray-300" />
                                    <div>
                                        <span className="font-semibold text-muted-foreground text-sm">
                                            {t("drawerPlanningContent.place")}
                                        </span>
                                        <p className="text-gray-900 dark:text-white">
                                            {eventInfo.location}
                                        </p>
                                    </div>
                                </div>
                            )}
                            {eventInfo.type && (
                                <div className="flex items-center gap-3 px-3 py-1">
                                    <Tag className="w-5 h-5 shrink-0 text-mauria-purple dark:text-gray-300 oled:text-gray-300" />
                                    <div>
                                        <span className="font-semibold text-muted-foreground text-sm">
                                            {t("drawerPlanningContent.type")}
                                        </span>
                                        <p className="text-gray-900 dark:text-white">
                                            {formatLessonType(eventInfo.type)}
                                        </p>
                                    </div>
                                </div>
                            )}
                            {eventInfo.teacher && (
                                <div className="flex items-center gap-3 px-3 py-1">
                                    <User className="w-5 h-5 shrink-0 text-mauria-purple dark:text-gray-300 oled:text-gray-300" />
                                    <div>
                                        <span className="font-semibold text-muted-foreground text-sm">
                                            {t("drawerPlanningContent.teacher")}
                                        </span>
                                        <p className="text-gray-900 dark:text-white">
                                            {eventInfo.teacher}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {(eventInfo.location || eventInfo.type || eventInfo.teacher) && (
                            <Separator className="my-6" />
                        )}

                        <div className="p-4 rounded-lg grid w-full grid-cols-2 gap-2 min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                                <CalendarDays className="w-4 h-4 shrink-0 text-mauria-purple dark:text-gray-300 oled:text-gray-300" />
                                <div className="min-w-0">
                                    <span className="font-semibold text-muted-foreground text-xs">
                                        {t("drawerPlanningContent.date")}
                                    </span>
                                    <p className="text-gray-900 dark:text-white truncate">
                                        {format(
                                            new Date(eventInfo.details.start),
                                            "EEEE d MMM",
                                            { locale: fr }
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 min-w-0">
                                <Timer className="w-4 h-4 shrink-0 text-mauria-purple dark:text-gray-300" />
                                <div className="min-w-0">
                                    <span className="font-semibold text-muted-foreground text-xs">
                                        {t("drawerPlanningContent.duration")}
                                    </span>
                                    <p className="text-gray-900 dark:text-white truncate">
                                        {(() => {
                                            const start = new Date(
                                                eventInfo.details.start
                                            );
                                            const end = new Date(
                                                eventInfo.details.end
                                            );
                                            const diffMs =
                                                end.getTime() - start.getTime();
                                            const hours = Math.floor(
                                                diffMs / (1000 * 60 * 60)
                                            );
                                            const minutes = Math.floor(
                                                (diffMs % (1000 * 60 * 60)) /
                                                    (1000 * 60)
                                            );

                                            if (hours === 0) {
                                                return `${minutes} min`;
                                            } else if (minutes === 0) {
                                                return `${hours}h`;
                                            } else {
                                                return `${hours}h${minutes
                                                    .toString()
                                                    .padStart(2, "0")}`;
                                            }
                                        })()}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 min-w-0">
                                <Clock className="w-4 h-4 shrink-0 text-green-600 dark:text-green-400 oled:text-gray-300" />
                                <div className="min-w-0">
                                    <span className="font-semibold text-muted-foreground text-xs">
                                        {t("drawerPlanningContent.starting")}
                                    </span>
                                    <p className="text-gray-900 dark:text-white truncate">
                                        {format(
                                            new Date(eventInfo.details.start),
                                            "HH'h'mm",
                                            { locale: fr }
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 min-w-0">
                                <Clock className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400 oled:text-gray-300" />
                                <div className="min-w-0">
                                    <span className="font-semibold text-muted-foreground text-xs">
                                        {t("drawerPlanningContent.ending")}
                                    </span>
                                    <p className="text-gray-900 dark:text-white truncate">
                                        {format(
                                            new Date(eventInfo.details.end),
                                            "HH'h'mm",
                                            { locale: fr }
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <details
                            className="mt-6"
                            onToggle={(event) =>
                                setIsTechnicalDetailsOpen(
                                    event.currentTarget.open
                                )
                            }
                        >
                            <summary className="font-semibold cursor-pointer text-mauria-purple dark:text-gray-300 oled:text-gray-200 flex items-center gap-2 hover:text-mauria-purple/80 oled:hover:text-gray-200 transition-colors">
                                <Info className="w-4 h-4" />
                                {t("drawerPlanningContent.technicalDetails")}
                                <ChevronDownIcon
                                    className={`w-4 h-4 ml-auto transition-transform ${
                                        isTechnicalDetailsOpen
                                            ? "rotate-0"
                                            : "rotate-180"
                                    }`}
                                />
                            </summary>
                            <div className="mt-3 space-y-2 p-3 rounded-lg">
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="font-medium">{t("common.id")} :</span>
                                    <span className="text-gray-600 dark:text-gray-400">
                                        {eventInfo.details.id}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="font-medium">
                                        {t("drawerPlanningContent.formerTitle")} :
                                    </span>
                                    <span className="text-gray-600 dark:text-gray-400">
                                        {eventInfo.details.title}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="font-medium">
                                        {t("drawerPlanningContent.allDay")} :
                                    </span>
                                    <span className="text-gray-600 dark:text-gray-400">
                                        {eventInfo.details.allDay
                                            ? "Oui"
                                            : "Non"}
                                    </span>
                                </div>
                            </div>
                        </details>
                    </div>
                )}
            </DrawerContent>
        </Drawer>
    );
}
