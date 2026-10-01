import { TaskData } from "@/types/data";
import { getFromStorage, saveToStorage } from "./storage";

type StoredTask = Omit<TaskData, "date"> & { date: string };

const readTasks = () =>
    JSON.parse(getFromStorage("tasks") ?? "[]") as StoredTask[];

const writeTasks = (tasks: StoredTask[]) =>
    saveToStorage("tasks", JSON.stringify(tasks));

/** Add the task, or replace the stored one carrying the same id. */
export function saveTaskToLocalStorage({ task }: { task: TaskData }) {
    const stored: StoredTask = {
        ...task,
        date: new Date(task.date).toISOString(),
    };
    const existingTasks = readTasks();
    const index = existingTasks.findIndex((t) => t.id === task.id);
    if (index === -1) {
        existingTasks.push(stored);
    } else {
        existingTasks[index] = stored;
    }
    writeTasks(existingTasks);
}

export function getTasksFromLocalStorage(): TaskData[] {
    return readTasks()
        .map((task) => ({ ...task, date: new Date(task.date) }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function removeTaskFromLocalStorage({ taskId }: { taskId: string }) {
    writeTasks(readTasks().filter((task) => task.id !== taskId));
}
