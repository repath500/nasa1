import { useSyncExternalStore } from 'react';

/** Pins and notes, kept in localStorage (wrapped in try/catch) and read by the Gap Brief. */
export interface Note { id: string; rowId: string | null; accession: string | null; text: string; createdAt: string }

const KEY = 'fa.notes.v1';
export const FREE_NOTE_LIMIT = 3;

let cache: Note[] | null = null;
const listeners = new Set<() => void>();

function read(): Note[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]') as unknown;
    if (!Array.isArray(v)) return [];
    return v.filter((n): n is Note => !!n && typeof (n as Note).id === 'string' && typeof (n as Note).text === 'string');
  } catch {
    return [];
  }
}
function write(next: Note[]) {
  cache = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage unavailable: notes live for this tab only */ }
  listeners.forEach((l) => l());
}
export function getNotes(): Note[] {
  cache ??= read();
  return cache;
}
export function addNote(n: { rowId: string | null; accession: string | null; text: string }): Note {
  const note: Note = { id: `n${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, createdAt: new Date().toISOString(), ...n };
  write([...getNotes(), note]);
  return note;
}
export function updateNote(id: string, text: string) {
  write(getNotes().map((n) => (n.id === id ? { ...n, text } : n)));
}
export function removeNote(id: string) {
  write(getNotes().filter((n) => n.id !== id));
}
export function useNotes(): Note[] {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    getNotes,
    () => [],
  );
}
