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
