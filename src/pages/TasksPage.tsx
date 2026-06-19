import { useState, useMemo, useEffect } from "react";
import { Plus, ListTodo, Pencil, Trash2, StickyNote, Link2, ChevronDown, ChevronRight } from "lucide-react";
import { useTasksStore } from "../store/tasksStore";
import { useProjectsStore } from "../store/projectsStore";
import { useModulesStore } from "../store/modulesStore";
import { useCategoriesStore } from "../store/categoriesStore";
import { useNotesStore } from "../store/notesStore";
import { Button } from "../components/shared/Button";
import { Modal } from "../components/shared/Modal";
import { TaskForm } from "../components/tasks/TaskForm";
import { TaskStatusBadge, PriorityBadge } from "../components/shared/StatusBadges";
import { SearchBar } from "../components/shared/SearchBar";
import { CustomDropdown } from "../components/shared/CustomDropdown";
import { EmptyState } from "../components/shared/EmptyState";
import { ConfirmDialog } from "../components/shared/ConfirmDialog";
import { Pagination } from "../components/shared/Pagination";
import { ProgressBar } from "../components/shared/ProgressBar";
import { taskProgress } from "../utils/progress";
import { getEffectiveStatus } from "../utils/dependencies";
import { formatDate, isOverdue, formatRelative } from "../utils/dates";
import { useDebounce } from "../hooks/useDebounce";
import { singleValue } from "../utils/dropdown";
import type { Task, TaskDraft, TaskStatus, Priority, NoteDraft } from "../types";
import { TASK_STATUS, TASK_STATUS_LABELS, PRIORITY, PRIORITY_LABELS } from "../types";
import { Badge } from "../components/shared/Badge";
import { Textarea } from "../components/shared/Textarea";

export function TasksPage() {
  const tasks = useTasksStore((s) => s.items);
  const projects = useProjectsStore((s) => s.items);
  const modules = useModulesStore((s) => s.items);
  const categories = useCategoriesStore((s) => s.items);
  const createTask = useTasksStore((s) => s.create);
  const updateTask = useTasksStore((s) => s.update);
  const removeTask = useTasksStore((s) => s.remove);

  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [moduleFilter, setModuleFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<Priority | null>(null);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);
  const [viewing, setViewing] = useState<Task | null>(null);

  const debounced = useDebounce(search, 200);

  const projectModules = useMemo(
    () => (projectFilter ? modules.filter((m) => m.projectId === projectFilter) : modules),
    [modules, projectFilter],
  );

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (projectFilter && t.projectId !== projectFilter) return false;
      if (moduleFilter && t.moduleId !== moduleFilter) return false;
      const eff = getEffectiveStatus(t, tasks);
      if (statusFilter && eff !== statusFilter) return false;
      if (priorityFilter && t.priority !== priorityFilter) return false;
      if (overdueOnly && !isOverdue(t.dueDate, eff)) return false;
      if (debounced.trim()) {
        const q = debounced.toLowerCase();
        return t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
      }
      return true;
    });
  }, [tasks, projectFilter, moduleFilter, statusFilter, priorityFilter, overdueOnly, debounced]);

  useEffect(() => {
    setPage(1);
  }, [projectFilter, moduleFilter, statusFilter, priorityFilter, overdueOnly, debounced, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedTasks = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize],
  );

  const handleSubmit = async (data: TaskDraft) => {
    if (editing) await updateTask(editing.id, data);
    else await createTask(data);
    setOpen(false);
    setEditing(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Tareas</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {filtered.length} de {tasks.length} tareas
          </p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => { setEditing(null); setOpen(true); }}>
          Nueva tarea
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar tareas…" />
        <CustomDropdown
          options={[
            { value: "__all", label: "Todos los proyectos" },
            ...projects.map((p) => ({ value: p.id, label: p.name, color: p.color })),
          ]}
          value={projectFilter ?? "__all"}
          onChange={(v) => { const x = singleValue(v); setProjectFilter(x === "__all" || x === null ? null : x); setModuleFilter(null); }}
          searchable
        />
        <CustomDropdown
          options={[
            { value: "__all", label: "Todos los módulos" },
            ...projectModules.map((m) => ({ value: m.id, label: m.name })),
          ]}
          value={moduleFilter ?? "__all"}
          onChange={(v) => { const x = singleValue(v); setModuleFilter(x === "__all" || x === null ? null : x); }}
          searchable
          disabled={!projectFilter}
        />
        <CustomDropdown
          options={[
            { value: "__all", label: "Todos los estados" },
            ...TASK_STATUS.map((s) => ({ value: s, label: TASK_STATUS_LABELS[s] })),
          ]}
          value={statusFilter ?? "__all"}
          onChange={(v) => { const x = singleValue(v); setStatusFilter(x === "__all" || x === null ? null : x as TaskStatus); }}
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

      <label className="flex w-fit items-center gap-2 text-sm text-[var(--text-secondary)]">
        <input
          type="checkbox"
          checked={overdueOnly}
          onChange={(e) => setOverdueOnly(e.target.checked)}
          className="h-4 w-4 rounded border-[var(--border)] accent-[var(--accent)]"
        />
        Solo tareas vencidas
      </label>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<ListTodo className="h-6 w-6" />}
          title="Sin tareas"
          description="Ajusta los filtros o crea una nueva tarea."
          action={
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>Crear tarea</Button>
          }
        />
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-app)] text-left text-xs uppercase tracking-wide text-[var(--text-muted)]">
                <tr>
                  <th className="px-4 py-3">Tarea</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Prioridad</th>
                  <th className="px-4 py-3 hidden md:table-cell">Módulo</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Categorías</th>
                  <th className="px-4 py-3 w-32">Progreso</th>
                  <th className="px-4 py-3">Vence</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {pagedTasks.map((t) => {
                  const eff = getEffectiveStatus(t, tasks);
                  const project = projects.find((p) => p.id === t.projectId);
                  const module = modules.find((m) => m.id === t.moduleId);
                  const p = taskProgress(t, tasks);
                  const overdue = isOverdue(t.dueDate, eff);
                  const taskCategories = categories.filter((c) => t.categoryIds.includes(c.id));
                  return (
                    <tr
                      key={t.id}
                      onClick={() => setViewing(t)}
                      className="cursor-pointer border-t border-[var(--border)] transition-colors hover:bg-[var(--bg-elevated)]"
                    >
                      <td className="px-4 py-3 max-w-xs">
                        <div className="truncate font-medium text-[var(--text-primary)]">{t.title}</div>
                        {project && (
                          <div className="mt-0.5 flex items-center gap-1 text-xs text-[var(--text-muted)]">
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: project.color }} />
                            {project.name}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3"><TaskStatusBadge status={eff} /></td>
                      <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                      <td className="px-4 py-3 hidden md:table-cell text-[var(--text-secondary)]">{module?.name ?? "—"}</td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {taskCategories.slice(0, 2).map((c) => (
                            <Badge key={c.id} variant="soft" className="text-[10px]">
                              <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.color }} />
                              {c.name}
                            </Badge>
                          ))}
                          {taskCategories.length > 2 && <span className="text-[10px] text-[var(--text-muted)]">+{taskCategories.length - 2}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 w-32"><ProgressBar value={p} size="sm" /></td>
                      <td className={`px-4 py-3 text-xs ${overdue ? "text-red-500 font-medium" : "text-[var(--text-muted)]"}`}>
                        {formatDate(t.dueDate)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditing(t); setOpen(true); }}
                            className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                            aria-label="Editar"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleting(t); }}
                            className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-500"
                            aria-label="Eliminar"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            page={safePage}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}

      <Modal open={open} onClose={() => { setOpen(false); setEditing(null); }} title={editing ? "Editar tarea" : "Nueva tarea"} size="xl">
        <TaskForm
          initial={editing ?? undefined}
          projects={projects}
          modules={modules}
          allTasks={tasks}
          categories={categories}
          onSubmit={handleSubmit}
          onCancel={() => { setOpen(false); setEditing(null); }}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={async () => { if (deleting) await removeTask(deleting.id); setDeleting(null); }}
        title="Eliminar tarea"
        description={`¿Eliminar "${deleting?.title}"? Las tareas que dependan de esta se actualizarán.`}
        confirmText="Eliminar"
        variant="danger"
      />

      <TaskDetailModal taskId={viewing?.id ?? null} onClose={() => setViewing(null)} onEdit={(t) => { setEditing(t); setViewing(null); setOpen(true); }} />
    </div>
  );
}

function TaskDetailModal({ taskId, onClose, onEdit }: { taskId: string | null; onClose: () => void; onEdit: (t: Task) => void }) {
  const tasks = useTasksStore((s) => s.items);
  const task = useMemo(() => tasks.find((t) => t.id === taskId) ?? null, [tasks, taskId]);
  const projects = useProjectsStore((s) => s.items);
  const modules = useModulesStore((s) => s.items);
  const categories = useCategoriesStore((s) => s.items);
  const changeStatus = useTasksStore((s) => s.changeStatus);
  const update = useTasksStore((s) => s.update);

  const allNotes = useNotesStore((s) => s.items);
  const createNote = useNotesStore((s) => s.create);
  const updateNote = useNotesStore((s) => s.update);
  const removeNote = useNotesStore((s) => s.remove);
  const notes = useMemo(() => allNotes.filter((n) => n.taskId === taskId), [allNotes, taskId]);

  const [noteText, setNoteText] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState("");
  const [subtasksOpen, setSubtasksOpen] = useState(true);
  const [depsOpen, setDepsOpen] = useState(true);

  if (!task) return null;

  const project = projects.find((p) => p.id === task.projectId);
  const module = modules.find((m) => m.id === task.moduleId);
  const eff = getEffectiveStatus(task, tasks);
  const p = taskProgress(task, tasks);
  const taskCategories = categories.filter((c) => task.categoryIds.includes(c.id));
  const depTasks = task.dependsOn.map((id) => tasks.find((t) => t.id === id)).filter((x): x is Task => Boolean(x));
  const dependentTasks = tasks.filter((t) => t.dependsOn.includes(task.id));

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    const data: NoteDraft = { taskId: task.id, content: noteText.trim() };
    await createNote(data);
    setNoteText("");
  };

  const handleStatusSelect = (s: TaskStatus) => {
    void changeStatus(task.id, s);
  };

  return (
    <Modal open={!!task} onClose={onClose} size="xl" title={
      <div className="flex items-center gap-2">
        <span className="truncate">{task.title}</span>
      </div>
    } description={project ? <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full" style={{ background: project.color }} />{project.name} {module ? `· ${module.name}` : ""}</span> : undefined}>
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-2">
          <TaskStatusBadge status={eff} />
          <PriorityBadge priority={task.priority} />
          <span className="text-xs text-[var(--text-muted)]">Vence {formatDate(task.dueDate)}</span>
          <span className="text-xs text-[var(--text-muted)]">· {task.estimatedHours}h estimadas · {task.investedHours}h invertidas</span>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-[var(--text-muted)]">Progreso</span>
            <span className="font-medium">{p}%</span>
          </div>
          <ProgressBar value={p} />
        </div>

        <div>
          <h4 className="text-sm font-semibold">Descripción</h4>
          <p className="mt-1 whitespace-pre-line text-sm text-[var(--text-secondary)]">{task.description}</p>
        </div>

        {taskCategories.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold">Categorías</h4>
            <div className="mt-2 flex flex-wrap gap-1">
              {taskCategories.map((c) => (
                <Badge key={c.id} variant="soft">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.color }} />
                  {c.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div>
          <h4 className="text-sm font-semibold">Cambiar estado</h4>
          <div className="mt-2 flex flex-wrap gap-2">
            {TASK_STATUS.map((s) => {
              const active = eff === s;
              return (
                <button
                  key={s}
                  onClick={() => handleStatusSelect(s)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                      : "border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
                  }`}
                >
                  {TASK_STATUS_LABELS[s]}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <button
            onClick={() => setSubtasksOpen((o) => !o)}
            className="flex w-full items-center justify-between"
          >
            <h4 className="text-sm font-semibold">Subtareas ({task.subtasks.filter((s) => s.done).length}/{task.subtasks.length})</h4>
            {subtasksOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          {subtasksOpen && (
            <ul className="mt-2 flex flex-col gap-1">
              {task.subtasks.length === 0 && <li className="text-sm text-[var(--text-muted)]">Sin subtareas</li>}
              {task.subtasks.map((s) => (
                <li key={s.id} className="flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--bg-app)] px-2 py-1.5">
                  <button
                    onClick={() => {
                      void update(task.id, {
                        subtasks: task.subtasks.map((x) => x.id === s.id ? { ...x, done: !x.done } : x),
                      });
                    }}
                    className={`flex h-4 w-4 items-center justify-center rounded border ${
                      s.done ? "border-emerald-500 bg-emerald-500 text-white" : "border-[var(--border-strong)] bg-[var(--bg-surface)]"
                    }`}
                  >
                    {s.done && <span className="text-[10px]">✓</span>}
                  </button>
                  <span className={`flex-1 text-sm ${s.done ? "line-through text-[var(--text-muted)]" : "text-[var(--text-primary)]"}`}>{s.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <button onClick={() => setDepsOpen((o) => !o)} className="flex w-full items-center justify-between">
            <h4 className="flex items-center gap-1 text-sm font-semibold">
              <Link2 className="h-3.5 w-3.5" /> Dependencias ({depTasks.length})
            </h4>
            {depsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          {depsOpen && (
            <div className="mt-2 space-y-2">
              <div>
                <div className="mb-1 text-xs text-[var(--text-muted)]">Esta tarea depende de:</div>
                {depTasks.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)]">Sin dependencias.</p>
                ) : (
                  <ul className="flex flex-col gap-1">
                    {depTasks.map((d) => {
                      const dEff = getEffectiveStatus(d, tasks);
                      return (
                        <li key={d.id} className="flex items-center justify-between rounded-md border border-[var(--border)] bg-[var(--bg-app)] px-3 py-1.5 text-sm">
                          <span className="truncate">{d.title}</span>
                          <TaskStatusBadge status={dEff} />
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              {dependentTasks.length > 0 && (
                <div>
                  <div className="mb-1 text-xs text-[var(--text-muted)]">Tareas bloqueadas por esta:</div>
                  <ul className="flex flex-col gap-1">
                    {dependentTasks.map((d) => (
                      <li key={d.id} className="rounded-md border border-[var(--border)] bg-[var(--bg-app)] px-3 py-1.5 text-sm text-[var(--text-secondary)]">
                        {d.title}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <h4 className="flex items-center gap-1 text-sm font-semibold">
            <StickyNote className="h-3.5 w-3.5" /> Notas técnicas
          </h4>
          <div className="mt-2 flex gap-2">
            <Textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Escribe una nota…"
              rows={2}
            />
            <Button onClick={handleAddNote} leftIcon={<Plus className="h-4 w-4" />}>Agregar</Button>
          </div>
          <ul className="mt-2 flex flex-col gap-2">
            {notes.length === 0 && <li className="text-sm text-[var(--text-muted)]">Sin notas aún.</li>}
            {notes.map((n) => (
              <li key={n.id} className="rounded-lg border border-[var(--border)] bg-[var(--bg-app)] p-3">
                {editingNoteId === n.id ? (
                  <div className="flex flex-col gap-2">
                    <Textarea value={editingNoteText} onChange={(e) => setEditingNoteText(e.target.value)} rows={2} />
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setEditingNoteId(null)}>Cancelar</Button>
                      <Button size="sm" onClick={async () => { await updateNote(n.id, { content: editingNoteText }); setEditingNoteId(null); }}>Guardar</Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="whitespace-pre-line text-sm text-[var(--text-primary)]">{n.content}</p>
                    <div className="mt-2 flex items-center justify-between text-xs text-[var(--text-muted)]">
                      <span>{formatRelative(n.createdAt)}</span>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingNoteId(n.id); setEditingNoteText(n.content); }} className="hover:text-[var(--text-primary)]">Editar</button>
                        <button onClick={() => { void removeNote(n.id); }} className="hover:text-red-500">Eliminar</button>
                      </div>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[var(--border)] pt-3">
          <Button variant="ghost" onClick={onClose}>Cerrar</Button>
          <Button variant="secondary" leftIcon={<Pencil className="h-4 w-4" />} onClick={() => onEdit(task)}>Editar</Button>
        </div>
      </div>
    </Modal>
  );
}
