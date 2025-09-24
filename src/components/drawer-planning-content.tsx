import { fr } from "date-fns/locale";
import { DrawerContent, DrawerTitle, Drawer } from "./ui/drawer";
import { format } from "date-fns";
import { PreparedLesson } from "@/types/home";

export function DrawerPlanningContent({
    drawerOpen,
    setDrawerOpen,
    eventInfo,
}: {
    drawerOpen: boolean;
    setDrawerOpen: (open: boolean) => void;
    eventInfo: PreparedLesson | null;
}) {
    return (
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
            <DrawerContent aria-describedby={undefined}>
                {eventInfo && (
                    <div className="p-4 mb-4">
                        <DrawerTitle className="text-2xl font-bold mb-4 text-mauria-light-purple dark:text-white">
                            {eventInfo.courseTitle}
                        </DrawerTitle>

                        {eventInfo.courseTitle && (
                            <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <p className="mb-2">
                                    <span className="font-semibold">
                                        Cours :
                                    </span>{" "}
                                    {eventInfo.courseTitle}
                                </p>
                                {eventInfo.location && (
                                    <p className="mb-2">
                                        <span className="font-semibold">
                                            Lieu :
                                        </span>{" "}
                                        {eventInfo.location}
                                    </p>
                                )}
                                {eventInfo.type && (
                                    <p className="mb-2">
                                        <span className="font-semibold">
                                            Type :
                                        </span>{" "}
                                        {eventInfo.type}
                                    </p>
                                )}
                                {eventInfo.teacher && (
                                    <p className="mb-2">
                                        <span className="font-semibold">
                                            Enseignant(e) :
                                        </span>{" "}
                                        {eventInfo.teacher}
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="space-y-2">
                            <p>
                                <span className="font-semibold">Début :</span>{" "}
                                {format(
                                    new Date(eventInfo.details.start),
                                    "EEEE d MMM HH'h'mm",
                                    { locale: fr }
                                )}
                            </p>
                            <p>
                                <span className="font-semibold">Fin :</span>{" "}
                                {format(
                                    new Date(eventInfo.details.end),
                                    "EEEE d MMM HH'h'mm",
                                    { locale: fr }
                                )}
                            </p>
                            <p>
                                <span className="font-semibold">Durée :</span>{" "}
                                {(() => {
                                    const start = new Date(
                                        eventInfo.details.start
                                    );
                                    const end = new Date(eventInfo.details.end);
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

                        <details className="mt-4">
                            <summary className="font-semibold cursor-pointer text-mauria-light-purple dark:text-gray-300">
                                Détails
                            </summary>
                            <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                <p>
                                    <span className="font-medium">ID :</span>{" "}
                                    {eventInfo.details.id}
                                </p>
                                <p>
                                    <span className="font-medium">
                                        Titre complet :
                                    </span>{" "}
                                    {eventInfo.details.title}
                                </p>
                                <p>
                                    <span className="font-medium">
                                        Toute la journée :
                                    </span>{" "}
                                    {eventInfo.details.allDay ? "Oui" : "Non"}
                                </p>
                            </div>
                        </details>
                    </div>
                )}
            </DrawerContent>
        </Drawer>
    );
}
