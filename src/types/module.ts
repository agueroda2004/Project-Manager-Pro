import type { ID, ISODate, Priority } from "./common";

export interface Module {
  id: ID;
  projectId: ID;
  name: string;
  description: string;
  priority: Priority;
  startDate: ISODate;
  endDate: ISODate;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export type ModuleDraft = Omit<Module, "id" | "createdAt" | "updatedAt">;
