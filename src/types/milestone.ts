import type { ID, ISODate, MilestoneStatus } from "./common";

export interface Milestone {
  id: ID;
  projectId: ID;
  name: string;
  description: string;
  targetDate: ISODate;
  status: MilestoneStatus;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export type MilestoneDraft = Omit<Milestone, "id" | "createdAt" | "updatedAt">;
