import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { TaskData } from "@/types/data";
import { getFromStorage, saveToStorage } from "./storage";

const NOTIF_PERMISSION_KEY = "notifications_permission";
const NOTIF_ID_COUNTER_KEY = "notification_id_counter";

type NotifPermission = "granted" | "denied" | "not-asked";

export function getStoredNotificationPermission(): NotifPermission {
    const stored = getFromStorage(NOTIF_PERMISSION_KEY);
    if (stored === "granted" || stored === "denied") return stored;
    return "not-asked";
}

function setStoredNotificationPermission(status: "granted" | "denied") {
    saveToStorage(NOTIF_PERMISSION_KEY, status);
}

function nextNotifIds(): [number, number] {
    const counter = parseInt(
        getFromStorage(NOTIF_ID_COUNTER_KEY) ?? "0",
        10
    );
    const id1 = counter + 1;
    const id2 = counter + 2;
    saveToStorage(NOTIF_ID_COUNTER_KEY, String(id2));
    return [id1, id2];
}

export async function requestNotificationPermission(): Promise<
    "granted" | "denied"
> {
    if (!Capacitor.isNativePlatform()) return "denied";

    const stored = getStoredNotificationPermission();
    if (stored !== "not-asked") return stored;

    const result = await LocalNotifications.requestPermissions();
    const status = result.display === "granted" ? "granted" : "denied";
    setStoredNotificationPermission(status);
    return status;
}

export async function scheduleTaskNotifications(
    task: TaskData
): Promise<number[]> {
    if (!Capacitor.isNativePlatform()) return [];

    const permission = getStoredNotificationPermission();
    if (permission !== "granted") return [];

    const taskTime = task.date.getTime();
    const now = Date.now();

    const time24h = taskTime - 24 * 60 * 60 * 1000;
    const time1h = taskTime - 60 * 60 * 1000;
    const needs24h = time24h > now;
    const needs1h = time1h > now;

    if (!needs24h && !needs1h) return [];

    const [id24h, id1h] = nextNotifIds();
    const notifications: {
        id: number;
        title: string;
        body: string;
        schedule: { at: Date };
    }[] = [];

    if (needs24h) {
        notifications.push({
            id: id24h,
            title: "Rappel de tâche",
            body: `"${task.task}" est dans 24h`,
            schedule: { at: new Date(time24h) },
        });
    }

    if (needs1h) {
        notifications.push({
            id: id1h,
            title: "Rappel de tâche",
            body: `"${task.task}" est dans 1h`,
            schedule: { at: new Date(time1h) },
        });
    }

    await LocalNotifications.schedule({ notifications });
    return notifications.map((n) => n.id);
}

export async function cancelTaskNotifications(
    notificationIds: number[]
): Promise<void> {
    if (!Capacitor.isNativePlatform() || notificationIds.length === 0) return;
    await LocalNotifications.cancel({
        notifications: notificationIds.map((id) => ({ id })),
    });
}
