import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Plus, X, AlertTriangle, Check, Link2 } from "lucide-react";
import type { Task, TaskDraft, Project, Module, TaskStatus } from "../../types";
import { TASK_STATUS, PRIORITY, TASK_STATUS_LABELS, PRIORITY_LABELS } from "../../types";
import { Input } from "../shared/Input";
import { Textarea } from "../shared/Textarea";
import { DatePicker } from "../shared/DatePicker";
import { CustomDropdown } from "../shared/CustomDropdown";
import { Button } from "../shared/Button";
import { detectCycle, isTaskBlocked, getEffectiveStatus } from "../../utils/dependencies";

interface TaskFormProps {
  initial?: Task;
  projects: Project[];
  modules: Module[];
  allTasks: Task[];
  categories: { id: string; name: string; color: string }[];
  defaultProjectId?: string;
  defaultModuleId?: string;
  onSubmit: (data: TaskDraft) => Promise<void> | void;
  onCancel: () => void;
}

interface SubtaskInput { id: string; name: string; done: boolean; }

export function TaskForm({
  initial,
  projects,
  modules,
  allTasks,
  categories,
  defaultProjectId,
  defaultModuleId,
  onSubmit,
  onCancel,
}: TaskFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TaskDraft>({
    defaultValues: {
      projectId: initial?.projectId ?? defaultProjectId ?? projects[0]?.id ?? "",
      moduleId: initial?.moduleId ?? defaultModuleId ?? "",
      title: initial?.title ?? "",
      description: initial?.description ?? "",
      priority: initial?.priority ?? "media",
      status: initial?.status ?? "pendiente",
      dueDate: initial?.dueDate ?? null,
      estimatedHours: initial?.estimatedHours ?? 0,
      investedHours: initial?.investedHours ?? 0,
      categoryIds: initial?.categoryIds ?? [],
      dependsOn: initial?.dependsOn ?? [],
      subtasks: initial?.subtasks ?? [],
    },
  });

  const projectId = watch("projectId");
  const moduleId = watch("moduleId");
  const priority = watch("priority");
  const status = watch("status");
  const categoryIds = watch("categoryIds");
  const dependsOn = watch("dependsOn");
  const subtasks = watch("subtasks") as SubtaskInput[];

  const [subtaskDraft, setSubtaskDraft] = useState("");
  const [cycleError, setCycleError] = useState<string | null>(null);

  const projectModules = useMemo(
    () => modules.filter((m) => m.projectId === projectId),
    [modules, projectId],
  );

  useEffect(() => {
    if (!projectModules.find((m) => m.id === moduleId)) {
      setValue("moduleId", projectModules[0]?.id ?? "");
    }
  }, [projectModules, moduleId, setValue]);

  useEffect(() => {
    if (initial) return;
    if (defaultProjectId && !projectId) setValue("projectId", defaultProjectId);
    if (defaultModuleId && !moduleId) setValue("moduleId", defaultModuleId);
  }, [defaultProjectId, defaultModuleId, initial, projectId, moduleId, setValue]);

  const projectTasks = useMemo(
    () => allTasks.filter((t) => t.projectId === projectId && t.id !== initial?.id),
    [allTasks, projectId, initial?.id],
  );

  const handleAddSubtask = () => {
    if (!subtaskDraft.trim()) return;
    setValue("subtasks", [
      ...subtasks,
      { id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, name: subtaskDraft.trim(), done: false },
    ]);
    setSubtaskDraft("");
  };

  const handleRemoveSubtask = (id: string) => {
    setValue("subtasks", subtasks.filter((s) => s.id !== id));
  };

  const handleToggleSubtask = (id: string) => {
    setValue(
      "subtasks",
      subtasks.map((s) => (s.id === id ? { ...s, done: !s.done } : s)),
    );
  };

  const handleDependenciesChange = (val: string | string[]) => {
    const newDeps = Array.isArray(val) ? val : [val];
    if (initial) {
      const simulated: Task = {
        ...initial,
        dependsOn: newDeps,
      };
      if (detectCycle(initial.id, newDeps, allTasks)) {
        setCycleError("Esta dependencia crearía un ciclo entre tareas. Revisa la jerarquía.");
        return;
      }
      const blocked = isTaskBlocked(simulated, allTasks);
      if (!blocked && (status === "trabajando" || status === "testing")) {
        // ok
      }
    }
    setCycleError(null);
    setValue("dependsOn", newDeps);
  };

  const handleStatusChange = (newStatus: TaskStatus) => {
    if (initial) {
      const simulated: Task = { ...initial, status: newStatus };
      if (
        newStatus !== "pendiente" &&
        newStatus !== "bloqueado" &&
        isTaskBlocked(simulated, allTasks)
      ) {
        setCycleError("No puedes cambiar a este estado: la tarea tiene dependencias pendientes.");
        return;
      }
    }
    setCycleError(null);
    setValue("status", newStatus);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)]">Proyecto</label>
          <div className="mt-1.5">
            <CustomDropdown
              options={projects.map((p) => ({ value: p.id, label: p.name, color: p.color }))}
              value={projectId}
              onChange={(v) => setValue("projectId", Array.isArray(v) ? v[0] ?? "" : v)}
              searchable
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)]">Módulo</label>
          <div className="mt-1.5">
            <CustomDropdown
              options={projectModules.map((m) => ({ value: m.id, label: m.name }))}
              value={moduleId}
              onChange={(v) => setValue("moduleId", Array.isArray(v) ? v[0] ?? "" : v)}
              searchable
              emptyMessage="Crea un módulo primero"
            />
          </div>
        </div>
      </div>

      <Input
        label="Título"
        placeholder="Ej. Crear endpoint GET /products"
        {...register("title", { required: "El título es obligatorio" })}
        error={errors.title?.message}
      />
      <Textarea
        label="Descripción"
        placeholder="Detalla el alcance, criterios de aceptación…"
        rows={3}
        {...register("description", { required: "La descripción es obligatoria" })}
        error={errors.description?.message}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)]">Estado</label>
          <div className="mt-1.5">
            <CustomDropdown
              options={TASK_STATUS.map((s) => ({ value: s, label: TASK_STATUS_LABELS[s] }))}
              value={status}
              onChange={(v) => handleStatusChange(v as TaskStatus)}
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)]">Prioridad</label>
          <div className="mt-1.5">
            <CustomDropdown
              options={PRIORITY.map((p) => ({ value: p, label: PRIORITY_LABELS[p] }))}
              value={priority}
              onChange={(v) => setValue("priority", v as TaskDraft["priority"])}
            />
          </div>
        </div>
        <DatePicker
          label="Fecha límite"
          value={watch("dueDate")}
          onChange={(v) => setValue("dueDate", v)}
        />
        <Input
          label="Horas estimadas"
          type="number"
          min={0}
          step={0.5}
          {...register("estimatedHours", { valueAsNumber: true, min: 0 })}
        />
      </div>

      <Input
        label="Horas invertidas"
        type="number"
        min={0}
        step={0.5}
        {...register("investedHours", { valueAsNumber: true, min: 0 })}
      />

      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)]">Categorías</label>
        <div className="mt-1.5">
          <CustomDropdown
            options={categories.map((c) => ({ value: c.id, label: c.name, color: c.color }))}
            value={categoryIds}
            onChange={(v) => setValue("categoryIds", Array.isArray(v) ? v : [v])}
            multiple
            searchable
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)]">Dependencias</label>
        <div className="mt-1.5">
          <CustomDropdown
            options={projectTasks.map((t) => {
              const eff = getEffectiveStatus(t, allTasks);
              return {
                value: t.id,
                label: t.title,
                description: TASK_STATUS_LABELS[eff],
                disabled: t.status !== "terminado" && dependsOn.includes(t.id) === false,
                color: eff === "terminado" ? "#10b981" : "#94a3b8",
              };
            })}
            value={dependsOn}
            onChange={handleDependenciesChange}
            multiple
            searchable
            leftIcon={<Link2 className="h-4 w-4" />}
            emptyMessage="No hay tareas disponibles en este proyecto"
          />
        </div>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Solo puedes seleccionar tareas ya completadas. El sistema detectará ciclos automáticamente.
        </p>
      </div>

      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)]">Subtareas</label>
        <div className="mt-1.5 flex gap-2">
          <Input
            value={subtaskDraft}
            onChange={(e) => setSubtaskDraft(e.target.value)}
            placeholder="Nombre de la subtarea"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddSubtask();
              }
            }}
          />
          <Button type="button" variant="secondary" leftIcon={<Plus className="h-4 w-4" />} onClick={handleAddSubtask}>
            Agregar
          </Button>
        </div>
        {subtasks.length > 0 && (
          <ul className="mt-2 flex flex-col gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-app)] p-2">
            {subtasks.map((s) => (
              <li key={s.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-[var(--bg-elevated)]">
                <button
                  type="button"
                  onClick={() => handleToggleSubtask(s.id)}
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                    s.done ? "border-emerald-500 bg-emerald-500 text-white" : "border-[var(--border-strong)] bg-[var(--bg-surface)]"
                  }`}
                  aria-label={s.done ? "Marcar pendiente" : "Marcar completada"}
                >
                  {s.done && <Check className="h-3 w-3" />}
                </button>
                <span className={`flex-1 text-sm ${s.done ? "text-[var(--text-muted)] line-through" : "text-[var(--text-primary)]"}`}>
                  {s.name}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveSubtask(s.id)}
                  className="text-[var(--text-muted)] hover:text-red-500"
                  aria-label="Eliminar subtarea"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {cycleError && (
        <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{cycleError}</span>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
        <Button type="submit" loading={isSubmitting}>{initial ? "Guardar cambios" : "Crear tarea"}</Button>
      </div>
    </form>
  );
}
