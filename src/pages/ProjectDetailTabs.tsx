import { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { useTasksStore } from "../store/tasksStore";
import { useModulesStore } from "../store/modulesStore";
import { useMilestonesStore } from "../store/milestonesStore";
import { useActivitiesStore } from "../store/activitiesStore";
import type { Project, Task } from "../types";
import { TASK_STATUS_COLORS, TASK_STATUS_LABELS, type TaskStatus } from "../types";
import { getEffectiveStatus } from "../utils/dependencies";
import { moduleProgress, taskProgress } from "../utils/progress";
import { formatDate, formatRelative } from "../utils/dates";
import { Link } from "react-router-dom";
import { TaskStatusBadge, PriorityBadge } from "../components/shared/StatusBadges";
import { ProgressBar } from "../components/shared/ProgressBar";
import { Badge } from "../components/shared/Badge";
import { Activity as ActivityIcon, ChevronRight } from "lucide-react";
import { MilestoneStatusBadge } from "../components/shared/StatusBadges";

export type ProjectContext = { project: Project };

export function ProjectOverview() {
  const { project } = useOutletContext<ProjectContext>();
  const tasks = useTasksStore((s) => s.items);
  const modules = useModulesStore((s) => s.items);
  const milestones = useMilestonesStore((s) => s.items);

  const projectTasks = tasks.filter((t) => t.projectId === project.id);
  const projectModules = modules.filter((m) => m.projectId === project.id);
  const projectMilestones = milestones.filter((m) => m.projectId === project.id);

  const statusMap: Record<TaskStatus, number> = {
    pendiente: 0, bloqueado: 0, trabajando: 0, testing: 0, terminado: 0,
  };
  for (const t of projectTasks) statusMap[getEffectiveStatus(t, tasks)] += 1;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 lg:col-span-2">
        <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Módulos del proyecto</h3>
        {projectModules.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">Aún no hay módulos.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {projectModules.map((m) => {
              const p = moduleProgress(m.id, tasks);
              return (
                <li key={m.id} className="rounded-lg border border-[var(--border)] bg-[var(--bg-app)] p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-[var(--text-primary)]">{m.name}</div>
                      <div className="text-xs text-[var(--text-muted)]">Vence {formatDate(m.endDate)}</div>
                    </div>
                    <span className="text-xs font-medium text-[var(--text-primary)]">{p}%</span>
                  </div>
                  <div className="mt-2">
                    <ProgressBar value={p} size="sm" />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
        <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Distribución de tareas</h3>
        <ul className="flex flex-col gap-2">
          {(Object.entries(statusMap) as [TaskStatus, number][]).map(([k, v]) => (
            <li key={k} className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full" style={{ background: TASK_STATUS_COLORS[k] }} />
              <span className="flex-1 text-sm text-[var(--text-primary)]">{TASK_STATUS_LABELS[k]}</span>
              <span className="text-sm font-semibold">{v}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 lg:col-span-2">
        <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Tareas recientes</h3>
        {projectTasks.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">Sin tareas.</p>
        ) : (
          <ul className="flex flex-col">
            {projectTasks.slice(0, 5).map((t) => (
              <li key={t.id}>
                <Link
                  to={`/projects/${project.id}?taskId=${t.id}`}
                  className="group flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 hover:bg-[var(--bg-elevated)]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--accent)]">{t.title}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                      <TaskStatusBadge status={getEffectiveStatus(t, tasks)} />
                      <PriorityBadge priority={t.priority} />
                      <span>{formatDate(t.dueDate)}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
        <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Hitos</h3>
        {projectMilestones.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">Sin hitos definidos.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {projectMilestones.map((m) => (
              <li key={m.id} className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-app)] p-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{m.name}</div>
                  <div className="text-xs text-[var(--text-muted)]">{formatDate(m.targetDate)}</div>
                </div>
                <MilestoneStatusBadge status={m.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function ProjectModulesTab() {
  const { project } = useOutletContext<ProjectContext>();
  return (
    <div>
      <Link to="/modules" className="text-sm text-[var(--accent)] hover:underline">
        Ver todos los módulos en la página global →
      </Link>
      <ProjectModuleList projectId={project.id} />
    </div>
  );
}

function ProjectModuleList({ projectId }: { projectId: string }) {
  const allModules = useModulesStore((s) => s.items);
  const modules = useMemo(() => allModules.filter((m) => m.projectId === projectId), [allModules, projectId]);
  const tasks = useTasksStore((s) => s.items);
  if (modules.length === 0) {
    return <p className="mt-3 text-sm text-[var(--text-muted)]">No hay módulos para este proyecto.</p>;
  }
  return (
    <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {modules.map((m) => {
        const p = moduleProgress(m.id, tasks);
        return (
          <div key={m.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4">
            <div className="text-sm font-semibold">{m.name}</div>
            <div className="mt-1 line-clamp-2 text-xs text-[var(--text-muted)]">{m.description}</div>
            <div className="mt-3">
              <ProgressBar value={p} />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span>{formatDate(m.endDate)}</span>
              <Badge>{p}%</Badge>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ProjectTasksTab() {
  const { project } = useOutletContext<ProjectContext>();
  const tasks = useTasksStore((s) => s.items);
  const list = tasks.filter((t) => t.projectId === project.id);
  if (list.length === 0) {
    return <p className="text-sm text-[var(--text-muted)]">No hay tareas en este proyecto.</p>;
  }
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-[var(--bg-app)] text-left text-xs text-[var(--text-muted)]">
          <tr>
            <th className="px-4 py-3">Tarea</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3">Prioridad</th>
            <th className="px-4 py-3">Progreso</th>
            <th className="px-4 py-3">Vence</th>
          </tr>
        </thead>
        <tbody>
          {list.map((t) => {
            const p = taskProgress(t, tasks);
            const eff = getEffectiveStatus(t, tasks);
            return (
              <tr key={t.id} className="border-t border-[var(--border)]">
                <td className="px-4 py-3">
                  <Link to={`/projects/${project.id}?taskId=${t.id}`} className="font-medium hover:text-[var(--accent)]">
                    {t.title}
                  </Link>
                </td>
                <td className="px-4 py-3"><TaskStatusBadge status={eff} /></td>
                <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                <td className="px-4 py-3 w-40"><ProgressBar value={p} showLabel size="sm" /></td>
                <td className="px-4 py-3 text-[var(--text-muted)]">{formatDate(t.dueDate)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function ProjectDependenciesTab() {
  const { project } = useOutletContext<ProjectContext>();
  const tasks = useTasksStore((s) => s.items);
  const list = tasks.filter((t) => t.projectId === project.id && t.dependsOn.length > 0);
  if (list.length === 0) {
    return <p className="text-sm text-[var(--text-muted)]">Este proyecto aún no tiene dependencias entre tareas.</p>;
  }
  return (
    <ul className="flex flex-col gap-2">
      {list.map((t) => {
        const deps = t.dependsOn.map((id) => tasks.find((x) => x.id === id)?.title ?? "—");
        return (
          <li key={t.id} className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-3">
            <div className="text-sm font-medium text-[var(--text-primary)]">{t.title}</div>
            <div className="mt-1 text-xs text-[var(--text-muted)]">Depende de:</div>
            <ul className="mt-1 ml-3 list-disc text-xs text-[var(--text-secondary)]">
              {deps.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          </li>
        );
      })}
    </ul>
  );
}

export function ProjectMilestonesTab() {
  const { project } = useOutletContext<ProjectContext>();
  const allMilestones = useMilestonesStore((s) => s.items);
  const milestones = useMemo(() => allMilestones.filter((m) => m.projectId === project.id), [allMilestones, project.id]);
  if (milestones.length === 0) {
    return <p className="text-sm text-[var(--text-muted)]">No hay hitos definidos para este proyecto.</p>;
  }
  return (
    <ul className="flex flex-col gap-2">
      {milestones.map((m) => (
        <li key={m.id} className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-3">
          <div>
            <div className="text-sm font-medium">{m.name}</div>
            <div className="text-xs text-[var(--text-muted)]">{formatDate(m.targetDate)}</div>
          </div>
          <MilestoneStatusBadge status={m.status} />
        </li>
      ))}
    </ul>
  );
}

export function ProjectActivityTab() {
  const { project } = useOutletContext<ProjectContext>();
  const tasks = useTasksStore((s) => s.items);
  const modules = useModulesStore((s) => s.items);
  const milestones = useMilestonesStore((s) => s.items);
  const activities = useActivitiesStore((s) => s.items);
  const list = activities.filter((a) =>
    a.entityId === project.id ||
    tasks.some((t) => t.id === a.entityId && t.projectId === project.id) ||
    modules.some((m) => m.id === a.entityId && m.projectId === project.id) ||
    milestones.some((m) => m.id === a.entityId && m.projectId === project.id),
  );
  if (list.length === 0) return <p className="text-sm text-[var(--text-muted)]">Sin actividad registrada.</p>;
  return (
    <ul className="flex flex-col gap-2">
      {list.map((a) => (
        <li key={a.id} className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--bg-elevated)]">
            <ActivityIcon className="h-4 w-4 text-[var(--text-secondary)]" />
          </span>
          <div className="flex-1">
            <div className="text-sm text-[var(--text-primary)]">{a.message}</div>
            <div className="text-xs text-[var(--text-muted)]">{formatRelative(a.createdAt)}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export type { Task };
