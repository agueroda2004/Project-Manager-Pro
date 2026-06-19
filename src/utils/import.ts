import type { Project, Module, Task, Category, Milestone, Activity, Note } from "../types";

export type EntityKey = "projects" | "modules" | "tasks" | "categories" | "milestones" | "activities" | "notes";
export type ImportableEntity = Project | Module | Task | Category | Milestone | Activity | Note;

export interface ImportPayload {
  projects?: Project[];
  modules?: Module[];
  tasks?: Task[];
  categories?: Category[];
  milestones?: Milestone[];
  activities?: Activity[];
  notes?: Note[];
  exportedAt?: string;
}

const ENTITY_KEYS: EntityKey[] = ["projects", "modules", "tasks", "categories", "milestones", "activities", "notes"];

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function hasStringField(obj: Record<string, unknown>, fields: string[]): boolean {
  return fields.every((f) => typeof obj[f] === "string" && obj[f].length > 0);
}

function validateEntity(entity: EntityKey, arr: unknown[]): string | null {
  if (arr.length === 0) return null;
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];
    if (!isObject(item)) return `${entity}[${i}] no es un objeto`;
    switch (entity) {
      case "projects":
        if (!hasStringField(item, ["id", "name", "startDate", "endDate", "status"])) {
          return `projects[${i}] falta id, name, startDate, endDate o status`;
        }
        break;
      case "modules":
        if (!hasStringField(item, ["id", "projectId", "name", "priority", "startDate", "endDate"])) {
          return `modules[${i}] falta id, projectId, name, priority, startDate o endDate`;
        }
        break;
      case "tasks":
        if (!hasStringField(item, ["id", "projectId", "moduleId", "title", "priority", "status"])) {
          return `tasks[${i}] falta id, projectId, moduleId, title, priority o status`;
        }
        break;
      case "categories":
        if (!hasStringField(item, ["id", "name", "color"])) {
          return `categories[${i}] falta id, name o color`;
        }
        break;
      case "milestones":
        if (!hasStringField(item, ["id", "projectId", "name", "targetDate", "status"])) {
          return `milestones[${i}] falta id, projectId, name, targetDate o status`;
        }
        break;
      case "activities":
        if (!hasStringField(item, ["id", "type", "entityId", "entityType", "message", "createdAt"])) {
          return `activities[${i}] falta id, type, entityId, entityType, message o createdAt`;
        }
        break;
      case "notes":
        if (!hasStringField(item, ["id", "taskId", "content"])) {
          return `notes[${i}] falta id, taskId o content`;
        }
        break;
    }
  }
  return null;
}

export interface ParsedImport {
  fullBackup: boolean;
  entities: Partial<Record<EntityKey, unknown[]>>;
  counts: Partial<Record<EntityKey, number>>;
}

export function parseImportPayload(raw: string): ParsedImport {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    throw new Error("El archivo no es un JSON válido");
  }

  if (Array.isArray(data)) {
    throw new Error("El archivo contiene un array raíz. Se esperaba un objeto con entidades o un backup completo.");
  }

  if (!isObject(data)) {
    throw new Error("Formato de archivo no reconocido");
  }

  const result: ParsedImport = { fullBackup: false, entities: {}, counts: {} };

  const matchedKeys = ENTITY_KEYS.filter((k) => k in data);

  if (matchedKeys.length === 0) {
    throw new Error(`El archivo no contiene ninguna entidad reconocida. Esperadas: ${ENTITY_KEYS.join(", ")}`);
  }

  result.fullBackup = matchedKeys.length > 1;

  for (const key of matchedKeys) {
    const val = data[key];
    if (!Array.isArray(val)) {
      throw new Error(`El campo "${key}" debe ser un array`);
    }
    const err = validateEntity(key, val);
    if (err) throw new Error(`Estructura inválida: ${err}`);
    result.entities[key] = val;
    result.counts[key] = val.length;
  }

  return result;
}

export function summarizePayload(p: ParsedImport): string {
  const parts = ENTITY_KEYS.filter((k) => p.counts[k]).map((k) => `${p.counts[k]} ${k}`);
  return parts.join(", ");
}
