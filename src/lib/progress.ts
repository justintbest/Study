import { useSyncExternalStore } from 'react';
import type { CardState, Rating } from './sm2';
import { review } from './sm2';
import { todayISO } from './dates';

export const STORAGE_KEY = 'are-study-progress-v1';
export const PROGRESS_VERSION = 1;

export interface QuestionRecord {
  obj: string; // objective id (kept so stats survive content edits)
  attempts: number;
  correct: number;
  /** Most recent results, oldest→newest, "1" = correct, max 5 chars. */
  recent: string;
  lastAt: string; // ISO timestamp
}

export interface CardRecord extends CardState {
  obj: string;
  firstSeen: string; // YYYY-MM-DD
}

export interface SessionRecord {
  at: string;
  mode: 'practice' | 'exam' | 'study';
  scope: string;
  total: number;
  correct: number;
  seconds: number;
}

export type ThemePref = 'system' | 'light' | 'dark';

export interface Progress {
  version: number;
  createdAt: string;
  updatedAt: string;
  lastExportAt?: string;
  questions: Record<string, QuestionRecord>;
  cards: Record<string, CardRecord>;
  notesRead: Record<string, string>;
  sessions: SessionRecord[];
  settings: { theme: ThemePref; newCardsPerDay: number };
}

export function emptyProgress(): Progress {
  const now = new Date().toISOString();
  return {
    version: PROGRESS_VERSION,
    createdAt: now,
    updatedAt: now,
    questions: {},
    cards: {},
    notesRead: {},
    sessions: [],
    settings: { theme: 'system', newCardsPerDay: 20 },
  };
}

/** Validate + normalise an unknown object into Progress. Throws with a readable message. */
export function parseProgress(data: unknown): Progress {
  if (!data || typeof data !== 'object') throw new Error('File is not a JSON object.');
  const d = data as Partial<Progress>;
  if (d.version !== PROGRESS_VERSION) throw new Error(`Unsupported progress version: ${String(d.version)}`);
  for (const k of ['questions', 'cards', 'notesRead'] as const) {
    if (d[k] !== undefined && (typeof d[k] !== 'object' || Array.isArray(d[k]))) throw new Error(`"${k}" must be an object.`);
  }
  if (d.sessions !== undefined && !Array.isArray(d.sessions)) throw new Error('"sessions" must be an array.');
  const base = emptyProgress();
  return {
    ...base,
    ...d,
    questions: d.questions ?? {},
    cards: d.cards ?? {},
    notesRead: d.notesRead ?? {},
    sessions: d.sessions ?? [],
    settings: { ...base.settings, ...(d.settings ?? {}) },
  } as Progress;
}

// ---------------- store ----------------

function load(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return parseProgress(JSON.parse(raw));
  } catch (e) {
    console.warn('Could not read saved progress; starting fresh.', e);
  }
  return emptyProgress();
}

let state: Progress = typeof localStorage === 'undefined' ? emptyProgress() : load();
const listeners = new Set<() => void>();
let storageError: string | null = null;

function commit(next: Progress) {
  state = { ...next, updatedAt: new Date().toISOString() };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    storageError = null;
  } catch (e) {
    storageError = 'Progress could not be saved to this browser (storage full or blocked). Export a backup.';
    console.error(e);
  }
  listeners.forEach((l) => l());
}

export function getProgress(): Progress {
  return state;
}
export function getStorageError(): string | null {
  return storageError;
}

export function useProgress(): Progress {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => state,
  );
}

// Keep tabs in sync.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      state = load();
      listeners.forEach((l) => l());
    }
  });
}

// ---------------- actions ----------------

export function recordAnswer(questionId: string, objectiveId: string, correct: boolean) {
  const prev = state.questions[questionId];
  const rec: QuestionRecord = {
    obj: objectiveId,
    attempts: (prev?.attempts ?? 0) + 1,
    correct: (prev?.correct ?? 0) + (correct ? 1 : 0),
    recent: ((prev?.recent ?? '') + (correct ? '1' : '0')).slice(-5),
    lastAt: new Date().toISOString(),
  };
  commit({ ...state, questions: { ...state.questions, [questionId]: rec } });
}

export function recordSession(s: SessionRecord) {
  commit({ ...state, sessions: [...state.sessions, s].slice(-300) });
}

export function markNoteRead(objectiveId: string, read = true) {
  const notesRead = { ...state.notesRead };
  if (read) notesRead[objectiveId] = new Date().toISOString();
  else delete notesRead[objectiveId];
  commit({ ...state, notesRead });
}

export function reviewCard(cardId: string, objectiveId: string, rating: Rating) {
  const today = todayISO();
  const prev = state.cards[cardId];
  const next = review(prev, rating, today);
  commit({
    ...state,
    cards: { ...state.cards, [cardId]: { ...next, obj: objectiveId, firstSeen: prev?.firstSeen ?? today } },
  });
}

export function updateSettings(patch: Partial<Progress['settings']>) {
  commit({ ...state, settings: { ...state.settings, ...patch } });
}

export function replaceProgress(p: Progress) {
  commit(p);
}

export function resetProgress() {
  commit({ ...emptyProgress(), settings: state.settings });
}

export function exportProgress(): { filename: string; json: string } {
  const now = new Date();
  commit({ ...state, lastExportAt: now.toISOString() });
  return {
    filename: `are-study-progress-${todayISO(now)}.json`,
    json: JSON.stringify(state, null, 2),
  };
}
