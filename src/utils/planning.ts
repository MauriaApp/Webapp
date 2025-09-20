import { mockPlanning } from "@/pages/mock";

export type Lesson = {
    id: string;
    title: string;
    start: string;
    end: string;
    allDay: boolean;
    editable: boolean;
    className: string;
};

export const getPlanning = (
    useMockData: boolean
): Lesson[] => {
    if (useMockData) return mockPlanning.data;

    const lessons = mockPlanning.data;

    return lessons;
}
