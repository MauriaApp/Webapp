import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { DoorOpen, Users } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import { fadeIn, staggerGroup } from "@/lib/motion";
import { cn } from "@/lib/utils/cn";
import { fetchBuildings, fetchRoomsForBuilding } from "@/lib/api/findmyroom";
import {
    computeBookableUntil,
    formatBuildingName,
    formatRoomName,
    formatTimeOfDay,
    getCommonPrefixTokenCount,
    isRedundantAllDayDuration,
    splitHighlight,
    stripRedundantFreeLabel,
} from "@/lib/utils/findmyroom";
import { Building, Room } from "@/types/findmyroom";

// Availability thresholds mirrored from findmyroom's own badge logic
// (>=50% good, >=20% limited, otherwise almost full).
function getAvailabilityLevel(dispo: number, total: number) {
    if (total === 0) return "unknown";
    const ratio = dispo / total;
    if (ratio >= 0.5) return "good";
    if (ratio >= 0.2) return "warning";
    return "critical";
}

const LEVEL_STYLES: Record<string, string> = {
    good: "text-mauria-green",
    warning: "text-mauria-accent",
    critical: "text-destructive",
    unknown: "text-muted-foreground",
};

const LEVEL_PROGRESS: Record<string, string> = {
    good: "[&>div]:bg-mauria-green",
    warning: "[&>div]:bg-mauria-accent",
    critical: "[&>div]:bg-destructive",
    unknown: "",
};

function BuildingCardSkeleton() {
    return (
        <Card className="flex flex-col gap-3 border-none bg-white p-4 shadow-md dark:bg-mauria-card">
            <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
        </Card>
    );
}

/** Renders a findmyroom sentence with its one figure (time/duration) bolded. */
function HighlightedText({
    text,
    isEnglish,
}: {
    text: string;
    isEnglish: boolean;
}) {
    const parts = splitHighlight(text, isEnglish);
    if (!parts) return <>{text}</>;

    return (
        <>
            {parts.prefix}
            <strong className="font-semibold text-foreground">
                {parts.highlight}
            </strong>
            {parts.suffix}
        </>
    );
}

function RoomRow({
    room,
    displayName,
    isEnglish,
}: {
    room: Room;
    displayName: string;
    isEnglish: boolean;
}) {
    const { t } = useTranslation();
    const isFree = room.statut === "DISPONIBLE";
    const info = isEnglish
        ? room.libre_jusqua_en || room.libre_jusqua
        : room.libre_jusqua;
    const duration = isEnglish
        ? room.duree_max_en || room.duree_max
        : room.duree_max;
    const bookableUntil =
        info && duration
            ? computeBookableUntil(info, duration, isEnglish)
            : null;
    // "Réservable toute la journée" only ever restates "libre jusqu'à
    // <heure>" shown just above — not worth a second line.
    const showDuration = !!duration && !isRedundantAllDayDuration(duration);

    return (
        <div
            className={cn(
                "flex items-center gap-3 rounded-lg border p-3",
                isFree
                    ? "border-mauria-green/30 bg-mauria-green/5"
                    : "border-destructive/30 bg-destructive/5"
            )}
        >
            <span
                className={cn(
                    "h-2.5 w-2.5 shrink-0 rounded-full",
                    isFree ? "bg-mauria-green" : "bg-destructive"
                )}
                aria-hidden
            />
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-foreground">
                        {displayName}
                    </p>
                    {room.capacite != null && (
                        <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" />
                            {room.capacite}
                        </span>
                    )}
                </div>
                {room.type_salle && (
                    <p className="truncate text-xs text-muted-foreground">
                        {room.type_salle}
                    </p>
                )}
            </div>
            <div className="shrink-0 text-right">
                <p
                    className={cn(
                        "text-xs font-semibold",
                        isFree ? "text-mauria-green" : "text-destructive"
                    )}
                >
                    {isFree
                        ? t("schedulePage.freeRooms.statusFree")
                        : t("schedulePage.freeRooms.statusBusy")}
                </p>
                {info && (
                    <p className="text-xs text-muted-foreground">
                        <HighlightedText
                            text={stripRedundantFreeLabel(info, isFree)}
                            isEnglish={isEnglish}
                        />
                    </p>
                )}
                {showDuration &&
                    (bookableUntil ? (
                        <p className="text-[11px] italic text-muted-foreground">
                            {t("schedulePage.freeRooms.untilPrefix")}{" "}
                            <strong className="font-semibold text-foreground">
                                {bookableUntil}
                            </strong>
                        </p>
                    ) : (
                        <p className="text-[11px] italic text-muted-foreground">
                            <HighlightedText
                                text={duration}
                                isEnglish={isEnglish}
                            />
                        </p>
                    ))}
            </div>
        </div>
    );
}

export function FreeRoomsView() {
    const { t, i18n } = useTranslation();
    const isEnglish = i18n.language === "en";
    const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(
        null
    );
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const {
        data: buildings = [],
        isLoading: buildingsLoading,
        isError: buildingsError,
    } = useQuery<Building[]>({
        queryKey: ["findmyroom", "buildings"],
        queryFn: async () => (await fetchBuildings()) ?? [],
        staleTime: 20 * 1000,
        gcTime: 1000 * 60 * 10,
        refetchInterval: 30 * 1000,
        placeholderData: (previousData) => previousData,
    });

    const {
        data: roomsData,
        isLoading: roomsLoading,
        isError: roomsError,
    } = useQuery({
        queryKey: ["findmyroom", "rooms", selectedBuilding?.code],
        queryFn: () => fetchRoomsForBuilding(selectedBuilding!.code),
        enabled: !!selectedBuilding,
        staleTime: 20 * 1000,
        gcTime: 1000 * 60 * 10,
        refetchInterval: isDrawerOpen ? 30 * 1000 : false,
    });

    const sortedRooms = useMemo(() => {
        if (!roomsData?.salles) return [];
        return [...roomsData.salles].sort((a, b) => {
            if (a.statut !== b.statut) {
                return a.statut === "DISPONIBLE" ? -1 : 1;
            }
            return a.salle.localeCompare(b.salle);
        });
    }, [roomsData]);

    // Every room in a building shares a redundant leading code (e.g. all of
    // IC2's rooms start with "IC2_") that we can drop once the building is
    // already shown as the drawer's context.
    const roomPrefixTokens = useMemo(
        () => getCommonPrefixTokenCount(sortedRooms.map((room) => room.salle)),
        [sortedRooms]
    );

    const handleBuildingClick = (building: Building) => {
        setSelectedBuilding(building);
        setIsDrawerOpen(true);
    };

    return (
        <motion.div
            variants={staggerGroup}
            initial="hidden"
            animate="show"
            className="space-y-4 pb-4"
        >
            {buildingsError && (
                <motion.p
                    variants={fadeIn}
                    className="text-center text-sm text-destructive"
                >
                    {t("schedulePage.freeRooms.error")}
                </motion.p>
            )}

            <motion.div
                variants={fadeIn}
                className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
            >
                {buildingsLoading &&
                    Array.from({ length: 4 }).map((_, i) => (
                        <BuildingCardSkeleton key={i} />
                    ))}

                {!buildingsLoading &&
                    buildings.map((building) => {
                        const level = getAvailabilityLevel(
                            building.dispo,
                            building.total
                        );
                        return (
                            <Card
                                key={building.code}
                                onClick={() => handleBuildingClick(building)}
                                className="flex cursor-pointer flex-col gap-3 border-none bg-white p-4 shadow-md transition-transform duration-150 hover:-translate-y-0.5 dark:bg-mauria-card"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex min-w-0 items-center gap-2">
                                        <DoorOpen className="h-5 w-5 shrink-0 text-mauria-purple dark:text-mauria-accent" />
                                        <span className="truncate text-sm font-semibold text-foreground">
                                            {formatBuildingName(building.nom)}
                                        </span>
                                    </div>
                                    <span
                                        className={cn(
                                            "shrink-0 text-sm font-bold",
                                            LEVEL_STYLES[level]
                                        )}
                                    >
                                        {building.dispo}/{building.total}
                                    </span>
                                </div>
                                <Progress
                                    value={building.pourcentage}
                                    className={cn(
                                        "h-2",
                                        LEVEL_PROGRESS[level]
                                    )}
                                />
                            </Card>
                        );
                    })}
            </motion.div>

            {!buildingsLoading && buildings.length === 0 && !buildingsError && (
                <motion.p
                    variants={fadeIn}
                    className="text-center text-sm text-muted-foreground"
                >
                    {t("schedulePage.freeRooms.empty")}
                </motion.p>
            )}

            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                <DrawerContent className="bg-card border-border pb-safe">
                    {selectedBuilding && (
                        <div className="w-full px-4 pb-6 sm:px-6">
                            <DrawerHeader className="px-0 text-left">
                                <DrawerTitle className="text-2xl font-semibold text-foreground">
                                    {formatBuildingName(selectedBuilding.nom)}
                                </DrawerTitle>
                                <DrawerDescription>
                                    {roomsData
                                        ? t(
                                              "schedulePage.freeRooms.updatedAt",
                                              {
                                                  time: formatTimeOfDay(
                                                      roomsData.heure,
                                                      isEnglish
                                                  ),
                                              }
                                          )
                                        : t("schedulePage.freeRooms.loading")}
                                </DrawerDescription>
                            </DrawerHeader>

                            <div className="max-h-[60vh] space-y-2 overflow-y-auto pt-2">
                                {roomsLoading &&
                                    Array.from({ length: 4 }).map((_, i) => (
                                        <Skeleton
                                            key={i}
                                            className="h-16 w-full rounded-lg"
                                        />
                                    ))}

                                {roomsError && (
                                    <p className="text-center text-sm text-destructive">
                                        {t("schedulePage.freeRooms.error")}
                                    </p>
                                )}

                                {!roomsLoading &&
                                    sortedRooms.map((room) => (
                                        <RoomRow
                                            key={room.salle}
                                            room={room}
                                            displayName={formatRoomName(
                                                room.salle,
                                                roomPrefixTokens
                                            )}
                                            isEnglish={isEnglish}
                                        />
                                    ))}
                            </div>
                        </div>
                    )}
                </DrawerContent>
            </Drawer>
        </motion.div>
    );
}
