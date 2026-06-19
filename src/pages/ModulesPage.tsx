import { useState, useMemo } from "react";
import {
  Plus,
  Boxes,
  Pencil,
  Trash2,
  Calendar,
  ListTodo,
  CheckCircle2,
  AlertOctagon,
} from "lucide-react";
import { useModulesStore } from "../store/modulesStore";
import { useProjectsStore } from "../store/projectsStore";
import { useTasksStore } from "../store/tasksStore";
import { Button } from "../components/shared/Button";
import { Modal } from "../components/shared/Modal";
import { ModuleForm } from "../components/modules/ModuleForm";
import { PriorityBadge } from "../components/shared/StatusBadges";
import { SearchBar } from "../components/shared/SearchBar";
import { CustomDropdown } from "../components/shared/CustomDropdown";
import { EmptyState } from "../components/shared/EmptyState";
import { ConfirmDialog } from "../components/shared/ConfirmDialog";
import { ProgressBar } from "../components/shared/ProgressBar";
import { moduleProgress } from "../utils/progress";
import { getEffectiveStatus } from "../utils/dependencies";
import { formatDate, isOverdue } from "../utils/dates";
import { useDebounce } from "../hooks/useDebounce";
import { singleValue } from "../utils/dropdown";
import type { Module, ModuleDraft, Priority } from "../types";
import { PRIORITY, PRIORITY_LABELS } from "../types";

export function ModulesPage() {
  const modules = useModulesStore((s) => s.items);
  const projects = useProjectsStore((s) => s.items);
  const tasks = useTasksStore((s) => s.items);
  const create = useModulesStore((s) => s.create);
  const update = useModulesStore((s) => s.update);
  const remove = useModulesStore((s) => s.remove);

  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<Priority | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Module | null>(null);
  const [deleting, setDeleting] = useState<Module | null>(null);

  const debounced = useDebounce(search, 200);

  const enriched = useMemo(() => {
    return modules.map((m) => {
      const projectTasks = tasks.filter((t) => t.moduleId === m.id);
      const completed = projectTasks.filter((t) => getEffectiveStatus(t, tasks) === "terminado").length;
      const blocked = projectTasks.filter((t) => getEffectiveStatus(t, tasks) === "bloqueado").length;
      const project = projects.find((p) => p.id === m.projectId);
      return { module: m, project, total: projectTasks.length, completed, blocked, progress: moduleProgress(m.id, tasks) };
    });
  }, [modules, projects, tasks]);

  const filtered = useMemo(() => {
    return enriched.filter(({ module: m }) => {
      if (projectFilter && m.projectId !== projectFilter) return false;
      if (priorityFilter && m.priority !== priorityFilter) return false;
      if (debounced.trim()) {
        const q = debounced.toLowerCase();
        return m.name.toLowerCase().includes(q) || m.description.toLowerCase().includes(q);
      }
      return true;
    });
  }, [enriched, projectFilter, priorityFilter, debounced]);

  const handleSubmit = async (data: ModuleDraft) => {
    if (editing) await update(editing.id, data);
    else await create(data);
    setOpen(false);
    setEditing(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Módulos</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{modules.length} módulos en {projects.length} proyectos</p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => { setEditing(null); setOpen(true); }}>
          Nuevo módulo
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar módulos…" />
        <CustomDropdown
          options={[
            { value: "__all", label: "Todos los proyectos" },
            ...projects.map((p) => ({ value: p.id, label: p.name, color: p.color })),
          ]}
          value={projectFilter ?? "__all"}
          onChange={(v) => { const x = singleValue(v); setProjectFilter(x === "__all" || x === null ? null : x); }}
        />
        <CustomDropdown
          options={[
            { value: "__all", label: "Todas las prioridades" },
            ...PRIORITY.map((p) => ({ value: p, label: PRIORITY_LABELS[p] })),
          ]}
          value={priorityFilter ?? "__all"}
          onChange={(v) => { const x = singleValue(v); setPriorityFilter(x === "__all" || x === null ? null : x as Priority); }}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Boxes className="h-6 w-6" />}
          title="Sin módulos"
          description="Crea el primer módulo para este proyecto."
          action={
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>Crear módulo</Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(({ module: m, project, total, completed, blocked, progress }) => {
            const overdue = isOverdue(m.endDate, "pendiente");
            return (
              <div key={m.id} className="group flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    {project && (
                      <div className="mb-1 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: project.color }} />
                        {project.name}
                      </div>
                    )}
                    <h3 className="truncate text-base font-semibold text-[var(--text-primary)]">{m.name}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-[var(--text-muted)]">{m.description}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => { setEditing(m); setOpen(true); }}
                      className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                      aria-label="Editar"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleting(m)}
                      className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-500"
                      aria-label="Eliminar"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <PriorityBadge priority={m.priority} />
                  <span className={`flex items-center gap-1 text-xs ${overdue ? "text-red-500" : "text-[var(--text-muted)]"}`}>
                    <Calendar className="h-3 w-3" /> {formatDate(m.endDate)}
                  </span>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-[var(--text-muted)]">Progreso</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <ProgressBar value={progress} />
                </div>
                <div className="grid grid-cols-3 gap-2 border-t border-[var(--border)] pt-3">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-xs text-[var(--text-muted)]">
                      <ListTodo className="h-3 w-3" /> Total
                    </div>
                    <div className="text-sm font-semibold">{total}</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-xs text-[var(--text-muted)]">
                      <CheckCircle2 className="h-3 w-3" /> Hechas
                    </div>
                    <div className="text-sm font-semibold text-emerald-600">{completed}</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-xs text-[var(--text-muted)]">
                      <AlertOctagon className="h-3 w-3" /> Bloq.
                    </div>
                    <div className="text-sm font-semibold text-red-500">{blocked}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => { setOpen(false); setEditing(null); }} title={editing ? "Editar módulo" : "Nuevo módulo"} size="lg">
        <ModuleForm
          initial={editing ?? undefined}
          projects={projects}
          onSubmit={handleSubmit}
          onCancel={() => { setOpen(false); setEditing(null); }}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={async () => { if (deleting) await remove(deleting.id); setDeleting(null); }}
        title="Eliminar módulo"
        description={`¿Eliminar "${deleting?.name}"? Las tareas asociadas no se eliminarán.`}
        confirmText="Eliminar"
        variant="danger"
      />
    </div>
  );
}
