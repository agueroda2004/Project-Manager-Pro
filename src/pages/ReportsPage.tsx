import { useState } from "react";
import { Download, FileJson, FolderKanban, Boxes, ListTodo, Activity as ActivityIcon } from "lucide-react";
import { useProjectsStore } from "../store/projectsStore";
import { useModulesStore } from "../store/modulesStore";
import { useTasksStore } from "../store/tasksStore";
import { useActivitiesStore } from "../store/activitiesStore";
import { Button } from "../components/shared/Button";
import { downloadJSON } from "../utils/export";

export function ReportsPage() {
  const projects = useProjectsStore((s) => s.items);
  const modules = useModulesStore((s) => s.items);
  const tasks = useTasksStore((s) => s.items);
  const activities = useActivitiesStore((s) => s.items);
  const [exporting, setExporting] = useState<string | null>(null);

  const exports = [
    { id: "projects", name: "Proyectos", icon: <FolderKanban className="h-4 w-4" />, data: () => projects, filename: "proyectos" },
    { id: "modules", name: "Módulos", icon: <Boxes className="h-4 w-4" />, data: () => modules, filename: "modulos" },
    { id: "tasks", name: "Tareas", icon: <ListTodo className="h-4 w-4" />, data: () => tasks, filename: "tareas" },
    { id: "activities", name: "Actividades", icon: <ActivityIcon className="h-4 w-4" />, data: () => activities, filename: "actividades" },
  ] as const;

  const handleExport = (item: typeof exports[number]) => {
    setExporting(item.id);
    const data = item.data();
    downloadJSON(data, `${item.filename}_${new Date().toISOString().slice(0, 10)}.json`);
    setTimeout(() => setExporting(null), 500);
  };

  const exportAll = () => {
    const data = { projects, modules, tasks, activities, exportedAt: new Date().toISOString() };
    downloadJSON(data, `tracker_pro_backup_${new Date().toISOString().slice(0, 10)}.json`);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Reportes</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Exporta los datos del sistema en formato JSON</p>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
            <FileJson className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold">Backup completo</h2>
            <p className="text-xs text-[var(--text-muted)]">Descarga todos los datos en un único archivo JSON.</p>
          </div>
          <Button leftIcon={<Download className="h-4 w-4" />} onClick={exportAll}>
            Exportar todo
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {exports.map((e) => (
          <div key={e.id} className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
              {e.icon}
            </span>
            <div className="flex-1">
              <div className="text-sm font-semibold">{e.name}</div>
              <div className="text-xs text-[var(--text-muted)]">{(e.data() as unknown[]).length} registros</div>
            </div>
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<Download className="h-3.5 w-3.5" />}
              onClick={() => handleExport(e)}
              loading={exporting === e.id}
            >
              JSON
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
