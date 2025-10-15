import { TaskData } from "@/types/data";
import { getFromStorage, saveToStorage } from "./storage";

type StoredTask = Omit<TaskData, "date"> & { date: string };

export function saveTaskToLocalStorage({ task }: { task: TaskData }) {
    const existingTasks = JSON.parse(
        getFromStorage("tasks") ?? "[]"
    ) as StoredTask[];
    existingTasks.push({
        ...task,
        date: new Date(task.date).toISOString(),
    });
    saveToStorage("tasks", JSON.stringify(existingTasks));
}

export function getTasksFromLocalStorage(): TaskData[] {
    const tasks = JSON.parse(getFromStorage("tasks") ?? "[]") as StoredTask[];
    return tasks.map((task) => ({
        ...task,
        date: new Date(task.date),
    }));
}

export function removeTaskFromLocalStorage({ taskId }: { taskId: string }) {
    const existingTasks = JSON.parse(
        getFromStorage("tasks") ?? "[]"
    ) as StoredTask[];
    const updatedTasks = existingTasks.filter((task) => task.id !== taskId);
    saveToStorage("tasks", JSON.stringify(updatedTasks));
}

export function updateTaskInLocalStorage({ task }: { task: TaskData }) {
    const existingTasks = JSON.parse(
        getFromStorage("tasks") ?? "[]"
    ) as StoredTask[];

    const updatedTasks = existingTasks.map((storedTask) =>
        storedTask.id === task.id
            ? {
                  ...storedTask,
                  task: task.task,
                  date: new Date(task.date).toISOString(),
              }
            : storedTask
    );

    saveToStorage("tasks", JSON.stringify(updatedTasks));
}
