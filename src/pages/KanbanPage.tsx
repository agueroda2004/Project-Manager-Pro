import { useState, useMemo } from "react";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  DragOverlay,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Plus, Calendar as CalIcon } from "lucide-react";
import { useTasksStore } from "../store/tasksStore";
import { useProjectsStore } from "../store/projectsStore";
import { useModulesStore } from "../store/modulesStore";
import { useCategoriesStore } from "../store/categoriesStore";
import { Button } from "../components/shared/Button";
import { Modal } from "../components/shared/Modal";
import { TaskForm } from "../components/tasks/TaskForm";
import { PriorityBadge } from "../components/shared/StatusBadges";
import { CustomDropdown } from "../components/shared/CustomDropdown";
import { taskProgress } from "../utils/progress";
import { getEffectiveStatus } from "../utils/dependencies";
import { formatDate, isOverdue } from "../utils/dates";
import { singleValue } from "../utils/dropdown";
import type { Task, TaskDraft, TaskStatus } from "../types";
import { TASK_STATUS, TASK_STATUS_LABELS, TASK_STATUS_COLORS } from "../types";
import { cn } from "../utils/cn";

export function KanbanPage() {
  const tasks = useTasksStore((s) => s.items);
  const projects = useProjectsStore((s) => s.items);
  const modules = useModulesStore((s) => s.items);
  const categories = useCategoriesStore((s) => s.items);
  const changeStatus = useTasksStore((s) => s.changeStatus);
  const createTask = useTasksStore((s) => s.create);

  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Task | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const filtered = useMemo(
    () => (projectFilter ? tasks.filter((t) => t.projectId === projectFilter) : tasks),
    [tasks, projectFilter],
  );

  const columns = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = {
      pendiente: [], bloqueado: [], trabajando: [], testing: [], terminado: [],
    };
    for (const t of filtered) {
      const eff = getEffectiveStatus(t, tasks);
      map[eff].push(t);
    }
    return map;
  }, [filtered, tasks]);

  const onDragStart = (e: DragStartEvent) => {
    const t = tasks.find((x) => x.id === e.active.id);
    if (t) setActive(t);
  };

  const onDragEnd = (e: DragEndEvent) => {
    setActive(null);
    if (!e.over) return;
    const targetStatus = e.over.id as TaskStatus;
    if (!TASK_STATUS.includes(targetStatus)) return;
    const task = tasks.find((t) => t.id === e.active.id);
    if (!task) return;
    const currentEff = getEffectiveStatus(task, tasks);
    if (currentEff === targetStatus) return;
    void changeStatus(task.id, targetStatus);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Kanban</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Arrastra y suelta para cambiar el estado</p>
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
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>Nueva tarea</Button>
        </div>
      </div>

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {TASK_STATUS.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={columns[status]}
              projects={projects}
              modules={modules}
              allTasks={tasks}
            />
          ))}
        </div>
        <DragOverlay>
          {active && <KanbanCard task={active} projects={projects} modules={modules} allTasks={tasks} isOverlay />}
        </DragOverlay>
      </DndContext>

      <Modal open={open} onClose={() => setOpen(false)} title="Nueva tarea" size="xl">
        <TaskForm
          projects={projects}
          modules={modules}
          allTasks={tasks}
          categories={categories}
          defaultProjectId={projectFilter ?? undefined}
          onSubmit={async (data: TaskDraft) => { await createTask(data); setOpen(false); }}
          onCancel={() => setOpen(false)}
        />
      </Modal>
    </div>
  );
}

function KanbanColumn({
  status,
  tasks,
  projects,
  modules,
  allTasks,
}: {
  status: TaskStatus;
  tasks: Task[];
  projects: { id: string; name: string; color: string }[];
  modules: { id: string; name: string }[];
  allTasks: Task[];
}) {
  const { isOver, setNodeRef } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] min-h-[400px] transition-colors",
        isOver && "border-[var(--accent)] bg-[var(--accent-soft)]/30",
      )}
    >
      <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: TASK_STATUS_COLORS[status] }} />
          <h3 className="text-sm font-semibold">{TASK_STATUS_LABELS[status]}</h3>
          <span className="rounded-md bg-[var(--bg-elevated)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
            {tasks.length}
          </span>
        </div>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-2">
        {tasks.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-xs text-[var(--text-muted)]">
            Sin tareas
          </div>
        ) : (
          tasks.map((t) => <KanbanCard key={t.id} task={t} projects={projects} modules={modules} allTasks={allTasks} />)
        )}
      </div>
    </div>
  );
}

function KanbanCard({
  task,
  projects,
  modules,
  allTasks,
  isOverlay,
}: {
  task: Task;
  projects: { id: string; name: string; color: string }[];
  modules: { id: string; name: string }[];
  allTasks: Task[];
  isOverlay?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });
  const project = projects.find((p) => p.id === task.projectId);
  const module = modules.find((m) => m.id === task.moduleId);
  const p = taskProgress(task, allTasks);
  const overdue = isOverdue(task.dueDate, task.status);

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "group cursor-grab rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-3 shadow-sm transition-all hover:shadow-md",
        isDragging && !isOverlay && "opacity-30",
        isOverlay && "rotate-2 shadow-2xl ring-2 ring-[var(--accent)]",
      )}
    >
      <div className="text-sm font-medium text-[var(--text-primary)]">{task.title}</div>
      {project && (
        <div className="mt-1.5 flex items-center gap-1 text-xs text-[var(--text-muted)]">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: project.color }} />
          <span className="truncate">{project.name}</span>
          {module && <span className="truncate">· {module.name}</span>}
        </div>
      )}
      <div className="mt-2 flex items-center justify-between">
        <PriorityBadge priority={task.priority} />
        {task.dueDate && (
          <span className={cn("flex items-center gap-1 text-xs", overdue ? "text-red-500" : "text-[var(--text-muted)]")}>
            <CalIcon className="h-3 w-3" /> {formatDate(task.dueDate)}
          </span>
        )}
      </div>
      {task.subtasks.length > 0 && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--bg-elevated)]">
          <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${p}%` }} />
        </div>
      )}
      {task.dependsOn.length > 0 && (
        <div className="mt-2 text-[10px] text-[var(--text-muted)]">🔗 {task.dependsOn.length} dependencia(s)</div>
      )}
    </div>
  );
}
