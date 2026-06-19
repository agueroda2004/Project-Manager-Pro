import { useState } from "react";
import { useForm } from "react-hook-form";
import { Plus, Tags, Pencil, Trash2 } from "lucide-react";
import { useCategoriesStore } from "../store/categoriesStore";
import { Button } from "../components/shared/Button";
import { Modal } from "../components/shared/Modal";
import { Input } from "../components/shared/Input";
import { ConfirmDialog } from "../components/shared/ConfirmDialog";
import { EmptyState } from "../components/shared/EmptyState";
import { PRESET_COLORS } from "../utils/colors";
import type { Category, CategoryDraft } from "../types";

export function CategoriesPage() {
  const categories = useCategoriesStore((s) => s.items);
  const create = useCategoriesStore((s) => s.create);
  const update = useCategoriesStore((s) => s.update);
  const remove = useCategoriesStore((s) => s.remove);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Categorías</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{categories.length} categorías para etiquetar tareas</p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => { setEditing(null); setOpen(true); }}>Nueva categoría</Button>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          icon={<Tags className="h-6 w-6" />}
          title="Sin categorías"
          description="Crea categorías para clasificar tus tareas."
          action={<Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>Crear categoría</Button>}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((c) => (
            <div key={c.id} className="group flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="h-7 w-7 rounded-md" style={{ background: c.color }} />
                <span className="truncate text-sm font-medium">{c.name}</span>
              </div>
              <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => { setEditing(c); setOpen(true); }}
                  className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                  aria-label="Editar"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setDeleting(c)}
                  className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-500"
                  aria-label="Eliminar"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => { setOpen(false); setEditing(null); }} title={editing ? "Editar categoría" : "Nueva categoría"} size="sm">
        <CategoryForm
          initial={editing ?? undefined}
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
        title="Eliminar categoría"
        description={`¿Eliminar "${deleting?.name}"? Las tareas que la usen la perderán.`}
        confirmText="Eliminar"
        variant="danger"
      />
    </div>
  );
}

function CategoryForm({ initial, onSubmit, onCancel }: { initial?: Category; onSubmit: (data: CategoryDraft) => Promise<void> | void; onCancel: () => void }) {
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<CategoryDraft>({
    defaultValues: { name: initial?.name ?? "", color: initial?.color ?? PRESET_COLORS[0] },
  });
  const color = watch("color");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input label="Nombre" placeholder="Ej. UI/UX" {...register("name", { required: true })} error={errors.name?.message} />
      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)]">Color</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setValue("color", c)}
              className={`h-7 w-7 rounded-full transition-all ${color === c ? "ring-2 ring-[var(--text-primary)] scale-110" : "hover:scale-110"}`}
              style={{ background: c }}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
        <Button type="submit" loading={isSubmitting}>{initial ? "Guardar" : "Crear"}</Button>
      </div>
    </form>
  );
}
