import { create } from "zustand";
import type { Module, ModuleDraft } from "../types";
import * as svc from "../services/modulesService";
import { logActivity } from "../services/activitiesService";

interface ModulesState {
  items: Module[];
  loaded: boolean;
  loading: boolean;
  load: () => Promise<void>;
  create: (data: ModuleDraft) => Promise<Module>;
  update: (id: string, patch: Partial<ModuleDraft>) => Promise<Module | null>;
  remove: (id: string) => Promise<boolean>;
}

export const useModulesStore = create<ModulesState>((set, get) => ({
  items: [],
  loaded: false,
  loading: false,

  load: async () => {
    if (get().loaded || get().loading) return;
    set({ loading: true });
    const items = await svc.listModules();
    set({ items, loaded: true, loading: false });
  },

  create: async (data) => {
    const mod = await svc.createModule(data);
    set({ items: [mod, ...get().items] });
    await logActivity("module_created", mod.id, "module", `Módulo "${mod.name}" creado`);
    return mod;
  },

  update: async (id, patch) => {
    const updated = await svc.updateModule(id, patch);
    if (updated) {
      set({ items: get().items.map((m) => (m.id === id ? updated : m)) });
      await logActivity("module_updated", updated.id, "module", `Módulo "${updated.name}" actualizado`);
    }
    return updated;
  },

  remove: async (id) => {
    const ok = await svc.deleteModule(id);
    if (ok) set({ items: get().items.filter((m) => m.id !== id) });
    return ok;
  },
}));
