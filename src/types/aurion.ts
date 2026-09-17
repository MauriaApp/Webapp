export type Absence = {
    date: string;
    type: string;
    duration: string;
    time: string;
    class: string;
    teacher: string;
};

export type Grade = {
    date: string;
    code: string;
    name: string;
    grade: string;
    coefficient: string;
    average: string;
    min: string;
    max: string;
    median: string;
    standardDeviation: string;
    comment: string;
};

export type Lesson = {
    id: string;
    title: string;
    start: string;
    end: string;
    allDay: boolean;
    editable: boolean;
    className: string;
};

export type AurionDocument = {
    label: string;
    type: string;
    size: string;
    comment: string;
    category: string;
    docIndex: number;
    downloadType: "datagrid" | "select" | "consulter";
    submitParam: string;
    selectName?: string;
    optionValue?: string;
    downloadButtonParam?: string;
    consulterParam?: string;
};

export type DocumentCategory = {
    menuid: string;
    label: string;
};

export type DocumentsResult = {
    categories: DocumentCategory[];
    documents: AurionDocument[];
};
