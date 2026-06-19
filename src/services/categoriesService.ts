import { readJson, writeJson } from "./jsonStorage";
import { uid } from "../utils/id";
import { nowISO } from "../utils/dates";
import type { Category, CategoryDraft } from "../types";

const ENTITY = "categories";
const URL = "/data/categories.json";

let cache: Category[] | null = null;

export async function listCategories(): Promise<Category[]> {
  if (!cache) cache = await readJson<Category>(ENTITY, URL);
  return cache;
}

export function getCategoriesSync(): Category[] {
  return cache ?? [];
}

export function setCategoriesCache(data: Category[]): void {
  cache = data;
  writeJson(ENTITY, data);
}

export async function createCategory(data: CategoryDraft): Promise<Category> {
  const list = await listCategories();
  const cat: Category = {
    ...data,
    id: uid("cat"),
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
  const next = [...list, cat];
  setCategoriesCache(next);
  return cat;
}

export async function updateCategory(id: string, patch: Partial<CategoryDraft>): Promise<Category | null> {
  const list = await listCategories();
  const idx = list.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  const updated: Category = { ...list[idx], ...patch, updatedAt: nowISO() };
  const next = [...list];
  next[idx] = updated;
  setCategoriesCache(next);
  return updated;
}

export async function deleteCategory(id: string): Promise<boolean> {
  const list = await listCategories();
  const next = list.filter((c) => c.id !== id);
  if (next.length === list.length) return false;
  setCategoriesCache(next);
  return true;
}
