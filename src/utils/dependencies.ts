import type { ID, Task, TaskStatus } from "../types";

export function detectCycle(
  taskId: ID,
  newDependencies: ID[],
  allTasks: Task[],
): boolean {
  const adj = new Map<ID, ID[]>();
  for (const t of allTasks) {
    adj.set(t.id, [...t.dependsOn]);
  }
  adj.set(taskId, newDependencies);

  const WHITE = 0,
    GRAY = 1,
    BLACK = 2;
  const color = new Map<ID, number>();
  for (const id of adj.keys()) color.set(id, WHITE);

  const dfs = (node: ID): boolean => {
    color.set(node, GRAY);
    const neighbors = adj.get(node) ?? [];
    for (const n of neighbors) {
      if (!adj.has(n)) continue;
      const c = color.get(n) ?? WHITE;
      if (c === GRAY) return true;
      if (c === WHITE && dfs(n)) return true;
    }
    color.set(node, BLACK);
    return false;
  };

  return dfs(taskId);
}

export function isTaskBlocked(
  task: Task,
  allTasks: Task[],
  effectiveStatus?: TaskStatus,
): boolean {
  const status = effectiveStatus ?? task.status;
  if (status === "terminado") return false;
  if (task.dependsOn.length === 0) return false;
  const map = new Map(allTasks.map((t) => [t.id, t]));
  for (const depId of task.dependsOn) {
    const dep = map.get(depId);
    if (!dep) continue;
    if (dep.status !== "terminado") return true;
  }
  return false;
}

export function getEffectiveStatus(task: Task, allTasks: Task[]): TaskStatus {
  if (task.status === "terminado") return "terminado";
  if (isTaskBlocked(task, allTasks)) return "bloqueado";
  return task.status;
}

export function getDependencyTree(
  taskId: ID,
  allTasks: Task[],
  visited = new Set<ID>(),
): { task: Task; children: ReturnType<typeof getDependencyTree>[] } | null {
  const map = new Map(allTasks.map((t) => [t.id, t]));
  const task = map.get(taskId);
  if (!task) return null;
  if (visited.has(taskId)) return { task, children: [] };
  visited.add(taskId);
  return {
    task,
    children: task.dependsOn
      .map((id) => getDependencyTree(id, allTasks, new Set(visited)))
      .filter((x): x is NonNullable<typeof x> => x !== null),
  };
}

export function topologicalOrder(tasks: Task[]): Task[] {
  const map = new Map(tasks.map((t) => [t.id, t]));
  const inDegree = new Map<ID, number>();
  const adj = new Map<ID, ID[]>();

  for (const t of tasks) {
    inDegree.set(t.id, 0);
    adj.set(t.id, []);
  }
  for (const t of tasks) {
    for (const dep of t.dependsOn) {
      if (map.has(dep)) {
        adj.get(dep)!.push(t.id);
        inDegree.set(t.id, (inDegree.get(t.id) ?? 0) + 1);
      }
    }
  }

  const queue: ID[] = [];
  for (const [id, deg] of inDegree) if (deg === 0) queue.push(id);

  const result: Task[] = [];
  while (queue.length) {
    const id = queue.shift()!;
    const t = map.get(id);
    if (t) result.push(t);
    for (const next of adj.get(id) ?? []) {
      const d = (inDegree.get(next) ?? 0) - 1;
      inDegree.set(next, d);
      if (d === 0) queue.push(next);
    }
  }
  return result;
}
