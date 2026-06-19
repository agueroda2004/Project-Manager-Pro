import { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AppLayout } from "./layouts/AppLayout";
import { useProjectsStore } from "./store/projectsStore";
import { useModulesStore } from "./store/modulesStore";
import { useTasksStore } from "./store/tasksStore";
import { useCategoriesStore } from "./store/categoriesStore";
import { useMilestonesStore } from "./store/milestonesStore";
import { useActivitiesStore } from "./store/activitiesStore";
import { useNotesStore } from "./store/notesStore";
import { DashboardPage } from "./pages/DashboardPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { ProjectDetailPage } from "./pages/ProjectDetailPage";
import { ModulesPage } from "./pages/ModulesPage";
import { TasksPage } from "./pages/TasksPage";
import { KanbanPage } from "./pages/KanbanPage";
import { CalendarPage } from "./pages/CalendarPage";
import { DependenciesPage } from "./pages/DependenciesPage";
import { MilestonesPage } from "./pages/MilestonesPage";
import { CategoriesPage } from "./pages/CategoriesPage";
import { ActivityPage } from "./pages/ActivityPage";
import { ReportsPage } from "./pages/ReportsPage";
import { SettingsPage } from "./pages/SettingsPage";
import {
  ProjectOverview,
  ProjectModulesTab,
  ProjectTasksTab,
  ProjectDependenciesTab,
  ProjectMilestonesTab,
  ProjectActivityTab,
} from "./pages/ProjectDetailTabs";
import { Sparkles } from "lucide-react";

function InitData({ children }: { children: React.ReactNode }) {
  const loadProjects = useProjectsStore((s) => s.load);
  const loadModules = useModulesStore((s) => s.load);
  const loadTasks = useTasksStore((s) => s.load);
  const loadCategories = useCategoriesStore((s) => s.load);
  const loadMilestones = useMilestonesStore((s) => s.load);
  const loadActivities = useActivitiesStore((s) => s.load);
  const loadNotes = useNotesStore((s) => s.load);

  useEffect(() => {
    void Promise.all([
      loadProjects(),
      loadModules(),
      loadTasks(),
      loadCategories(),
      loadMilestones(),
      loadActivities(),
      loadNotes(),
    ]);
  }, [loadProjects, loadModules, loadTasks, loadCategories, loadMilestones, loadActivities, loadNotes]);

  return <>{children}</>;
}

function PageLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-[var(--bg-app)]">
      <div className="flex flex-col items-center gap-3 text-[var(--text-muted)]">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent)] text-white shadow-lg">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="text-sm">Cargando Tracker Pro…</div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppLoader>
          <InitData>
            <Routes>
              <Route element={<AppLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="projects" element={<ProjectsPage />} />
                <Route path="projects/:projectId" element={<ProjectDetailPage />}>
                  <Route index element={<ProjectOverview />} />
                  <Route path="modules" element={<ProjectModulesTab />} />
                  <Route path="tasks" element={<ProjectTasksTab />} />
                  <Route path="dependencies" element={<ProjectDependenciesTab />} />
                  <Route path="milestones" element={<ProjectMilestonesTab />} />
                  <Route path="activity" element={<ProjectActivityTab />} />
                </Route>
                <Route path="modules" element={<ModulesPage />} />
                <Route path="tasks" element={<TasksPage />} />
                <Route path="tasks/kanban" element={<KanbanPage />} />
                <Route path="calendar" element={<CalendarPage />} />
                <Route path="dependencies" element={<DependenciesPage />} />
                <Route path="milestones" element={<MilestonesPage />} />
                <Route path="categories" element={<CategoriesPage />} />
                <Route path="activity" element={<ActivityPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="*" element={<DashboardPage />} />
              </Route>
            </Routes>
          </InitData>
        </AppLoader>
      </BrowserRouter>
    </ThemeProvider>
  );
}

function AppLoader({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 50);
    return () => window.clearTimeout(t);
  }, []);
  if (!ready) return <PageLoader />;
  return <>{children}</>;
}
