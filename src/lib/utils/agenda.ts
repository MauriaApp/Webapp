import { TaskData } from "@/types/data";
import { getFromStorage, saveToStorage } from "./storage";

export function saveTaskToLocalStorage({ task }: { task: TaskData }) {
    const existingTasks = JSON.parse(
        getFromStorage("tasks") ?? "[]"
    ) as TaskData[];
    existingTasks.push(task);
    saveToStorage("tasks", JSON.stringify(existingTasks));
}

export function getTasksFromLocalStorage(): TaskData[] {
    const tasks = JSON.parse(getFromStorage("tasks") ?? "[]") as TaskData[];
    return tasks.map((task) => ({
        ...task,
        date: new Date(task.date),
    }));
}

export function removeTaskFromLocalStorage({ taskId }: { taskId: string }) {
    const existingTasks = JSON.parse(
        getFromStorage("tasks") ?? "[]"
    ) as TaskData[];
    const updatedTasks = existingTasks.filter((task) => task.id !== taskId);
    saveToStorage("tasks", JSON.stringify(updatedTasks));
}
