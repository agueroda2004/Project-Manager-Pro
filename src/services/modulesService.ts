import { readJson, writeJson } from "./jsonStorage";
import { uid } from "../utils/id";
import { nowISO } from "../utils/dates";
import type { Module, ModuleDraft } from "../types";

const ENTITY = "modules";
const URL = "/data/modules.json";

let cache: Module[] | null = null;

export async function listModules(): Promise<Module[]> {
  if (!cache) cache = await readJson<Module>(ENTITY, URL);
  return cache;
}

export function getModulesSync(): Module[] {
  return cache ?? [];
}

export function setModulesCache(data: Module[]): void {
  cache = data;
  writeJson(ENTITY, data);
}

export async function createModule(data: ModuleDraft): Promise<Module> {
  const list = await listModules();
  const mod: Module = {
    ...data,
    id: uid("mod"),
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
  const next = [mod, ...list];
  setModulesCache(next);
  return mod;
}

export async function updateModule(id: string, patch: Partial<ModuleDraft>): Promise<Module | null> {
  const list = await listModules();
  const idx = list.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  const updated: Module = { ...list[idx], ...patch, updatedAt: nowISO() };
  const next = [...list];
  next[idx] = updated;
  setModulesCache(next);
  return updated;
}

export async function deleteModule(id: string): Promise<boolean> {
  const list = await listModules();
  const next = list.filter((m) => m.id !== id);
  if (next.length === list.length) return false;
  setModulesCache(next);
  return true;
}
