import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Priority, TaskStatus } from "../types";

export type Theme = "light" | "dark";

export interface TaskFilters {
  projectId: string | null;
  moduleId: string | null;
  status: TaskStatus | null;
  priority: Priority | null;
  categoryIds: string[];
  milestoneId: string | null;
  search: string;
  overdueOnly: boolean;
}

export const initialFilters: TaskFilters = {
  projectId: null,
  moduleId: null,
  status: null,
  priority: null,
  categoryIds: [],
  milestoneId: null,
  search: "",
  overdueOnly: false,
};

interface UIState {
  theme: Theme;
  sidebarCollapsed: boolean;
  searchOpen: boolean;
  seedDisabled: boolean;
  filters: TaskFilters;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  setSearchOpen: (v: boolean) => void;
  setSeedDisabled: (v: boolean) => void;
  setFilters: (patch: Partial<TaskFilters>) => void;
  resetFilters: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
      sidebarCollapsed: false,
      searchOpen: false,
      seedDisabled: false,
      filters: initialFilters,

      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((s) => ({ theme: s.theme === "dark" ? "light" : "dark" })),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      setSearchOpen: (v) => set({ searchOpen: v }),
      setSeedDisabled: (v) => set({ seedDisabled: v }),
      setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
      resetFilters: () => set({ filters: initialFilters }),
    }),
    {
      name: "pmp:ui",
      partialize: (s) => ({ theme: s.theme, sidebarCollapsed: s.sidebarCollapsed, seedDisabled: s.seedDisabled }),
    },
  ),
);
