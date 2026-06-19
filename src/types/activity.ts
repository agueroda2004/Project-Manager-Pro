import type { ID, ISODate, ActivityType } from "./common";

export interface Activity {
  id: ID;
  type: ActivityType;
  entityId: ID;
  entityType: "project" | "module" | "task" | "milestone" | "category" | "note" | "dependency";
  message: string;
  createdAt: ISODate;
}
