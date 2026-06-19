import { create } from "zustand";
import type { Activity } from "../types";
import * as svc from "../services/activitiesService";

interface ActivitiesState {
  items: Activity[];
  loaded: boolean;
  loading: boolean;
  load: () => Promise<void>;
  add: (activity: Activity) => void;
}

export const useActivitiesStore = create<ActivitiesState>((set, get) => ({
  items: [],
  loaded: false,
  loading: false,

  load: async () => {
    if (get().loaded || get().loading) return;
    set({ loading: true });
    const items = await svc.listActivities();
    set({ items, loaded: true, loading: false });
  },

  add: (activity) => {
    set({ items: [activity, ...get().items].slice(0, 500) });
  },
}));
