import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  Boxes,
  ListTodo,
  Calendar,
  GitBranch,
  Target,
  Tags,
  Activity,
  FileBarChart,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  Sparkles,
} from "lucide-react";
import { cn } from "../../utils/cn";
import { useUIStore } from "../../store/uiStore";

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const PRIMARY: NavItem[] = [
  { to: "/", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { to: "/projects", label: "Proyectos", icon: <FolderKanban className="h-4 w-4" /> },
  { to: "/modules", label: "Módulos", icon: <Boxes className="h-4 w-4" /> },
  { to: "/tasks", label: "Tareas", icon: <ListTodo className="h-4 w-4" /> },
  { to: "/tasks/kanban", label: "Kanban", icon: <Boxes className="h-4 w-4" /> },
  { to: "/calendar", label: "Calendario", icon: <Calendar className="h-4 w-4" /> },
  { to: "/dependencies", label: "Dependencias", icon: <GitBranch className="h-4 w-4" /> },
];

const SECONDARY: NavItem[] = [
  { to: "/milestones", label: "Hitos", icon: <Target className="h-4 w-4" /> },
  { to: "/categories", label: "Categorías", icon: <Tags className="h-4 w-4" /> },
  { to: "/activity", label: "Actividad", icon: <Activity className="h-4 w-4" /> },
  { to: "/reports", label: "Reportes", icon: <FileBarChart className="h-4 w-4" /> },
  { to: "/settings", label: "Ajustes", icon: <Settings className="h-4 w-4" /> },
];

export function Sidebar() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggle = useUIStore((s) => s.toggleSidebar);
  const loc = useLocation();

  const isActive = (to: string) => {
    if (to === "/") return loc.pathname === "/";
    if (to === "/tasks") return loc.pathname === "/tasks";
    return loc.pathname === to || loc.pathname.startsWith(`${to}/`);
  };

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-[var(--border)] bg-[var(--bg-sidebar)] transition-[width] duration-200",
        collapsed ? "w-16" : "w-64",
        "hidden md:flex",
      )}
    >
      <div className="flex h-16 items-center gap-2 border-b border-[var(--border)] px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] text-white">
          <Sparkles className="h-4 w-4" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-[var(--text-primary)]">Tracker Pro</div>
            <div className="truncate text-[10px] text-[var(--text-muted)]">Project Manager</div>
          </div>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <div className="flex flex-col gap-0.5">
          {PRIMARY.map((item) => (
            <NavItemLink key={item.to} item={item} active={isActive(item.to)} collapsed={collapsed} />
          ))}
        </div>
        <div className="my-3 h-px bg-[var(--border)]" />
        <div className="flex flex-col gap-0.5">
          {SECONDARY.map((item) => (
            <NavItemLink key={item.to} item={item} active={isActive(item.to)} collapsed={collapsed} />
          ))}
        </div>
      </nav>
      <button
        onClick={toggle}
        className="m-2 flex h-8 items-center justify-center gap-2 rounded-md text-xs text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
        aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
      >
        {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        {!collapsed && <span>Colapsar</span>}
      </button>
    </aside>
  );
}

function NavItemLink({ item, active, collapsed }: { item: NavItem; active: boolean; collapsed: boolean }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
        active
          ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] font-medium"
          : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]",
      )}
      title={collapsed ? item.label : undefined}
    >
      {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-[var(--accent)]" />}
      <span className={cn("shrink-0", active ? "text-[var(--accent)]" : "text-[var(--text-muted)]")}>
        {item.icon}
      </span>
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  );
}
