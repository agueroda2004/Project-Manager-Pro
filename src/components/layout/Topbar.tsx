import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Search, Moon, Sun, Command, FolderKanban, Boxes, ListTodo, Target, Tags } from "lucide-react";
import { useUIStore } from "../../store/uiStore";
import { cn } from "../../utils/cn";
import { useProjectsStore } from "../../store/projectsStore";
import { useModulesStore } from "../../store/modulesStore";
import { useTasksStore } from "../../store/tasksStore";
import { useMilestonesStore } from "../../store/milestonesStore";
import { useCategoriesStore } from "../../store/categoriesStore";
import { SearchBar } from "../shared/SearchBar";
import { useDebounce } from "../../hooks/useDebounce";
import { Modal } from "../shared/Modal";

interface Result {
  id: string;
  type: "project" | "module" | "task" | "milestone" | "category";
  label: string;
  description?: string;
  to: string;
}

const TYPE_ICON: Record<Result["type"], React.ReactNode> = {
  project: <FolderKanban className="h-3.5 w-3.5" />,
  module: <Boxes className="h-3.5 w-3.5" />,
  task: <ListTodo className="h-3.5 w-3.5" />,
  milestone: <Target className="h-3.5 w-3.5" />,
  category: <Tags className="h-3.5 w-3.5" />,
};

const TYPE_LABEL: Record<Result["type"], string> = {
  project: "Proyecto",
  module: "Módulo",
  task: "Tarea",
  milestone: "Hito",
  category: "Categoría",
};

export function Topbar() {
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);
  const navigate = useNavigate();
  const projects = useProjectsStore((s) => s.items);
  const modules = useModulesStore((s) => s.items);
  const tasks = useTasksStore((s) => s.items);
  const milestones = useMilestonesStore((s) => s.items);
  const categories = useCategoriesStore((s) => s.items);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const debounced = useDebounce(searchValue, 150);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo<Result[]>(() => {
    if (!debounced.trim()) return [];
    const q = debounced.toLowerCase();
    const r: Result[] = [];
    for (const p of projects) {
      if (p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)) {
        r.push({ id: p.id, type: "project", label: p.name, description: p.description, to: `/projects/${p.id}` });
      }
    }
    for (const m of modules) {
      if (m.name.toLowerCase().includes(q) || m.description.toLowerCase().includes(q)) {
        const p = projects.find((x) => x.id === m.projectId);
        r.push({
          id: m.id,
          type: "module",
          label: m.name,
          description: p?.name,
          to: `/projects/${m.projectId}`,
        });
      }
    }
    for (const t of tasks) {
      if (t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)) {
        r.push({
          id: t.id,
          type: "task",
          label: t.title,
          description: projects.find((p) => p.id === t.projectId)?.name,
          to: `/projects/${t.projectId}?taskId=${t.id}`,
        });
      }
    }
    for (const m of milestones) {
      if (m.name.toLowerCase().includes(q)) {
        r.push({
          id: m.id,
          type: "milestone",
          label: m.name,
          description: projects.find((p) => p.id === m.projectId)?.name,
          to: `/milestones`,
        });
      }
    }
    for (const c of categories) {
      if (c.name.toLowerCase().includes(q)) {
        r.push({ id: c.id, type: "category", label: c.name, to: `/categories` });
      }
    }
    return r.slice(0, 30);
  }, [debounced, projects, modules, tasks, milestones, categories]);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[var(--border)] bg-[var(--bg-app)]/80 px-4 backdrop-blur-md md:px-6">
        <button
          onClick={() => setSearchOpen(true)}
          className="flex flex-1 max-w-md items-center gap-2 h-9 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-muted)] hover:border-[var(--border-strong)] transition-colors"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Buscar proyectos, tareas, hitos…</span>
          <span className="hidden md:inline-flex items-center gap-0.5 rounded border border-[var(--border)] px-1.5 py-0.5 text-[10px]">
            <Command className="h-2.5 w-2.5" />K
          </span>
        </button>

        <div className="flex-1" />

        <button
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
          aria-label="Cambiar tema"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
          aria-label="Notificaciones"
        >
          <Bell className="h-4 w-4" />
        </button>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-semibold">
          DA
        </div>
      </header>

      <Modal open={searchOpen} onClose={() => setSearchOpen(false)} title="Búsqueda global" size="lg">
        <div className="flex flex-col gap-3">
          <SearchBar
            value={searchValue}
            onChange={setSearchValue}
            placeholder="Escribe para buscar en proyectos, módulos, tareas, hitos, categorías…"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIdx((i) => Math.min(results.length - 1, i + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIdx((i) => Math.max(0, i - 1));
              } else if (e.key === "Enter" && results[activeIdx]) {
                e.preventDefault();
                navigate(results[activeIdx].to);
                setSearchOpen(false);
                setSearchValue("");
              }
            }}
          />
          <div className="max-h-96 overflow-y-auto rounded-lg border border-[var(--border)]">
            {searchValue.trim() === "" && (
              <div className="p-6 text-sm text-[var(--text-muted)] text-center">
                Empieza a escribir para buscar al instante.
              </div>
            )}
            {searchValue.trim() !== "" && results.length === 0 && (
              <div className="p-6 text-sm text-[var(--text-muted)] text-center">
                Sin resultados para "{searchValue}".
              </div>
            )}
            {results.length > 0 && (
              <ul className="divide-y divide-[var(--border)]">
                {results.map((r, i) => (
                  <li
                    key={`${r.type}-${r.id}`}
                    onMouseEnter={() => setActiveIdx(i)}
                    onClick={() => {
                      navigate(r.to);
                      setSearchOpen(false);
                      setSearchValue("");
                    }}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 cursor-pointer",
                      i === activeIdx && "bg-[var(--bg-elevated)]",
                    )}
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--bg-app)] text-[var(--text-secondary)]">
                      {TYPE_ICON[r.type]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-[var(--text-primary)]">{r.label}</div>
                      {r.description && (
                        <div className="truncate text-xs text-[var(--text-muted)]">{r.description}</div>
                      )}
                    </div>
                    <span className="text-xs text-[var(--text-muted)]">{TYPE_LABEL[r.type]}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
