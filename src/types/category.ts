import type { ID, ISODate } from "./common";

export interface Category {
  id: ID;
  name: string;
  color: string;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export type CategoryDraft = Omit<Category, "id" | "createdAt" | "updatedAt">;
