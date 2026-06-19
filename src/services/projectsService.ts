import { readJson, writeJson } from "./jsonStorage";
import { uid } from "../utils/id";
import { nowISO } from "../utils/dates";
import type { Project, ProjectDraft } from "../types";

const ENTITY = "projects";
const URL = "/data/projects.json";

let cache: Project[] | null = null;

export async function listProjects(): Promise<Project[]> {
  if (!cache) cache = await readJson<Project>(ENTITY, URL);
  return cache;
}

export function getProjectsSync(): Project[] {
  return cache ?? [];
}

export function setProjectsCache(data: Project[]): void {
  cache = data;
  writeJson(ENTITY, data);
}

export async function createProject(data: ProjectDraft): Promise<Project> {
  const list = await listProjects();
  const project: Project = {
    ...data,
    id: uid("prj"),
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
  const next = [project, ...list];
  setProjectsCache(next);
  return project;
}

export async function updateProject(id: string, patch: Partial<ProjectDraft>): Promise<Project | null> {
  const list = await listProjects();
  const idx = list.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  const updated: Project = { ...list[idx], ...patch, updatedAt: nowISO() };
  const next = [...list];
  next[idx] = updated;
  setProjectsCache(next);
  return updated;
}

export async function deleteProject(id: string): Promise<boolean> {
  const list = await listProjects();
  const next = list.filter((p) => p.id !== id);
  if (next.length === list.length) return false;
  setProjectsCache(next);
  return true;
}
