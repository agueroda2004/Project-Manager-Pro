import { useState } from "react";
import { Sun, Moon, RotateCcw, Database, Trash2, Sparkles, Power } from "lucide-react";
import { useUIStore } from "../store/uiStore";
import { Button } from "../components/shared/Button";
import { ConfirmDialog } from "../components/shared/ConfirmDialog";
import { clearAll, setSeedDisabled } from "../services/jsonStorage";
import { useProjectsStore } from "../store/projectsStore";
import { useModulesStore } from "../store/modulesStore";
import { useTasksStore } from "../store/tasksStore";
import { useCategoriesStore } from "../store/categoriesStore";
import { useMilestonesStore } from "../store/milestonesStore";
import { useActivitiesStore } from "../store/activitiesStore";
import { useNotesStore } from "../store/notesStore";
import { cn } from "../utils/cn";

export function SettingsPage() {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const seedDisabled = useUIStore((s) => s.seedDisabled);
  const setSeedDisabledStore = useUIStore((s) => s.setSeedDisabled);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmEmpty, setConfirmEmpty] = useState(false);

  const reloadAll = () => {
    void useProjectsStore.getState().load();
    void useModulesStore.getState().load();
    void useTasksStore.getState().load();
    void useCategoriesStore.getState().load();
    void useMilestonesStore.getState().load();
    void useActivitiesStore.getState().load();
    void useNotesStore.getState().load();
  };

  const handleReset = () => {
    clearAll();
    setConfirmReset(false);
    window.location.reload();
  };

  const handleStartEmpty = () => {
    clearAll();
    setSeedDisabled(true);
    setSeedDisabledStore(true);
    setConfirmEmpty(false);
    window.location.reload();
  };

  const handleRestoreSeed = () => {
    setSeedDisabled(false);
    setSeedDisabledStore(false);
    clearAll();
    window.location.reload();
  };

  const themes: { value: "light" | "dark"; label: string; icon: React.ReactNode }[] = [
    { value: "light", label: "Claro", icon: <Sun className="h-4 w-4" /> },
    { value: "dark", label: "Oscuro", icon: <Moon className="h-4 w-4" /> },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Ajustes</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Personaliza la apariencia y administra los datos</p>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
        <h2 className="text-base font-semibold">Apariencia</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Selecciona el tema de la interfaz</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:max-w-md">
          {themes.map((t) => (
            <button
              key={t.value}
              onClick={() => setTheme(t.value)}
              className={cn(
                "flex items-center gap-3 rounded-lg border-2 p-4 transition-colors",
                theme === t.value
                  ? "border-[var(--accent)] bg-[var(--accent)]/5"
                  : "border-[var(--border)] hover:border-[var(--border-strong)]",
              )}
            >
              {t.icon}
              <span className="text-sm font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 text-[var(--text-secondary)]" />
          <div className="flex-1">
            <h2 className="text-base font-semibold">Datos de demostración</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              La app incluye proyectos, módulos y tareas de ejemplo. Puedes desactivarlos para empezar con un espacio vacío.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium",
                seedDisabled
                  ? "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400"
                  : "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
              )}>
                <Power className="h-3 w-3" />
                Datos demo: {seedDisabled ? "Desactivados" : "Activados"}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {seedDisabled ? (
                <Button variant="secondary" leftIcon={<Sparkles className="h-4 w-4" />} onClick={handleRestoreSeed}>
                  Restaurar datos de demo
                </Button>
              ) : (
                <Button variant="danger" leftIcon={<Power className="h-4 w-4" />} onClick={() => setConfirmEmpty(true)}>
                  Empezar sin datos de demo
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
        <div className="flex items-start gap-3">
          <Database className="mt-0.5 h-5 w-5 text-[var(--text-secondary)]" />
          <div className="flex-1">
            <h2 className="text-base font-semibold">Datos</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Los datos se persisten en archivos JSON de seed y se cachean en el navegador. Recargar los datos los restaura al estado inicial.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="secondary" leftIcon={<RotateCcw className="h-4 w-4" />} onClick={reloadAll}>
                Recargar desde seed
              </Button>
              <Button variant="danger" leftIcon={<Trash2 className="h-4 w-4" />} onClick={() => setConfirmReset(true)}>
                Borrar caché del navegador
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
        <h2 className="text-base font-semibold">Acerca de</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          <strong>Software Development Tracker Pro</strong> — Herramienta profesional de gestión y monitoreo de proyectos de software.
        </p>
        <ul className="mt-3 grid grid-cols-1 gap-1 text-xs text-[var(--text-muted)] sm:grid-cols-2">
          <li>React 19 + TypeScript</li>
          <li>Tailwind CSS v4</li>
          <li>Zustand (estado global)</li>
          <li>React Router v7</li>
          <li>Recharts (gráficos)</li>
          <li>React Big Calendar (calendario)</li>
          <li>React Flow (grafo de dependencias)</li>
          <li>@dnd-kit (Kanban)</li>
          <li>React Hook Form (formularios)</li>
          <li>Lucide React (iconos)</li>
        </ul>
      </div>

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={handleReset}
        title="Borrar caché del navegador"
        description="Esto eliminará todos los datos cacheados en localStorage. La próxima vez que inicies la app se cargarán los datos por defecto desde los archivos JSON."
        confirmText="Borrar y recargar"
        variant="danger"
      />

      <ConfirmDialog
        open={confirmEmpty}
        onClose={() => setConfirmEmpty(false)}
        onConfirm={handleStartEmpty}
        title="Empezar sin datos de demostración"
        description="Se eliminarán todos los proyectos, módulos, tareas, hitos y notas actuales. La app quedará completamente vacía y lista para que ingreses tus propios proyectos."
        confirmText="Sí, empezar limpio"
        variant="danger"
      />
    </div>
  );
}
