import type { ID, ISODate } from "./common";

export interface Note {
  id: ID;
  taskId: ID;
  content: string;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export type NoteDraft = Omit<Note, "id" | "createdAt" | "updatedAt">;
