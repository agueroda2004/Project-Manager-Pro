import { uid } from "./id";
import { nowISO } from "./dates";
import type { Activity, ActivityType } from "../types";

export function createActivity(
  type: ActivityType,
  entityId: string,
  entityType: Activity["entityType"],
  message: string,
): Activity {
  return {
    id: uid("act"),
    type,
    entityId,
    entityType,
    message,
    createdAt: nowISO(),
  };
}
