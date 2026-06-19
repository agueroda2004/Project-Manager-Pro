import type { Module, Task, TaskStatus } from "../types";
import { getEffectiveStatus } from "./dependencies";

export function taskProgress(task: Task, allTasks: Task[]): number {
  const status = getEffectiveStatus(task, allTasks);
  if (status === "terminado") return 100;
  if (task.subtasks.length > 0) {
    const done = task.subtasks.filter((s) => s.done).length;
    return Math.round((done / task.subtasks.length) * 100);
  }
  if (status === "trabajando") return 50;
  if (status === "testing") return 75;
  if (status === "bloqueado") return 25;
  return 0;
}

export function moduleProgress(moduleId: string, tasks: Task[]): number {
  const list = tasks.filter((t) => t.moduleId === moduleId);
  if (list.length === 0) return 0;
  const total = list.reduce((acc, t) => acc + taskProgress(t, tasks), 0);
  return Math.round(total / list.length);
}

export function projectProgress(projectId: string, tasks: Task[]): number {
  const list = tasks.filter((t) => t.projectId === projectId);
  if (list.length === 0) return 0;
  const total = list.reduce((acc, t) => acc + taskProgress(t, tasks), 0);
  return Math.round(total / list.length);
}

export function tasksByStatus(
  tasks: Task[],
  allTasks: Task[],
): Record<TaskStatus, number> {
  const acc: Record<TaskStatus, number> = {
    pendiente: 0,
    bloqueado: 0,
    trabajando: 0,
    testing: 0,
    terminado: 0,
  };
  for (const t of tasks) {
    acc[getEffectiveStatus(t, allTasks)] += 1;
  }
  return acc;
}

export function countCompletedTasks(modules: Module[], tasks: Task[], allTasks: Task[]): number {
  const modIds = new Set(modules.map((m) => m.id));
  return tasks.filter((t) => modIds.has(t.moduleId) && getEffectiveStatus(t, allTasks) === "terminado").length;
}
