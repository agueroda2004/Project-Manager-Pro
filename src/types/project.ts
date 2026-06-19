import type { ID, ISODate, ProjectStatus } from "./common";

export interface Project {
  id: ID;
  name: string;
  description: string;
  startDate: ISODate;
  endDate: ISODate;
  status: ProjectStatus;
  color: string;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export type ProjectDraft = Omit<Project, "id" | "createdAt" | "updatedAt">;
