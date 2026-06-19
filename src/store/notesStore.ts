import { create } from "zustand";
import type { Note, NoteDraft } from "../types";
import * as svc from "../services/notesService";
import { logActivity } from "../services/activitiesService";

interface NotesState {
  items: Note[];
  loaded: boolean;
  loading: boolean;
  load: () => Promise<void>;
  create: (data: NoteDraft) => Promise<Note>;
  update: (id: string, patch: Partial<NoteDraft>) => Promise<Note | null>;
  remove: (id: string) => Promise<boolean>;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  items: [],
  loaded: false,
  loading: false,

  load: async () => {
    if (get().loaded || get().loading) return;
    set({ loading: true });
    const items = await svc.listNotes();
    set({ items, loaded: true, loading: false });
  },

  create: async (data) => {
    const note = await svc.createNote(data);
    set({ items: [note, ...get().items] });
    await logActivity("note_added", note.id, "note", `Nota agregada`);
    return note;
  },

  update: async (id, patch) => {
    const updated = await svc.updateNote(id, patch);
    if (updated) {
      set({ items: get().items.map((n) => (n.id === id ? updated : n)) });
      await logActivity("note_updated", updated.id, "note", `Nota actualizada`);
    }
    return updated;
  },

  remove: async (id) => {
    const ok = await svc.deleteNote(id);
    if (ok) set({ items: get().items.filter((n) => n.id !== id) });
    return ok;
  },
}));
