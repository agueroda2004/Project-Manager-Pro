import { readJson, writeJson } from "./jsonStorage";
import { uid } from "../utils/id";
import { nowISO } from "../utils/dates";
import type { Note, NoteDraft } from "../types";

const ENTITY = "notes";
const URL = "/data/notes.json";

let cache: Note[] | null = null;

export async function listNotes(): Promise<Note[]> {
  if (!cache) cache = await readJson<Note>(ENTITY, URL);
  return cache;
}

export function getNotesSync(): Note[] {
  return cache ?? [];
}

export function setNotesCache(data: Note[]): void {
  cache = data;
  writeJson(ENTITY, data);
}

export async function createNote(data: NoteDraft): Promise<Note> {
  const list = await listNotes();
  const note: Note = {
    ...data,
    id: uid("nte"),
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
  setNotesCache([note, ...list]);
  return note;
}

export async function updateNote(id: string, patch: Partial<NoteDraft>): Promise<Note | null> {
  const list = await listNotes();
  const idx = list.findIndex((n) => n.id === id);
  if (idx === -1) return null;
  const updated: Note = { ...list[idx], ...patch, updatedAt: nowISO() };
  const next = [...list];
  next[idx] = updated;
  setNotesCache(next);
  return updated;
}

export async function deleteNote(id: string): Promise<boolean> {
  const list = await listNotes();
  const next = list.filter((n) => n.id !== id);
  if (next.length === list.length) return false;
  setNotesCache(next);
  return true;
}

export async function deleteNotesForTask(taskId: string): Promise<void> {
  const list = await listNotes();
  const next = list.filter((n) => n.taskId !== taskId);
  if (next.length !== list.length) setNotesCache(next);
}
