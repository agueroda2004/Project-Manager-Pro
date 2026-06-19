import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { Plus, Target, Calendar, Pencil, Trash2, CheckCircle2, Circle } from "lucide-react";
import { useMilestonesStore } from "../store/milestonesStore";
import { useProjectsStore } from "../store/projectsStore";
import { Button } from "../components/shared/Button";
import { Modal } from "../components/shared/Modal";
import { Input } from "../components/shared/Input";
import { Textarea } from "../components/shared/Textarea";
import { DatePicker } from "../components/shared/DatePicker";
import { CustomDropdown } from "../components/shared/CustomDropdown";
import { MilestoneStatusBadge } from "../components/shared/StatusBadges";
import { ConfirmDialog } from "../components/shared/ConfirmDialog";
import { EmptyState } from "../components/shared/EmptyState";
import { ProgressBar } from "../components/shared/ProgressBar";
import { formatDate, isOverdue } from "../utils/dates";
import type { Milestone, MilestoneDraft, MilestoneStatus } from "../types";
import { MILESTONE_STATUS, MILESTONE_STATUS_LABELS } from "../types";

export function MilestonesPage() {
  const milestones = useMilestonesStore((s) => s.items);
  const projects = useProjectsStore((s) => s.items);
  const create = useMilestonesStore((s) => s.create);
  const update = useMilestonesStore((s) => s.update);
  const remove = useMilestonesStore((s) => s.remove);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Milestone | null>(null);
  const [deleting, setDeleting] = useState<Milestone | null>(null);

  const grouped = useMemo(() => {
    return projects.map((p) => ({
      project: p,
      list: milestones.filter((m) => m.projectId === p.id),
    }));
  }, [projects, milestones]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Hitos</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{milestones.length} hitos en {projects.length} proyectos</p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => { setEditing(null); setOpen(true); }}>
          Nuevo hito
        </Button>
      </div>

      {milestones.length === 0 ? (
        <EmptyState
          icon={<Target className="h-6 w-6" />}
          title="Sin hitos"
          description="Define el primer hito para tu proyecto."
          action={<Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>Crear hito</Button>}
        />
      ) : (
        <div className="flex flex-col gap-6">
          {grouped.map(({ project, list }) => {
            if (list.length === 0) return null;
            const achieved = list.filter((m) => m.status === "alcanzado").length;
            return (
              <div key={project.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: project.color }} />
                    <h2 className="text-base font-semibold">{project.name}</h2>
                  </div>
                  <span className="text-xs text-[var(--text-muted)]">{achieved}/{list.length} alcanzados</span>
                </div>
                <div className="mb-4">
                  <ProgressBar value={(achieved / list.length) * 100} color={project.color} />
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {list.map((m) => {
                    const overdue = m.status === "pendiente" && isOverdue(m.targetDate, "pendiente");
                    return (
                      <div key={m.id} className="group flex flex-col gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-app)] p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-sm font-semibold">{m.name}</h3>
                            <p className="mt-1 line-clamp-2 text-xs text-[var(--text-muted)]">{m.description}</p>
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
                        <div className="flex items-center justify-between">
                          <span className={`flex items-center gap-1 text-xs ${overdue ? "text-red-500" : "text-[var(--text-muted)]"}`}>
                            <Calendar className="h-3 w-3" /> {formatDate(m.targetDate)}
                          </span>
                          <button
                            onClick={() => void update(m.id, { status: m.status === "alcanzado" ? "pendiente" : "alcanzado" })}
                            className="flex items-center gap-1"
                          >
                            {m.status === "alcanzado" ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <Circle className="h-4 w-4 text-[var(--text-muted)]" />
                            )}
                            <MilestoneStatusBadge status={m.status} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => { setOpen(false); setEditing(null); }} title={editing ? "Editar hito" : "Nuevo hito"} size="lg">
        <MilestoneForm
          initial={editing ?? undefined}
          projects={projects}
          onSubmit={async (data) => {
            if (editing) await update(editing.id, data);
            else await create(data);
            setOpen(false);
            setEditing(null);
          }}
          onCancel={() => { setOpen(false); setEditing(null); }}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={async () => { if (deleting) await remove(deleting.id); setDeleting(null); }}
        title="Eliminar hito"
        description={`¿Eliminar "${deleting?.name}"?`}
        confirmText="Eliminar"
        variant="danger"
      />
    </div>
  );
}

interface MilestoneFormProps {
  initial?: Milestone;
  projects: { id: string; name: string }[];
  onSubmit: (data: MilestoneDraft) => Promise<void> | void;
  onCancel: () => void;
}

function MilestoneForm({ initial, projects, onSubmit, onCancel }: MilestoneFormProps) {
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<MilestoneDraft>({
    defaultValues: {
      projectId: initial?.projectId ?? projects[0]?.id ?? "",
      name: initial?.name ?? "",
      description: initial?.description ?? "",
      targetDate: initial?.targetDate ?? new Date(Date.now() + 30 * 86400000).toISOString(),
      status: initial?.status ?? "pendiente",
    },
  });

  const projectId = watch("projectId");
  const status = watch("status");
  const targetDate = watch("targetDate");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)]">Proyecto</label>
        <div className="mt-1.5">
          <CustomDropdown
            options={projects.map((p) => ({ value: p.id, label: p.name }))}
            value={projectId}
            onChange={(v) => setValue("projectId", Array.isArray(v) ? v[0] ?? "" : v)}
            searchable
          />
        </div>
      </div>
      <Input label="Nombre" placeholder="Ej. MVP, Beta, Versión 1.0" {...register("name", { required: true })} error={errors.name?.message} />
      <Textarea label="Descripción" rows={2} {...register("description", { required: true })} error={errors.description?.message} />
      <div className="grid grid-cols-2 gap-4">
        <DatePicker
          label="Fecha objetivo"
          value={targetDate}
          onChange={(v) => setValue("targetDate", v ?? new Date().toISOString())}
        />
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)]">Estado</label>
          <div className="mt-1.5">
            <CustomDropdown
              options={MILESTONE_STATUS.map((s) => ({ value: s, label: MILESTONE_STATUS_LABELS[s] }))}
              value={status}
              onChange={(v) => setValue("status", (Array.isArray(v) ? v[0] : v) as MilestoneStatus)}
            />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
        <Button type="submit" loading={isSubmitting}>{initial ? "Guardar" : "Crear hito"}</Button>
      </div>
    </form>
  );
}
