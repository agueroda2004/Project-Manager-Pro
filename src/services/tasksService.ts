import { readJson, writeJson } from "./jsonStorage";
import { uid } from "../utils/id";
import { nowISO } from "../utils/dates";
import type { Task, TaskDraft } from "../types";

const ENTITY = "tasks";
const URL = "/data/tasks.json";

let cache: Task[] | null = null;

export async function listTasks(): Promise<Task[]> {
  if (!cache) cache = await readJson<Task>(ENTITY, URL);
  return cache;
}

export function getTasksSync(): Task[] {
  return cache ?? [];
}

export function setTasksCache(data: Task[]): void {
  cache = data;
  writeJson(ENTITY, data);
}

export async function createTask(data: TaskDraft): Promise<Task> {
  const list = await listTasks();
  const task: Task = {
    ...data,
    id: uid("tsk"),
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
  const next = [task, ...list];
  setTasksCache(next);
  return task;
}

export async function updateTask(id: string, patch: Partial<TaskDraft>): Promise<Task | null> {
  const list = await listTasks();
  const idx = list.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  const updated: Task = { ...list[idx], ...patch, updatedAt: nowISO() };
  const next = [...list];
  next[idx] = updated;
  setTasksCache(next);
  return updated;
}

export async function deleteTask(id: string): Promise<boolean> {
  const list = await listTasks();
  const next = list.filter((t) => t.id !== id);
  const cleaned = next.map((t) => ({
    ...t,
    dependsOn: t.dependsOn.filter((d) => d !== id),
  }));
  if (cleaned.length === list.length && JSON.stringify(cleaned) === JSON.stringify(next)) {
    return false;
  }
  setTasksCache(cleaned);
  return true;
}
