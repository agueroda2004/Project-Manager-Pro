import { create } from "zustand";
import type { Category, CategoryDraft } from "../types";
import * as svc from "../services/categoriesService";
import { logActivity } from "../services/activitiesService";

interface CategoriesState {
  items: Category[];
  loaded: boolean;
  loading: boolean;
  load: () => Promise<void>;
  create: (data: CategoryDraft) => Promise<Category>;
  update: (id: string, patch: Partial<CategoryDraft>) => Promise<Category | null>;
  remove: (id: string) => Promise<boolean>;
}

export const useCategoriesStore = create<CategoriesState>((set, get) => ({
  items: [],
  loaded: false,
  loading: false,

  load: async () => {
    if (get().loaded || get().loading) return;
    set({ loading: true });
    const items = await svc.listCategories();
    set({ items, loaded: true, loading: false });
  },

  create: async (data) => {
    const cat = await svc.createCategory(data);
    set({ items: [...get().items, cat] });
    await logActivity("category_created", cat.id, "category", `Categoría "${cat.name}" creada`);
    return cat;
  },

  update: async (id, patch) => {
    const updated = await svc.updateCategory(id, patch);
    if (updated) {
      set({ items: get().items.map((c) => (c.id === id ? updated : c)) });
      await logActivity("category_updated", updated.id, "category", `Categoría "${updated.name}" actualizada`);
    }
    return updated;
  },

  remove: async (id) => {
    const ok = await svc.deleteCategory(id);
    if (ok) set({ items: get().items.filter((c) => c.id !== id) });
    return ok;
  },
}));
