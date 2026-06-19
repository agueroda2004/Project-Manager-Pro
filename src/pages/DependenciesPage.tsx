import { useMemo, useState } from "react";
import ReactFlow, {
  type Node,
  type Edge,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { useTasksStore } from "../store/tasksStore";
import { useProjectsStore } from "../store/projectsStore";
import { getEffectiveStatus, topologicalOrder } from "../utils/dependencies";
import { CustomDropdown } from "../components/shared/CustomDropdown";
import { GitBranch, ListTree } from "lucide-react";
import { cn } from "../utils/cn";
import { singleValue } from "../utils/dropdown";
import { TASK_STATUS_COLORS, type TaskStatus, type Task } from "../types";
import { TaskStatusBadge, PriorityBadge } from "../components/shared/StatusBadges";

export function DependenciesPage() {
  const tasks = useTasksStore((s) => s.items);
  const projects = useProjectsStore((s) => s.items);
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [view, setView] = useState<"graph" | "tree">("graph");

  const filtered = useMemo(
    () => (projectFilter ? tasks.filter((t) => t.projectId === projectFilter) : tasks),
    [tasks, projectFilter],
  );

  const { nodes, edges } = useMemo(() => buildGraph(filtered, tasks, projects), [filtered, tasks, projects]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Dependencias</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Visualiza las relaciones entre tareas</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-56">
            <CustomDropdown
              options={[
                { value: "__all", label: "Todos los proyectos" },
                ...projects.map((p) => ({ value: p.id, label: p.name, color: p.color })),
              ]}
              value={projectFilter ?? "__all"}
              onChange={(v) => { const x = singleValue(v); setProjectFilter(x === "__all" || x === null ? null : x); }}
              searchable
            />
          </div>
          <div className="flex rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-0.5">
            <button
              onClick={() => setView("graph")}
              className={cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors", view === "graph" ? "bg-[var(--accent)] text-white" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]")}
            >
              <GitBranch className="h-3.5 w-3.5" /> Grafo
            </button>
            <button
              onClick={() => setView("tree")}
              className={cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors", view === "tree" ? "bg-[var(--accent)] text-white" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]")}
            >
              <ListTree className="h-3.5 w-3.5" /> Árbol
            </button>
          </div>
        </div>
      </div>

      {view === "graph" ? (
        <div className="h-[640px] rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]">
          {nodes.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-[var(--text-muted)]">
              No hay tareas para mostrar.
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              fitView
              minZoom={0.2}
              maxZoom={1.5}
              proOptions={{ hideAttribution: true }}
            >
              <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="var(--border)" />
              <Controls className="!bg-[var(--bg-surface)] !border-[var(--border)]" />
              <MiniMap pannable zoomable className="!bg-[var(--bg-surface)] !border-[var(--border)]" />
            </ReactFlow>
          )}
        </div>
      ) : (
        <DependencyTree tasks={filtered} allTasks={tasks} />
      )}
    </div>
  );
}

function buildGraph(
  tasks: Task[],
  allTasks: Task[],
  projects: { id: string; color: string }[],
) {
  if (tasks.length === 0) return { nodes: [], edges: [] };
  const ordered = topologicalOrder(allTasks);
  const orderIndex = new Map(ordered.map((t, i) => [t.id, i]));
  const idMap = new Map(tasks.map((t) => [t.id, t]));

  const colW = 220;
  const rowH = 90;
  const positions = new Map<string, { x: number; y: number }>();
  const buckets = new Map<number, string[]>();
  for (const t of tasks) {
    const idx = orderIndex.get(t.id) ?? 0;
    if (!buckets.has(idx)) buckets.set(idx, []);
    buckets.get(idx)!.push(t.id);
  }
  const sortedKeys = Array.from(buckets.keys()).sort((a, b) => a - b);
  for (const k of sortedKeys) {
    const list = buckets.get(k)!;
    list.forEach((id, i) => {
      positions.set(id, { x: i * colW, y: k * rowH });
    });
  }

  const nodes: Node[] = tasks.map((t) => {
    const eff = t.status;
    const proj = projects.find((p) => p.id === t.projectId);
    return {
      id: t.id,
      type: "default",
      position: positions.get(t.id) ?? { x: 0, y: 0 },
      data: { label: <TaskNode title={t.title} status={eff} color={proj?.color} /> },
      style: {
        background: "var(--bg-surface)",
        border: `2px solid ${TASK_STATUS_COLORS[eff]}`,
        borderRadius: 10,
        padding: 0,
        width: 200,
        fontSize: 12,
        color: "var(--text-primary)",
      },
    };
  });

  const edges: Edge[] = [];
  for (const t of tasks) {
    for (const dep of t.dependsOn) {
      if (!idMap.has(dep)) continue;
      const depTask = allTasks.find((x) => x.id === dep);
      const isCompleted = depTask?.status === "terminado";
      edges.push({
        id: `${dep}->${t.id}`,
        source: dep,
        target: t.id,
        animated: !isCompleted,
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed, color: isCompleted ? "#10b981" : "#6366f1" },
        style: { stroke: isCompleted ? "#10b981" : "#6366f1", strokeWidth: 2 },
      });
    }
  }
  return { nodes, edges };
}

function TaskNode({ title, status, color }: { title: string; status: TaskStatus; color?: string }) {
  return (
    <div className="p-2">
      <div className="flex items-center gap-1.5">
        {color && <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />}
        <span className="line-clamp-2 text-[11px] font-medium leading-tight">{title}</span>
      </div>
      <div className="mt-1.5 flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: TASK_STATUS_COLORS[status] }} />
        <span className="text-[10px] text-[var(--text-muted)]">{status}</span>
      </div>
    </div>
  );
}

function DependencyTree({ tasks, allTasks }: { tasks: Task[]; allTasks: Task[] }) {
  const roots = tasks.filter((t) => t.dependsOn.length === 0);
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
      {roots.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">No hay tareas raíz (sin dependencias).</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {roots.map((r) => (
            <TreeNode key={r.id} task={r} allTasks={allTasks} visited={new Set()} />
          ))}
        </ul>
      )}
    </div>
  );
}

function TreeNode({ task, allTasks, visited }: { task: Task; allTasks: Task[]; visited: Set<string> }) {
  if (visited.has(task.id)) {
    return (
      <li className="ml-4 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-600 dark:text-amber-400">
        ⚠ Ciclo detectado en {task.title}
      </li>
    );
  }
  visited.add(task.id);
  const dependents = allTasks.filter((t) => t.dependsOn.includes(task.id));
  return (
    <li>
      <div className="flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--bg-app)] px-3 py-2">
        <span className="font-mono text-xs text-[var(--text-muted)]">↳</span>
        <span className="flex-1 text-sm font-medium text-[var(--text-primary)]">{task.title}</span>
        <TaskStatusBadge status={getEffectiveStatus(task, allTasks)} />
        <PriorityBadge priority={task.priority} />
      </div>
      {dependents.length > 0 && (
        <ul className="ml-4 mt-1 flex flex-col gap-1 border-l border-dashed border-[var(--border)] pl-3">
          {dependents.map((d) => (
            <TreeNode key={d.id} task={d} allTasks={allTasks} visited={new Set(visited)} />
          ))}
        </ul>
      )}
    </li>
  );
}
