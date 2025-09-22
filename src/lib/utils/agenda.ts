import { TaskData } from "@/types/data";

export function saveTaskToLocalStorage({ task }: { task: TaskData }) {
    const existingTasks = JSON.parse(
        localStorage.getItem("tasks") || "[]"
    ) as TaskData[];
    existingTasks.push(task);
    localStorage.setItem("tasks", JSON.stringify(existingTasks));
}

export function getTasksFromLocalStorage(): TaskData[] {
    const tasks = JSON.parse(
        localStorage.getItem("tasks") || "[]"
    ) as TaskData[];
    return tasks.map((task) => ({
        ...task,
        date: new Date(task.date),
    }));
}

export function removeTaskFromLocalStorage({ taskId }: { taskId: string }) {
    const existingTasks = JSON.parse(
        localStorage.getItem("tasks") || "[]"
    ) as TaskData[];
    const updatedTasks = existingTasks.filter((task) => task.id !== taskId);
    localStorage.setItem("tasks", JSON.stringify(updatedTasks));
}
