import { useMemo, useState } from "react";
import { Calendar, dateFnsLocalizer, type Event as RBCEvent, type View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useTasksStore } from "../store/tasksStore";
import { useMilestonesStore } from "../store/milestonesStore";
import { useProjectsStore } from "../store/projectsStore";
import { getEffectiveStatus } from "../utils/dependencies";
import { isOverdue } from "../utils/dates";
import { CustomDropdown } from "../components/shared/CustomDropdown";
import { TASK_STATUS_COLORS, MILESTONE_STATUS_COLORS } from "../types";
import { Calendar as CalIcon, Target, AlertOctagon } from "lucide-react";
import { addDays, differenceInCalendarDays, isAfter, isBefore } from "date-fns";
import { singleValue } from "../utils/dropdown";

const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

interface CalEvent extends RBCEvent {
  id: string;
  kind: "task" | "milestone";
  status: string;
  isOverdue?: boolean;
}

export function CalendarPage() {
  const tasks = useTasksStore((s) => s.items);
  const milestones = useMilestonesStore((s) => s.items);
  const projects = useProjectsStore((s) => s.items);

  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [view, setView] = useState<View>("month");
  const [date, setDate] = useState(new Date());

  const events = useMemo<CalEvent[]>(() => {
    const list: CalEvent[] = [];
    for (const t of tasks) {
      if (!t.dueDate) continue;
      if (projectFilter && t.projectId !== projectFilter) continue;
      const eff = getEffectiveStatus(t, tasks);
      list.push({
        id: t.id,
        title: t.title,
        start: new Date(t.dueDate),
        end: new Date(t.dueDate),
        allDay: true,
        kind: "task",
        status: eff,
        isOverdue: isOverdue(t.dueDate, eff),
      });
    }
    for (const m of milestones) {
      if (projectFilter && m.projectId !== projectFilter) continue;
      list.push({
        id: m.id,
        title: `🏁 ${m.name}`,
        start: new Date(m.targetDate),
        end: new Date(m.targetDate),
        allDay: true,
        kind: "milestone",
        status: m.status,
      });
    }
    return list;
  }, [tasks, milestones, projectFilter]);

  const eventStyleGetter = (event: CalEvent) => {
    let bg = "var(--accent)";
    if (event.kind === "task") {
      bg = event.isOverdue ? "#ef4444" : TASK_STATUS_COLORS[event.status as keyof typeof TASK_STATUS_COLORS] ?? bg;
    } else {
      bg = MILESTONE_STATUS_COLORS[event.status as keyof typeof MILESTONE_STATUS_COLORS] ?? bg;
    }
    return {
      style: {
        backgroundColor: bg,
        border: "none",
        borderRadius: 6,
        padding: "2px 6px",
        fontSize: 11,
      },
    };
  };

  const stats = useMemo(() => {
    const now = new Date();
    const weekEnd = addDays(now, 7);
    const overdue = tasks.filter((t) => t.dueDate && isOverdue(t.dueDate, getEffectiveStatus(t, tasks))).length;
    const upcoming = tasks.filter((t) => {
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate);
      return isAfter(d, now) && isBefore(d, weekEnd);
    });
    const today = tasks.filter((t) => t.dueDate && differenceInCalendarDays(new Date(t.dueDate), now) === 0).length;
    return { overdue, upcoming: upcoming.length, today };
  }, [tasks]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Calendario</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Fechas límite, hitos y vencimientos</p>
        </div>
        <div className="w-56">
          <CustomDropdown
            options={[
              { value: "__all", label: "Todos los proyectos" },
              ...projects.map((p) => ({ value: p.id, label: p.name, color: p.color })),
            ]}
            value={projectFilter ?? "__all"}
            onChange={(v) => { const x = singleValue(v); setProjectFilter(x === "__all" || x === null ? null : x); }}
            searchable
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
            <AlertOctagon className="h-4 w-4" />
          </span>
          <div>
            <div className="text-xs text-[var(--text-muted)]">Vencidas</div>
            <div className="text-xl font-semibold">{stats.overdue}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
            <CalIcon className="h-4 w-4" />
          </span>
          <div>
            <div className="text-xs text-[var(--text-muted)]">Hoy</div>
            <div className="text-xl font-semibold">{stats.today}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
            <Target className="h-4 w-4" />
          </span>
          <div>
            <div className="text-xs text-[var(--text-muted)]">Próximos 7 días</div>
            <div className="text-xl font-semibold">{stats.upcoming}</div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-3">
        <div className="h-[640px]">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            views={["month", "week", "agenda"]}
            eventPropGetter={eventStyleGetter}
            popup
            tooltipAccessor={(e) => `${e.title}${e.kind === "task" ? " (tarea)" : " (hito)"}`}
          />
        </div>
      </div>
    </div>
  );
}
