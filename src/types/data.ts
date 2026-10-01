import { Lesson } from "./aurion";

export type AssociationData = {
    name: string;
    description: string;
    contact: string;
    image: string;
};

export type MessageEntry = {
    title: string;
    message: string;
};

export type UpdatesEntry = {
    version: string;
    date: string;
    titleVisu: string;
    contentVisu: string;
    titleDev: string;
    contentDev: string;
};

/**
 * A personal event added from the planning page. Stored alongside Aurion
 * lessons (same shape), with the fields a free-form event needs on top.
 */
export type UserEvent = Lesson & {
    location?: string;
    notes?: string;
};

export type TaskData = {
    id: string;
    task: string;
    /** When it's due. */
    date: Date;
    notes?: string;
};

export type MenuSection = {
    title: string;
    items: string[];
};

export type RestaurantMenu = {
    id: string;
    name: string;
    page: number;
    sections: MenuSection[];
};

export type DailyMenu = {
    date: string | null;
    pdfUrl: string;
    restaurants: RestaurantMenu[];
};
