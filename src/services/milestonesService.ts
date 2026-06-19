import { readJson, writeJson } from "./jsonStorage";
import { uid } from "../utils/id";
import { nowISO } from "../utils/dates";
import type { Milestone, MilestoneDraft } from "../types";

const ENTITY = "milestones";
const URL = "/data/milestones.json";

let cache: Milestone[] | null = null;

export async function listMilestones(): Promise<Milestone[]> {
  if (!cache) cache = await readJson<Milestone>(ENTITY, URL);
  return cache;
}

export function getMilestonesSync(): Milestone[] {
  return cache ?? [];
}

export function setMilestonesCache(data: Milestone[]): void {
  cache = data;
  writeJson(ENTITY, data);
}

export async function createMilestone(data: MilestoneDraft): Promise<Milestone> {
  const list = await listMilestones();
  const ms: Milestone = {
    ...data,
    id: uid("mst"),
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
  const next = [ms, ...list];
  setMilestonesCache(next);
  return ms;
}

export async function updateMilestone(id: string, patch: Partial<MilestoneDraft>): Promise<Milestone | null> {
  const list = await listMilestones();
  const idx = list.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  const updated: Milestone = { ...list[idx], ...patch, updatedAt: nowISO() };
  const next = [...list];
  next[idx] = updated;
  setMilestonesCache(next);
  return updated;
}

export async function deleteMilestone(id: string): Promise<boolean> {
  const list = await listMilestones();
  const next = list.filter((m) => m.id !== id);
  if (next.length === list.length) return false;
  setMilestonesCache(next);
  return true;
}
