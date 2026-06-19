import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  FolderKanban,
  Calendar as CalendarIcon,
  ListTodo,
  CheckCircle2,
  Target,
  Pencil,
  Trash2,
} from "lucide-react";
import { useProjectsStore } from "../store/projectsStore";
import { useTasksStore } from "../store/tasksStore";
import { useModulesStore } from "../store/modulesStore";
import { useMilestonesStore } from "../store/milestonesStore";
import { Button } from "../components/shared/Button";
import { Modal } from "../components/shared/Modal";
import { CustomDropdown } from "../components/shared/CustomDropdown";
import { ProjectForm } from "../components/projects/ProjectForm";
import { ProjectStatusBadge } from "../components/shared/StatusBadges";
import { ProgressBar } from "../components/shared/ProgressBar";
import { SearchBar } from "../components/shared/SearchBar";
import { EmptyState } from "../components/shared/EmptyState";
import { ConfirmDialog } from "../components/shared/ConfirmDialog";
import { getEffectiveStatus } from "../utils/dependencies";
import { projectProgress } from "../utils/progress";
import { formatDate, formatRelative } from "../utils/dates";
import type { Project, ProjectDraft, ProjectStatus } from "../types";
import { PROJECT_STATUS, PROJECT_STATUS_LABELS } from "../types";
import { useDebounce } from "../hooks/useDebounce";
import { singleValue } from "../utils/dropdown";

export function ProjectsPage() {
  const projects = useProjectsStore((s) => s.items);
  const create = useProjectsStore((s) => s.create);
  const update = useProjectsStore((s) => s.update);
  const remove = useProjectsStore((s) => s.remove);
  const tasks = useTasksStore((s) => s.items);
  const modules = useModulesStore((s) => s.items);
  const milestones = useMilestonesStore((s) => s.items);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);

  const debouncedSearch = useDebounce(search, 200);

  const enriched = useMemo(() => {
    return projects.map((p) => {
      const projectTasks = tasks.filter((t) => t.projectId === p.id);
      const completed = projectTasks.filter((t) => getEffectiveStatus(t, tasks) === "terminado").length;
      const projectModules = modules.filter((m) => m.projectId === p.id);
      const projectMilestones = milestones.filter((m) => m.projectId === p.id);
      const achieved = projectMilestones.filter((m) => m.status === "alcanzado").length;
      const lastActivity = tasks
        .filter((t) => t.projectId === p.id)
        .map((t) => t.updatedAt)
        .sort()
        .reverse()[0] ?? p.updatedAt;
      return {
        project: p,
        totalTasks: projectTasks.length,
        completed,
        progress: projectProgress(p.id, tasks),
        modulesCount: projectModules.length,
        milestonesCount: projectMilestones.length,
        milestonesAchieved: achieved,
        lastActivity,
      };
    });
  }, [projects, tasks, modules, milestones]);

  const filtered = useMemo(() => {
    return enriched.filter(({ project }) => {
      if (statusFilter && project.status !== statusFilter) return false;
      if (debouncedSearch.trim()) {
        const q = debouncedSearch.toLowerCase();
        return (
          project.name.toLowerCase().includes(q) ||
          project.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [enriched, statusFilter, debouncedSearch]);

  const handleSubmit = async (data: ProjectDraft) => {
    if (editing) await update(editing.id, data);
    else await create(data);
    setOpen(false);
    setEditing(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Proyectos</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{projects.length} proyectos en total</p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => { setEditing(null); setOpen(true); }}>
          Nuevo proyecto
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} placeholder="Buscar proyectos…" />
        </div>
        <div className="w-full sm:w-56">
          <CustomDropdown
            options={[
              { value: "__all", label: "Todos los estados" },
              ...PROJECT_STATUS.map((s) => ({ value: s, label: PROJECT_STATUS_LABELS[s] })),
            ]}
            value={statusFilter ?? "__all"}
            onChange={(v) => { const x = singleValue(v); setStatusFilter(x === "__all" || x === null ? null : x as ProjectStatus); }}
            clearable={false}
            fullWidth
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="h-6 w-6" />}
          title="Sin proyectos"
          description="Crea tu primer proyecto para empezar."
          action={
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>
              Crear proyecto
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(({ project, totalTasks, completed, progress, modulesCount, milestonesCount, milestonesAchieved, lastActivity }) => (
            <div
              key={project.id}
              className="group flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 transition-all hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <Link to={`/projects/${project.id}`} className="flex items-start gap-3 min-w-0 flex-1">
                  <span
                    className="mt-1 h-3 w-3 shrink-0 rounded-full"
                    style={{ background: project.color }}
                  />
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)]">
                      {project.name}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-sm text-[var(--text-muted)]">
                      {project.description}
                    </p>
                  </div>
                </Link>
                <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => { setEditing(project); setOpen(true); }}
                    className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                    aria-label="Editar"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleting(project)}
                    className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-500"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <ProjectStatusBadge status={project.status} />
                <span className="text-xs text-[var(--text-muted)]">
                  <CalendarIcon className="mr-1 inline h-3 w-3" />
                  {formatDate(project.endDate)}
                </span>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-[var(--text-muted)]">Progreso</span>
                  <span className="font-medium text-[var(--text-primary)]">{progress}%</span>
                </div>
                <ProgressBar value={progress} color={project.color} />
              </div>
              <div className="grid grid-cols-3 gap-2 border-t border-[var(--border)] pt-3">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-xs text-[var(--text-muted)]">
                    <ListTodo className="h-3 w-3" /> Tareas
                  </div>
                  <div className="text-sm font-semibold text-[var(--text-primary)]">{completed}/{totalTasks}</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-xs text-[var(--text-muted)]">
                    <FolderKanban className="h-3 w-3" /> Módulos
                  </div>
                  <div className="text-sm font-semibold text-[var(--text-primary)]">{modulesCount}</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-xs text-[var(--text-muted)]">
                    <Target className="h-3 w-3" /> Hitos
                  </div>
                  <div className="text-sm font-semibold text-[var(--text-primary)]">
                    {milestonesAchieved}/{milestonesCount}
                  </div>
                </div>
              </div>
              <div className="text-xs text-[var(--text-muted)]">
                <CheckCircle2 className="mr-1 inline h-3 w-3" />
                Última actividad {formatRelative(lastActivity)}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => { setOpen(false); setEditing(null); }}
        title={editing ? "Editar proyecto" : "Nuevo proyecto"}
        size="lg"
      >
        <ProjectForm
          initial={editing ?? undefined}
          onSubmit={handleSubmit}
          onCancel={() => { setOpen(false); setEditing(null); }}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting) await remove(deleting.id);
          setDeleting(null);
        }}
        title="Eliminar proyecto"
        description={`¿Estás seguro de eliminar "${deleting?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
      />
    </div>
  );
}
