import { UserEvent } from "@/types/data";
import { getFromStorage, saveToStorage } from "./storage";

const readUserEvents = () =>
    JSON.parse(getFromStorage("userEvents") || "[]") as UserEvent[];

const writeUserEvents = (userEvents: UserEvent[]) =>
    saveToStorage("userEvents", JSON.stringify(userEvents));

/** Add the event, or replace the stored one carrying the same id. */
export function saveUserEventToLocalStorage({
    userEvent,
}: {
    userEvent: UserEvent;
}) {
    const existingUserEvents = readUserEvents();
    const index = existingUserEvents.findIndex(
        (ue) => ue.id === userEvent.id
    );
    if (index === -1) {
        existingUserEvents.push(userEvent);
    } else {
        existingUserEvents[index] = userEvent;
    }
    writeUserEvents(existingUserEvents);
}

export function getUserEventsFromLocalStorage(): UserEvent[] {
    return readUserEvents().map((ue) => ({
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
    writeUserEvents(readUserEvents().filter((ue) => ue.id !== userEventId));
}
