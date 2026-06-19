import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from "recharts";
import { useProjectsStore } from "../store/projectsStore";
import { useTasksStore } from "../store/tasksStore";
import { useModulesStore } from "../store/modulesStore";
import { useMilestonesStore } from "../store/milestonesStore";
import { useActivitiesStore } from "../store/activitiesStore";
import {
  TASK_STATUS_COLORS,
  TASK_STATUS_LABELS,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  type TaskStatus,
  type Priority,
} from "../types";
import { getEffectiveStatus } from "../utils/dependencies";
import { projectProgress } from "../utils/progress";
import { formatDate, formatRelative } from "../utils/dates";
import { Link } from "react-router-dom";
import {
  FolderKanban,
  ListTodo,
  Clock,
  AlertOctagon,
  PlayCircle,
  CheckCircle2,
  Hourglass,
  Target,
  TrendingUp,
  Activity as ActivityIcon,
  BarChart3,
} from "lucide-react";
import { differenceInDays, startOfDay, addDays, format } from "date-fns";
import { StatCard } from "../components/dashboard/StatCard";
import { Badge } from "../components/shared/Badge";

export function DashboardPage() {
  const projects = useProjectsStore((s) => s.items);
  const modules = useModulesStore((s) => s.items);
  const tasks = useTasksStore((s) => s.items);
  const milestones = useMilestonesStore((s) => s.items);
  const activities = useActivitiesStore((s) => s.items);

  const stats = useMemo(() => {
    const statusMap: Record<TaskStatus, number> = {
      pendiente: 0,
      bloqueado: 0,
      trabajando: 0,
      testing: 0,
      terminado: 0,
    };
    const prioMap: Record<Priority, number> = { baja: 0, media: 0, alta: 0, critica: 0 };
    let estimated = 0;
    let invested = 0;
    for (const t of tasks) {
      const eff = getEffectiveStatus(t, tasks);
      statusMap[eff] += 1;
      prioMap[t.priority] += 1;
      estimated += t.estimatedHours;
      invested += t.investedHours;
    }
    return { statusMap, prioMap, estimated, invested };
  }, [tasks]);

  const projectProgressData = useMemo(
    () =>
      projects.map((p) => ({
        name: p.name.length > 16 ? p.name.slice(0, 14) + "…" : p.name,
        progreso: projectProgress(p.id, tasks),
        color: p.color,
      })),
    [projects, tasks, modules],
  );

  const statusPieData = useMemo(
    () =>
      (Object.entries(stats.statusMap) as [TaskStatus, number][])
        .filter(([, v]) => v > 0)
        .map(([k, v]) => ({ name: TASK_STATUS_LABELS[k], value: v, color: TASK_STATUS_COLORS[k] })),
    [stats.statusMap],
  );

  const priorityPieData = useMemo(
    () =>
      (Object.entries(stats.prioMap) as [Priority, number][])
        .filter(([, v]) => v > 0)
        .map(([k, v]) => ({ name: PRIORITY_LABELS[k], value: v, color: PRIORITY_COLORS[k] })),
    [stats.prioMap],
  );

  const weeklyProductivity = useMemo(() => {
    const today = startOfDay(new Date());
    const days: { date: string; label: string; completadas: number; invertidas: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = addDays(today, -i);
      const label = format(d, "dd MMM");
      days.push({ date: d.toISOString(), label, completadas: 0, invertidas: 0 });
    }
    for (const t of tasks) {
      if (t.status === "terminado") {
        const u = new Date(t.updatedAt);
        const idx = days.findIndex((d) => startOfDay(new Date(d.date)).getTime() === startOfDay(u).getTime());
        if (idx >= 0) days[idx].completadas += 1;
      }
      const day = startOfDay(new Date(t.updatedAt)).getTime();
      const idx = days.findIndex((d) => startOfDay(new Date(d.date)).getTime() === day);
      if (idx >= 0) days[idx].invertidas += t.investedHours;
    }
    return days;
  }, [tasks]);

  const monthlyArea = useMemo(() => {
    const map = new Map<string, number>();
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const k = format(d, "MMM yy");
      map.set(k, 0);
    }
    for (const t of tasks) {
      if (t.status === "terminado") {
        const d = new Date(t.updatedAt);
        const k = format(d, "MMM yy");
        if (map.has(k)) map.set(k, (map.get(k) ?? 0) + 1);
      }
    }
    return Array.from(map.entries()).map(([mes, total]) => ({ mes, total }));
  }, [tasks]);

  const totalEstimated = stats.estimated;
  const totalInvested = stats.invested;
  const completedMilestones = milestones.filter((m) => m.status === "alcanzado").length;

  const upcoming = useMemo(() => {
    return [...tasks]
      .filter((t) => t.dueDate && t.status !== "terminado")
      .map((t) => ({ t, days: differenceInDays(new Date(t.dueDate as string), new Date()) }))
      .filter((x) => x.days >= -3 && x.days <= 14)
      .sort((a, b) => a.days - b.days)
      .slice(0, 6);
  }, [tasks]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Dashboard</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Visión general del progreso, tareas y productividad.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard
          icon={<FolderKanban className="h-4 w-4" />}
          label="Proyectos"
          value={projects.length}
          tone="indigo"
        />
        <StatCard
          icon={<ListTodo className="h-4 w-4" />}
          label="Tareas"
          value={tasks.length}
          tone="blue"
        />
        <StatCard
          icon={<Hourglass className="h-4 w-4" />}
          label="Pendientes"
          value={stats.statusMap.pendiente}
          tone="zinc"
        />
        <StatCard
          icon={<AlertOctagon className="h-4 w-4" />}
          label="Bloqueadas"
          value={stats.statusMap.bloqueado}
          tone="red"
        />
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Terminadas"
          value={stats.statusMap.terminado}
          tone="emerald"
        />
        <StatCard
          icon={<Target className="h-4 w-4" />}
          label="Hitos logrados"
          value={`${completedMilestones}/${milestones.length}`}
          tone="purple"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <Clock className="h-3.5 w-3.5" /> Horas estimadas
          </div>
          <div className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">
            {totalEstimated}<span className="text-sm text-[var(--text-muted)]"> h</span>
          </div>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <PlayCircle className="h-3.5 w-3.5" /> Horas invertidas
          </div>
          <div className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">
            {totalInvested}<span className="text-sm text-[var(--text-muted)]"> h</span>
          </div>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <TrendingUp className="h-3.5 w-3.5" /> Eficiencia
          </div>
          <div className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">
            {totalEstimated > 0
              ? `${Math.round((totalInvested / totalEstimated) * 100)}%`
              : "—"}
          </div>
          <div className="mt-1 text-xs text-[var(--text-muted)]">
            {totalInvested > totalEstimated ? "Por encima del estimado" : "Dentro del estimado"}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Progreso por proyecto</h3>
              <p className="text-xs text-[var(--text-muted)]">% de avance calculado sobre tareas</p>
            </div>
            <BarChart3 className="h-4 w-4 text-[var(--text-muted)]" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectProgressData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} domain={[0, 100]} unit="%" />
                <Tooltip />
                <Bar dataKey="progreso" radius={[6, 6, 0, 0]}>
                  {projectProgressData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
          <h3 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">Distribución de estados</h3>
          <p className="mb-2 text-xs text-[var(--text-muted)]">Tareas por estado actual</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusPieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={86} paddingAngle={2}>
                  {statusPieData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
          <h3 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">Distribución de prioridades</h3>
          <p className="mb-2 text-xs text-[var(--text-muted)]">Tareas según prioridad</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={priorityPieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={86} paddingAngle={2}>
                  {priorityPieData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 lg:col-span-2">
          <h3 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">Productividad semanal</h3>
          <p className="mb-2 text-xs text-[var(--text-muted)]">Tareas completadas por día (14 días)</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyProductivity} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="completadas" stroke="var(--accent)" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 lg:col-span-2">
          <h3 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">Avance mensual</h3>
          <p className="mb-2 text-xs text-[var(--text-muted)]">Tareas terminadas por mes (últimos 6 meses)</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyArea} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="mes" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="total" stroke="var(--accent)" strokeWidth={2.5} fill="url(#gradArea)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
          <h3 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">Próximas entregas</h3>
          <p className="mb-2 text-xs text-[var(--text-muted)]">Tareas con vencimiento cercano</p>
          {upcoming.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-[var(--text-muted)]">
              Sin entregas próximas
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {upcoming.map(({ t, days }) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-app)] px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm text-[var(--text-primary)]">{t.title}</div>
                    <div className="text-xs text-[var(--text-muted)]">{formatDate(t.dueDate)}</div>
                  </div>
                  <Badge tone={days < 0 ? "red" : days <= 3 ? "amber" : "blue"}>
                    {days < 0 ? `Vencida ${Math.abs(days)}d` : days === 0 ? "Hoy" : `${days}d`}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Actividad reciente</h3>
          <Link to="/activity" className="text-xs text-[var(--accent)] hover:underline">Ver todo</Link>
        </div>
        {activities.length === 0 ? (
          <div className="text-sm text-[var(--text-muted)]">Sin actividad reciente.</div>
        ) : (
          <ul className="flex flex-col gap-2">
            {activities.slice(0, 6).map((a) => (
              <li key={a.id} className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-app)] px-3 py-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
                  <ActivityIcon className="h-3.5 w-3.5" />
                </span>
                <span className="flex-1 truncate text-sm text-[var(--text-primary)]">{a.message}</span>
                <span className="text-xs text-[var(--text-muted)]">{formatRelative(a.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
