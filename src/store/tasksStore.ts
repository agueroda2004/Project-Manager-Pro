import { create } from "zustand";
import type { Task, TaskDraft, TaskStatus } from "../types";
import * as svc from "../services/tasksService";
import { logActivity } from "../services/activitiesService";
import { isTaskBlocked, getEffectiveStatus } from "../utils/dependencies";

interface TasksState {
  items: Task[];
  loaded: boolean;
  loading: boolean;
  load: () => Promise<void>;
  create: (data: TaskDraft) => Promise<Task>;
  update: (id: string, patch: Partial<TaskDraft>) => Promise<Task | null>;
  changeStatus: (id: string, status: TaskStatus) => Promise<Task | null>;
  remove: (id: string) => Promise<boolean>;
  getById: (id: string) => Task | undefined;
  replaceAll: (items: Task[]) => void;
}

export const useTasksStore = create<TasksState>((set, get) => ({
  items: [],
  loaded: false,
  loading: false,

  load: async () => {
    if (get().loaded || get().loading) return;
    set({ loading: true });
    const items = await svc.listTasks();
    set({ items, loaded: true, loading: false });
  },

  create: async (data) => {
    const task = await svc.createTask(data);
    set({ items: [task, ...get().items] });
    await logActivity("task_created", task.id, "task", `Tarea "${task.title}" creada`);
    return task;
  },

  update: async (id, patch) => {
    const updated = await svc.updateTask(id, patch);
    if (updated) {
      set({ items: get().items.map((t) => (t.id === id ? updated : t)) });
      await logActivity("task_updated", updated.id, "task", `Tarea "${updated.title}" actualizada`);
    }
    return updated;
  },

  changeStatus: async (id, status) => {
    const current = get().items.find((t) => t.id === id);
    if (!current) return null;
    if (status !== "pendiente" && status !== "bloqueado") {
      const blocked = isTaskBlocked({ ...current, status }, get().items);
      if (blocked) {
        return get().update(id, { status: "bloqueado" });
      }
    }
    const updated = await svc.updateTask(id, { status });
    if (updated) {
      set({ items: get().items.map((t) => (t.id === id ? updated : t)) });
      if (status === "terminado") {
        await logActivity("task_completed", updated.id, "task", `Tarea "${updated.title}" completada`);
      } else {
        await logActivity("task_status_changed", updated.id, "task", `Tarea "${updated.title}" cambió a ${status}`);
      }
    }
    return updated;
  },

  remove: async (id) => {
    const ok = await svc.deleteTask(id);
    if (ok) {
      set({
        items: get().items
          .filter((t) => t.id !== id)
          .map((t) => ({ ...t, dependsOn: t.dependsOn.filter((d) => d !== id) })),
      });
    }
    return ok;
  },

  getById: (id) => get().items.find((t) => t.id === id),

  replaceAll: (items) => {
    svc.setTasksCache(items);
    set({ items, loaded: true });
  },
}));

export function useEffectiveStatus(task: Task | undefined): TaskStatus {
  const items = useTasksStore((s) => s.items);
  if (!task) return "pendiente";
  return getEffectiveStatus(task, items);
}
