export type ID = string;
export type ISODate = string;

export const PROJECT_STATUS = [
  "planeacion",
  "desarrollo",
  "testing",
  "produccion",
  "finalizado",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUS)[number];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  planeacion: "Planeación",
  desarrollo: "Desarrollo",
  testing: "Testing",
  produccion: "Producción",
  finalizado: "Finalizado",
};

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  planeacion: "#a1a1aa",
  desarrollo: "#3b82f6",
  testing: "#f59e0b",
  produccion: "#10b981",
  finalizado: "#6366f1",
};

export const TASK_STATUS = [
  "pendiente",
  "bloqueado",
  "trabajando",
  "testing",
  "terminado",
] as const;
export type TaskStatus = (typeof TASK_STATUS)[number];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pendiente: "Pendiente",
  bloqueado: "Bloqueado",
  trabajando: "Trabajando",
  testing: "Testing",
  terminado: "Terminado",
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  pendiente: "#a1a1aa",
  bloqueado: "#ef4444",
  trabajando: "#3b82f6",
  testing: "#f59e0b",
  terminado: "#10b981",
};

export const PRIORITY = ["baja", "media", "alta", "critica"] as const;
export type Priority = (typeof PRIORITY)[number];

export const PRIORITY_LABELS: Record<Priority, string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
  critica: "Crítica",
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  baja: "#10b981",
  media: "#eab308",
  alta: "#f97316",
  critica: "#ef4444",
};

export const MILESTONE_STATUS = ["pendiente", "alcanzado"] as const;
export type MilestoneStatus = (typeof MILESTONE_STATUS)[number];

export const MILESTONE_STATUS_LABELS: Record<MilestoneStatus, string> = {
  pendiente: "Pendiente",
  alcanzado: "Alcanzado",
};

export const MILESTONE_STATUS_COLORS: Record<MilestoneStatus, string> = {
  pendiente: "#a1a1aa",
  alcanzado: "#10b981",
};

export const ACTIVITY_TYPES = [
  "project_created",
  "project_updated",
  "project_deleted",
  "module_created",
  "module_updated",
  "module_deleted",
  "task_created",
  "task_updated",
  "task_completed",
  "task_status_changed",
  "task_deleted",
  "dependency_added",
  "dependency_removed",
  "milestone_created",
  "milestone_achieved",
  "milestone_updated",
  "category_created",
  "category_updated",
  "category_deleted",
  "note_added",
  "note_updated",
  "note_deleted",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];
