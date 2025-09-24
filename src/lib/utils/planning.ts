import { Lesson } from "@/types/aurion";

export function saveUserEventToLocalStorage({
    userEvent,
}: {
    userEvent: Lesson;
}) {
    const existingUserEvents = JSON.parse(
        localStorage.getItem("userEvents") || "[]"
    ) as Lesson[];
    existingUserEvents.push(userEvent);
    localStorage.setItem("userEvents", JSON.stringify(existingUserEvents));
}

export function getUserEventsFromLocalStorage(): Lesson[] {
    const userEvents = JSON.parse(
        localStorage.getItem("userEvents") || "[]"
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
        localStorage.getItem("userEvents") || "[]"
    ) as Lesson[];
    const updatedUserEvents = existingUserEvents.filter(
        (ue) => ue.id !== userEventId
    );
    localStorage.setItem("userEvents", JSON.stringify(updatedUserEvents));
}
