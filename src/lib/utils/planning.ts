import { Lesson } from "@/types/aurion";
import { getFromStorage, saveToStorage } from "./storage";

export function saveUserEventToLocalStorage({
    userEvent,
}: {
    userEvent: Lesson;
}) {
    const existingUserEvents = JSON.parse(
        getFromStorage("userEvents") || "[]"
    ) as Lesson[];
    existingUserEvents.push(userEvent);
    saveToStorage("userEvents", JSON.stringify(existingUserEvents));
}

export function getUserEventsFromLocalStorage(): Lesson[] {
    const userEvents = JSON.parse(
        getFromStorage("userEvents") || "[]"
    ) as Lesson[];
    return userEvents.map((ue) => ({
        ...ue,
        start: new Date(ue.start).toISOString(),
        end: new Date(ue.end).toISOString(),
    }));
}

export function removeUserEventFromLocalStorage({
    userEventId,
}: {
    userEventId: string;
}) {
    const existingUserEvents = JSON.parse(
        getFromStorage("userEvents") || "[]"
    ) as Lesson[];
    const updatedUserEvents = existingUserEvents.filter(
        (ue) => ue.id !== userEventId
    );
    saveToStorage("userEvents", JSON.stringify(updatedUserEvents));
}
