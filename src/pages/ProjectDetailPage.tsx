import { useState } from "react";
import { Outlet, useParams, NavLink, Link } from "react-router-dom";
import { useProjectsStore } from "../store/projectsStore";
import { useTasksStore } from "../store/tasksStore";
import { useModulesStore } from "../store/modulesStore";
import { useMilestonesStore } from "../store/milestonesStore";
import { ProjectStatusBadge } from "../components/shared/StatusBadges";
import { ProgressBar } from "../components/shared/ProgressBar";
import { Button } from "../components/shared/Button";
import { Modal } from "../components/shared/Modal";
import { ProjectForm } from "../components/projects/ProjectForm";
import { Pencil, ArrowLeft, ListTodo, Target, Boxes } from "lucide-react";
import { projectProgress } from "../utils/progress";
import { getEffectiveStatus } from "../utils/dependencies";
import { formatDate } from "../utils/dates";
import { cn } from "../utils/cn";
import type { ProjectDraft } from "../types";

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const project = useProjectsStore((s) => s.items.find((p) => p.id === projectId));
  const update = useProjectsStore((s) => s.update);
  const tasks = useTasksStore((s) => s.items);
  const modules = useModulesStore((s) => s.items);
  const milestones = useMilestonesStore((s) => s.items);
  const [editing, setEditing] = useState(false);

  if (!project) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-8 text-center">
        <p className="text-sm text-[var(--text-muted)]">Proyecto no encontrado.</p>
        <Link to="/projects" className="mt-3 inline-flex items-center gap-1 text-sm text-[var(--accent)] hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Volver a proyectos
        </Link>
      </div>
    );
  }

  const projectTasks = tasks.filter((t) => t.projectId === project.id);
  const completed = projectTasks.filter((t) => getEffectiveStatus(t, tasks) === "terminado").length;
  const projectModules = modules.filter((m) => m.projectId === project.id);
  const projectMilestones = milestones.filter((m) => m.projectId === project.id);
  const achieved = projectMilestones.filter((m) => m.status === "alcanzado").length;
  const progress = projectProgress(project.id, tasks);

  const tabs = [
    { to: "", label: "Resumen", end: true },
    { to: "modules", label: "Módulos" },
    { to: "tasks", label: "Tareas" },
    { to: "dependencies", label: "Dependencias" },
    { to: "milestones", label: "Hitos" },
    { to: "activity", label: "Actividad" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Link to="/projects" className="inline-flex w-fit items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]">
        <ArrowLeft className="h-3.5 w-3.5" /> Proyectos
      </Link>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <span className="mt-1 h-4 w-4 shrink-0 rounded" style={{ background: project.color }} />
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                {project.name}
              </h1>
              <p className="mt-1 text-sm text-[var(--text-muted)]">{project.description}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <ProjectStatusBadge status={project.status} />
                <span className="text-xs text-[var(--text-muted)]">
                  Inicio: {formatDate(project.startDate)}
                </span>
                <span className="text-xs text-[var(--text-muted)]">
                  Fin: {formatDate(project.endDate)}
                </span>
              </div>
            </div>
          </div>
          <Button leftIcon={<Pencil className="h-4 w-4" />} variant="secondary" onClick={() => setEditing(true)}>
            Editar
          </Button>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <div className="text-xs text-[var(--text-muted)]">Progreso</div>
            <div className="mt-1 flex items-center gap-2">
              <div className="flex-1">
                <ProgressBar value={progress} color={project.color} />
              </div>
              <span className="text-sm font-semibold">{progress}%</span>
            </div>
          </div>
          <div className="rounded-lg bg-[var(--bg-app)] p-3">
            <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
              <ListTodo className="h-3.5 w-3.5" /> Tareas
            </div>
            <div className="mt-1 text-lg font-semibold">{completed}/{projectTasks.length}</div>
          </div>
          <div className="rounded-lg bg-[var(--bg-app)] p-3">
            <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
              <Boxes className="h-3.5 w-3.5" /> Módulos
            </div>
            <div className="mt-1 text-lg font-semibold">{projectModules.length}</div>
          </div>
          <div className="rounded-lg bg-[var(--bg-app)] p-3">
            <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
              <Target className="h-3.5 w-3.5" /> Hitos
            </div>
            <div className="mt-1 text-lg font-semibold">{achieved}/{projectMilestones.length}</div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto border-b border-[var(--border)]">
        {tabs.map((tab) => (
          <NavLink
            key={tab.label}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              cn(
                "relative whitespace-nowrap px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "text-[var(--text-primary)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
              )
            }
          >
            {({ isActive }) => (
              <>
                {tab.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t bg-[var(--accent)]" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>

      <Outlet context={{ project }} />

      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        title="Editar proyecto"
        size="lg"
      >
        <ProjectForm
          initial={project}
          onCancel={() => setEditing(false)}
          onSubmit={async (data: ProjectDraft) => {
            await update(project.id, data);
            setEditing(false);
          }}
        />
      </Modal>
    </div>
  );
}
