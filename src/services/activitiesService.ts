import { readJson, writeJson } from "./jsonStorage";
import { createActivity } from "../utils/activity";
import type { Activity, ActivityType } from "../types";

const ENTITY = "activities";
const URL = "/data/activities.json";

let cache: Activity[] | null = null;

export async function listActivities(): Promise<Activity[]> {
  if (!cache) cache = await readJson<Activity>(ENTITY, URL);
  return cache;
}

export function getActivitiesSync(): Activity[] {
  return cache ?? [];
}

export function setActivitiesCache(data: Activity[]): void {
  cache = data;
  writeJson(ENTITY, data);
}

export async function logActivity(
  type: ActivityType,
  entityId: string,
  entityType: Activity["entityType"],
  message: string,
): Promise<Activity> {
  const list = await listActivities();
  const act = createActivity(type, entityId, entityType, message);
  const next = [act, ...list].slice(0, 500);
  setActivitiesCache(next);
  return act;
}

export async function deleteActivitiesForEntity(entityId: string): Promise<void> {
  const list = await listActivities();
  const next = list.filter((a) => a.entityId !== entityId);
  if (next.length !== list.length) setActivitiesCache(next);
}
