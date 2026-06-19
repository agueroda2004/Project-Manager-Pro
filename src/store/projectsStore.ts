import { create } from "zustand";
import type { Project, ProjectDraft } from "../types";
import * as svc from "../services/projectsService";
import { logActivity } from "../services/activitiesService";

interface ProjectsState {
  items: Project[];
  loaded: boolean;
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  create: (data: ProjectDraft) => Promise<Project>;
  update: (id: string, patch: Partial<ProjectDraft>) => Promise<Project | null>;
  remove: (id: string) => Promise<boolean>;
  replaceAll: (items: Project[]) => void;
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  items: [],
  loaded: false,
  loading: false,
  error: null,

  load: async () => {
    if (get().loaded || get().loading) return;
    set({ loading: true, error: null });
    try {
      const items = await svc.listProjects();
      set({ items, loaded: true, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  create: async (data) => {
    const project = await svc.createProject(data);
    set({ items: [project, ...get().items] });
    await logActivity("project_created", project.id, "project", `Proyecto "${project.name}" creado`);
    return project;
  },

  update: async (id, patch) => {
    const updated = await svc.updateProject(id, patch);
    if (updated) {
      set({ items: get().items.map((p) => (p.id === id ? updated : p)) });
      await logActivity("project_updated", updated.id, "project", `Proyecto "${updated.name}" actualizado`);
    }
    return updated;
  },

  remove: async (id) => {
    const ok = await svc.deleteProject(id);
    if (ok) {
      set({ items: get().items.filter((p) => p.id !== id) });
    }
    return ok;
  },

  replaceAll: (items) => {
    svc.setProjectsCache(items);
    set({ items, loaded: true });
  },
}));
