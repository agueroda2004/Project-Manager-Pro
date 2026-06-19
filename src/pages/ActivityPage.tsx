import { useMemo, useState } from "react";
import { Activity as ActivityIcon, Filter } from "lucide-react";
import { useActivitiesStore } from "../store/activitiesStore";
import { CustomDropdown } from "../components/shared/CustomDropdown";
import { EmptyState } from "../components/shared/EmptyState";
import { formatRelative, formatDate } from "../utils/dates";
import { cn } from "../utils/cn";
import { ACTIVITY_TYPES, type ActivityType } from "../types";
import { Input } from "../components/shared/Input";

const ICONS: Partial<Record<ActivityType, string>> = {
  project_created: "📁",
  project_updated: "📝",
  project_deleted: "🗑️",
  module_created: "📦",
  module_updated: "✏️",
  module_deleted: "🗑️",
  task_created: "✅",
  task_updated: "✏️",
  task_completed: "🎉",
  task_status_changed: "🔄",
  task_deleted: "🗑️",
  dependency_added: "🔗",
  dependency_removed: "⛓️‍💥",
  milestone_created: "🎯",
  milestone_achieved: "🏆",
  milestone_updated: "✏️",
  category_created: "🏷️",
  category_updated: "✏️",
  category_deleted: "🗑️",
  note_added: "📝",
  note_updated: "✏️",
  note_deleted: "🗑️",
};

const LABELS: Partial<Record<ActivityType, string>> = {
  project_created: "Proyecto creado",
  project_updated: "Proyecto actualizado",
  module_created: "Módulo creado",
  task_created: "Tarea creada",
  task_completed: "Tarea completada",
  task_status_changed: "Cambio de estado",
  dependency_added: "Dependencia agregada",
  milestone_created: "Hito creado",
  milestone_achieved: "Hito alcanzado",
  category_created: "Categoría creada",
};

export function ActivityPage() {
  const activities = useActivitiesStore((s) => s.items);
  const [type, setType] = useState<ActivityType | "all">("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return activities.filter((a) => {
      if (type !== "all" && a.type !== type) return false;
      if (search.trim() && !a.message.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [activities, type, search]);

  const grouped = useMemo(() => {
    const groups = new Map<string, typeof filtered>();
    for (const a of filtered) {
      const d = formatDate(a.createdAt, "yyyy-MM-dd");
      if (!groups.has(d)) groups.set(d, []);
      groups.get(d)!.push(a);
    }
    return Array.from(groups.entries());
  }, [filtered]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Actividad</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Timeline de eventos del sistema</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar en actividad…" leftIcon={<ActivityIcon className="h-4 w-4" />} />
        <CustomDropdown
          options={[
            { value: "all", label: "Todos los tipos" },
            ...ACTIVITY_TYPES.map((t) => ({ value: t, label: LABELS[t] ?? t })),
          ]}
          value={type}
          onChange={(v) => setType(v as ActivityType | "all")}
        />
        <div className="flex items-center justify-end text-sm text-[var(--text-muted)]">
          <Filter className="mr-2 h-4 w-4" /> {filtered.length} eventos
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<ActivityIcon className="h-6 w-6" />} title="Sin actividad" description="No hay eventos que coincidan con los filtros." />
      ) : (
        <div className="flex flex-col gap-6">
          {grouped.map(([day, list]) => (
            <div key={day}>
              <div className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">{formatDate(list[0]?.createdAt ?? new Date().toISOString(), "EEEE dd 'de' MMMM")}</div>
              <ul className="flex flex-col gap-1.5">
                {list.map((a) => (
                  <li
                    key={a.id}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3",
                    )}
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--bg-elevated)] text-base">
                      {ICONS[a.type] ?? "•"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-sm text-[var(--text-primary)]">{a.message}</div>
                      <div className="text-xs text-[var(--text-muted)]">
                        {LABELS[a.type] ?? a.type} · {formatRelative(a.createdAt)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
