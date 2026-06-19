import { useForm } from "react-hook-form";
import type { Project, ProjectDraft } from "../../types";
import { Input } from "../shared/Input";
import { Textarea } from "../shared/Textarea";
import { DatePicker } from "../shared/DatePicker";
import { CustomDropdown, type DropdownOption } from "../shared/CustomDropdown";
import { PROJECT_STATUS, PROJECT_STATUS_LABELS } from "../../types";
import { Button } from "../shared/Button";
import { PRESET_COLORS } from "../../utils/colors";

interface ProjectFormProps {
  initial?: Project;
  onSubmit: (data: ProjectDraft) => Promise<void> | void;
  onCancel: () => void;
}

export function ProjectForm({ initial, onSubmit, onCancel }: ProjectFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProjectDraft>({
    defaultValues: {
      name: initial?.name ?? "",
      description: initial?.description ?? "",
      startDate: initial?.startDate ?? new Date().toISOString(),
      endDate: initial?.endDate ?? new Date(Date.now() + 30 * 86400000).toISOString(),
      status: initial?.status ?? "planeacion",
      color: initial?.color ?? PRESET_COLORS[0],
    },
  });

  const status = watch("status");
  const color = watch("color");

  const statusOptions: DropdownOption[] = PROJECT_STATUS.map((s) => ({
    value: s,
    label: PROJECT_STATUS_LABELS[s],
  }));

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
    >
      <Input
        label="Nombre del proyecto"
        placeholder="Ej. E-Commerce Platform"
        {...register("name", { required: "El nombre es obligatorio", minLength: { value: 2, message: "Mínimo 2 caracteres" } })}
        error={errors.name?.message}
      />
      <Textarea
        label="Descripción"
        placeholder="Describe el objetivo y alcance del proyecto…"
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
          label="Fecha estimada de fin"
          value={watch("endDate")}
          onChange={(v) => setValue("endDate", v ?? new Date().toISOString())}
          min={watch("startDate")}
        />
      </div>
      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)]">Estado</label>
        <div className="mt-1.5">
          <CustomDropdown
            options={statusOptions}
            value={status}
            onChange={(v) => setValue("status", (Array.isArray(v) ? v[0] : v) as ProjectDraft["status"])}
            fullWidth
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)]">Color</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setValue("color", c)}
              className={`h-7 w-7 rounded-full ring-offset-2 ring-offset-[var(--bg-surface)] transition-all ${
                color === c ? "ring-2 ring-[var(--text-primary)] scale-110" : "hover:scale-110"
              }`}
              style={{ background: c }}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {initial ? "Guardar cambios" : "Crear proyecto"}
        </Button>
      </div>
    </form>
  );
}
