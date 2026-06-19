import { useForm } from "react-hook-form";
import type { Module, ModuleDraft, Project } from "../../types";
import { Input } from "../shared/Input";
import { Textarea } from "../shared/Textarea";
import { DatePicker } from "../shared/DatePicker";
import { CustomDropdown } from "../shared/CustomDropdown";
import { Button } from "../shared/Button";
import { PRIORITY, PRIORITY_LABELS } from "../../types";

interface ModuleFormProps {
  initial?: Module;
  projects: Project[];
  defaultProjectId?: string;
  onSubmit: (data: ModuleDraft) => Promise<void> | void;
  onCancel: () => void;
}

export function ModuleForm({ initial, projects, defaultProjectId, onSubmit, onCancel }: ModuleFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ModuleDraft>({
    defaultValues: {
      projectId: initial?.projectId ?? defaultProjectId ?? projects[0]?.id ?? "",
      name: initial?.name ?? "",
      description: initial?.description ?? "",
      priority: initial?.priority ?? "media",
      startDate: initial?.startDate ?? new Date().toISOString(),
      endDate: initial?.endDate ?? new Date(Date.now() + 14 * 86400000).toISOString(),
    },
  });

  const projectId = watch("projectId");
  const priority = watch("priority");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)]">Proyecto</label>
        <div className="mt-1.5">
          <CustomDropdown
            options={projects.map((p) => ({ value: p.id, label: p.name, color: p.color }))}
            value={projectId}
            onChange={(v) => setValue("projectId", Array.isArray(v) ? v[0] ?? "" : v)}
            searchable
            fullWidth
          />
        </div>
      </div>
      <Input
        label="Nombre del módulo"
        placeholder="Ej. Autenticación"
        {...register("name", { required: "El nombre es obligatorio" })}
        error={errors.name?.message}
      />
      <Textarea
        label="Descripción"
        placeholder="Describe el alcance del módulo…"
        rows={3}
        {...register("description", { required: "La descripción es obligatoria" })}
        error={errors.description?.message}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DatePicker
          label="Fecha de inicio"
          value={watch("startDate")}
          onChange={(v) => setValue("startDate", v ?? new Date().toISOString())}
        />
        <DatePicker
          label="Fecha límite"
          value={watch("endDate")}
          onChange={(v) => setValue("endDate", v ?? new Date().toISOString())}
          min={watch("startDate")}
        />
      </div>
      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)]">Prioridad</label>
        <div className="mt-1.5">
          <CustomDropdown
            options={PRIORITY.map((p) => ({ value: p, label: PRIORITY_LABELS[p] }))}
            value={priority}
            onChange={(v) => setValue("priority", (Array.isArray(v) ? v[0] : v) as ModuleDraft["priority"])}
            fullWidth
          />
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
        <Button type="submit" loading={isSubmitting}>{initial ? "Guardar" : "Crear módulo"}</Button>
      </div>
    </form>
  );
}
