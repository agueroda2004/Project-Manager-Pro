import { useState, useRef } from "react";
import { Download, FileJson, Upload, FolderKanban, Boxes, ListTodo, Activity as ActivityIcon, CheckCircle2, AlertCircle, X } from "lucide-react";
import { useProjectsStore } from "../store/projectsStore";
import { useModulesStore } from "../store/modulesStore";
import { useTasksStore } from "../store/tasksStore";
import { useActivitiesStore } from "../store/activitiesStore";
import { useCategoriesStore } from "../store/categoriesStore";
import { useMilestonesStore } from "../store/milestonesStore";
import { useNotesStore } from "../store/notesStore";
import { Button } from "../components/shared/Button";
import { Modal } from "../components/shared/Modal";
import { ConfirmDialog } from "../components/shared/ConfirmDialog";
import { downloadJSON } from "../utils/export";
import { parseImportPayload, summarizePayload, type ParsedImport, type EntityKey } from "../utils/import";
import type { Project, Module, Task, Category, Milestone, Activity, Note } from "../types";
import { cn } from "../utils/cn";

interface Toast {
  id: string;
  type: "success" | "error";
  message: string;
}

export function ReportsPage() {
  const projects = useProjectsStore((s) => s.items);
  const modules = useModulesStore((s) => s.items);
  const tasks = useTasksStore((s) => s.items);
  const activities = useActivitiesStore((s) => s.items);
  const categories = useCategoriesStore((s) => s.items);
  const milestones = useMilestonesStore((s) => s.items);
  const notes = useNotesStore((s) => s.items);

  const replaceProjects = useProjectsStore((s) => s.replaceAll);
  const replaceModules = useModulesStore((s) => s.replaceAll);
  const replaceTasks = useTasksStore((s) => s.replaceAll);
  const replaceActivities = useActivitiesStore((s) => s.replaceAll);
  const replaceCategories = useCategoriesStore((s) => s.replaceAll);
  const replaceMilestones = useMilestonesStore((s) => s.replaceAll);
  const replaceNotes = useNotesStore((s) => s.replaceAll);

  const [exporting, setExporting] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedImport | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [importing, setImporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pushToast = (type: Toast["type"], message: string) => {
    const id = `t_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

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
    const data = { projects, modules, tasks, activities, categories, milestones, notes, exportedAt: new Date().toISOString() };
    downloadJSON(data, `tracker_pro_backup_${new Date().toISOString().slice(0, 10)}.json`);
  };

  const handlePickFile = () => {
    setErrorMsg(null);
    setParsed(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      const result = parseImportPayload(text);
      setParsed(result);
      setErrorMsg(null);
    } catch (err) {
      setErrorMsg((err as Error).message);
      setParsed(null);
    }
  };

  const applyImport = () => {
    if (!parsed) return;
    setImporting(true);
    try {
      const e = parsed.entities;
      if (e.projects) replaceProjects(e.projects as Project[]);
      if (e.modules) replaceModules(e.modules as Module[]);
      if (e.tasks) replaceTasks(e.tasks as Task[]);
      if (e.activities) replaceActivities(e.activities as Activity[]);
      if (e.categories) replaceCategories(e.categories as Category[]);
      if (e.milestones) replaceMilestones(e.milestones as Milestone[]);
      if (e.notes) replaceNotes(e.notes as Note[]);
      pushToast("success", `Importación completada: ${summarizePayload(parsed)}`);
      setParsed(null);
      setConfirming(false);
    } catch (err) {
      pushToast("error", `Error al importar: ${(err as Error).message}`);
    } finally {
      setImporting(false);
    }
  };

  const cancelImport = () => {
    setParsed(null);
    setErrorMsg(null);
  };

  const ENTITY_LABELS: Record<EntityKey, string> = {
    projects: "Proyectos",
    modules: "Módulos",
    tasks: "Tareas",
    activities: "Actividades",
    categories: "Categorías",
    milestones: "Hitos",
    notes: "Notas",
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Reportes</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Exporta e importa los datos del sistema en formato JSON</p>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
            <FileJson className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold">Backup completo</h2>
            <p className="text-xs text-[var(--text-muted)]">Descarga o restaura todos los datos en un único archivo JSON.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" leftIcon={<Upload className="h-4 w-4" />} onClick={handlePickFile}>
              Importar
            </Button>
            <Button leftIcon={<Download className="h-4 w-4" />} onClick={exportAll}>
              Exportar todo
            </Button>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        onChange={handleFileChange}
        className="hidden"
      />

      <Modal
        open={!!parsed}
        onClose={cancelImport}
        title="Vista previa de importación"
        size="md"
        footer={
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={cancelImport} disabled={importing}>Cancelar</Button>
            <Button onClick={() => setConfirming(true)} leftIcon={<Upload className="h-4 w-4" />} loading={importing}>
              Continuar
            </Button>
          </div>
        }
      >
        {parsed && (
          <div className="flex flex-col gap-4">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-app)] p-4">
              <p className="text-sm text-[var(--text-primary)]">
                {parsed.fullBackup
                  ? "El archivo es un backup completo."
                  : "El archivo contiene una sola entidad."}
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Se importarán las siguientes entidades (reemplazarán los datos actuales):
              </p>
              <ul className="mt-3 flex flex-col gap-1.5">
                {(Object.keys(parsed.counts) as EntityKey[]).map((k) => (
                  <li key={k} className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">{ENTITY_LABELS[k]}</span>
                    <span className="font-mono text-xs font-semibold text-[var(--text-primary)]">{parsed.counts[k]}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
              <strong>Advertencia:</strong> la importación reemplaza los datos existentes de cada entidad incluida en el archivo. Esta acción no se puede deshacer.
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={applyImport}
        title="¿Reemplazar datos actuales?"
        description="Los datos actuales de las entidades incluidas en el archivo serán reemplazados. Si el archivo es un backup completo, se reemplazará TODO el contenido."
        confirmText="Sí, reemplazar"
        variant="danger"
        loading={importing}
      />

      {errorMsg && (
        <div className="fixed bottom-4 right-4 z-[200] flex max-w-sm items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-600 shadow-lg dark:text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex-1">
            <div className="font-medium">Error al leer el archivo</div>
            <div className="text-xs opacity-90">{errorMsg}</div>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="rounded p-0.5 text-red-600 hover:bg-red-500/10 dark:text-red-300"
            aria-label="Cerrar"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="pointer-events-none fixed bottom-4 right-4 z-[200] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex max-w-sm items-start gap-2 rounded-lg border p-3 text-sm shadow-lg animate-slide-up",
              t.type === "success"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300",
            )}
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="flex-1">{t.message}</div>
            <button
              onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
              className="rounded p-0.5 opacity-60 hover:opacity-100"
              aria-label="Cerrar"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
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
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-app)] p-4 md:col-span-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--bg-elevated)] text-[var(--text-muted)]">
            <FileJson className="h-4 w-4" />
          </span>
          <div className="flex-1">
            <div className="text-sm font-medium">Importar desde archivo</div>
            <div className="text-xs text-[var(--text-muted)]">
              Carga un backup completo o el JSON de una sola entidad. Valida la estructura antes de aplicar.
            </div>
          </div>
          <Button size="sm" variant="secondary" leftIcon={<Upload className="h-3.5 w-3.5" />} onClick={handlePickFile}>
            Seleccionar archivo
          </Button>
        </div>
      </div>
    </div>
  );
}
