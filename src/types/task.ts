import type { ID, ISODate, Priority, TaskStatus } from "./common";

export interface Subtask {
  id: ID;
  name: string;
  done: boolean;
}

export interface Task {
  id: ID;
  projectId: ID;
  moduleId: ID;
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  dueDate: ISODate | null;
  estimatedHours: number;
  investedHours: number;
  categoryIds: ID[];
  dependsOn: ID[];
  subtasks: Subtask[];
  createdAt: ISODate;
  updatedAt: ISODate;
}

export type TaskDraft = Omit<Task, "id" | "createdAt" | "updatedAt">;
