export type Building = {
    /** Building code as used by findmyroom, e.g. "IC2", "PR_39BV". */
    code: string;
    nom: string;
    dispo: number;
    total: number;
    pourcentage: number;
    /** Rooms still reported free past their closing time (set by API-v2). */
    fermees?: number;
};

export type RoomStatus = "DISPONIBLE" | "OCCUPEE" | "FERMEE";

export type Room = {
    salle: string;
    statut: RoomStatus;
    capacite: number | null;
    type_salle: string | null;
    libre_jusqua: string | null;
    libre_jusqua_en: string | null;
    duree_max: string | null;
    duree_max_en: string | null;
};

export type RoomsForBuilding = {
    date: string;
    heure: string;
    salles: Room[];
};
