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

export type TaskData = {
    id: string;
    task: string;
    date: Date;
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
