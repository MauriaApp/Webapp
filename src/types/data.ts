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

export type ToolData = {
    buttonTitle: string;
    description: string;
    url: string;
};

export type TaskData = {
    id: string;
    task: string;
    date: Date;
};
