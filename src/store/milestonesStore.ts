import { create } from "zustand";
import type { Milestone, MilestoneDraft } from "../types";
import * as svc from "../services/milestonesService";
import { logActivity } from "../services/activitiesService";

interface MilestonesState {
  items: Milestone[];
  loaded: boolean;
  loading: boolean;
  load: () => Promise<void>;
  create: (data: MilestoneDraft) => Promise<Milestone>;
  update: (id: string, patch: Partial<MilestoneDraft>) => Promise<Milestone | null>;
  remove: (id: string) => Promise<boolean>;
}

export const useMilestonesStore = create<MilestonesState>((set, get) => ({
  items: [],
  loaded: false,
  loading: false,

  load: async () => {
    if (get().loaded || get().loading) return;
    set({ loading: true });
    const items = await svc.listMilestones();
    set({ items, loaded: true, loading: false });
  },

  create: async (data) => {
    const ms = await svc.createMilestone(data);
    set({ items: [ms, ...get().items] });
    await logActivity("milestone_created", ms.id, "milestone", `Hito "${ms.name}" creado`);
    return ms;
  },

  update: async (id, patch) => {
    const updated = await svc.updateMilestone(id, patch);
    if (updated) {
      set({ items: get().items.map((m) => (m.id === id ? updated : m)) });
      if (patch.status === "alcanzado" && updated.status === "alcanzado") {
        await logActivity("milestone_achieved", updated.id, "milestone", `Hito "${updated.name}" marcado como Alcanzado`);
      } else {
        await logActivity("milestone_updated", updated.id, "milestone", `Hito "${updated.name}" actualizado`);
      }
    }
    return updated;
  },

  remove: async (id) => {
    const ok = await svc.deleteMilestone(id);
    if (ok) set({ items: get().items.filter((m) => m.id !== id) });
    return ok;
  },
}));
