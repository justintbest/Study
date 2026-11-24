import type { ObjectiveMeta } from '../types';
import type { Progress } from './progress';
import { CONTENT_BY_OBJECTIVE, questionsForObjective } from '../content';
import { todayISO } from './dates';

export interface ObjectiveStats {
  objectiveId: string;
  hasContent: boolean;
  totalQuestions: number;
  seenQuestions: number;
  attempts: number;
  /** Accuracy over each question's last ≤5 attempts (recency-weighted view). */
  recentAccuracy: number | null;
  /** Share of this objective's questions whose most recent answer was correct. */
  mastery: number;
  noteRead: boolean;
  totalCards: number;
  learnedCards: number; // reviewed at least once and not currently lapsed
  dueCards: number;
}

/** An objective counts as a weak spot once it has this many answers. */
export const WEAK_MIN_ATTEMPTS = 3;
export const WEAK_THRESHOLD = 0.7;

export function objectiveStats(obj: ObjectiveMeta, p: Progress, today = todayISO()): ObjectiveStats {
  const content = CONTENT_BY_OBJECTIVE.get(obj.id);
  const questions = questionsForObjective(obj.id);
  const cards = content?.flashcards ?? [];
  let seen = 0,
    attempts = 0,
    recentRight = 0,
    recentTotal = 0,
    lastRight = 0;
  for (const q of questions) {
    const r = p.questions[q.id];
    if (!r) continue;
    seen++;
    attempts += r.attempts;
    recentTotal += r.recent.length;
    recentRight += [...r.recent].filter((c) => c === '1').length;
    if (r.recent.endsWith('1')) lastRight++;
  }
  let learned = 0,
    due = 0;
  for (const c of cards) {
    const s = p.cards[c.id];
    if (!s) continue;
    if (s.reps > 0) learned++;
    if (s.due <= today) due++;
  }
  return {
    objectiveId: obj.id,
    hasContent: !!content,
    totalQuestions: questions.length,
    seenQuestions: seen,
    attempts,
    recentAccuracy: recentTotal ? recentRight / recentTotal : null,
    mastery: questions.length ? lastRight / questions.length : 0,
    noteRead: !!p.notesRead[obj.id],
    totalCards: cards.length,
    learnedCards: learned,
    dueCards: due,
  };
}

export function isWeak(s: ObjectiveStats): boolean {
  return s.attempts >= WEAK_MIN_ATTEMPTS && s.recentAccuracy !== null && s.recentAccuracy < WEAK_THRESHOLD;
}

/** Objectives with enough answers, sorted weakest first. */
export function weakSpots(objs: ObjectiveMeta[], p: Progress): ObjectiveStats[] {
  return objs
    .map((o) => objectiveStats(o, p))
    .filter((s) => s.attempts >= WEAK_MIN_ATTEMPTS && s.recentAccuracy !== null)
    .sort((a, b) => a.recentAccuracy! - b.recentAccuracy! || b.attempts - a.attempts);
}

export interface Rollup {
  objectives: number;
  withContent: number;
  questions: number;
  seen: number;
  mastery: number; // weighted by question count
  notesRead: number;
  dueCards: number;
  totalCards: number;
  learnedCards: number;
}

export function rollup(objs: ObjectiveMeta[], p: Progress): Rollup {
  const r: Rollup = { objectives: objs.length, withContent: 0, questions: 0, seen: 0, mastery: 0, notesRead: 0, dueCards: 0, totalCards: 0, learnedCards: 0 };
  let masteredQs = 0;
  for (const o of objs) {
    const s = objectiveStats(o, p);
    if (s.hasContent) r.withContent++;
    r.questions += s.totalQuestions;
    r.seen += s.seenQuestions;
    masteredQs += s.mastery * s.totalQuestions;
    if (s.noteRead) r.notesRead++;
    r.dueCards += s.dueCards;
    r.totalCards += s.totalCards;
    r.learnedCards += s.learnedCards;
  }
  r.mastery = r.questions ? masteredQs / r.questions : 0;
  return r;
}

export const pct = (x: number | null | undefined) => (x === null || x === undefined ? '–' : `${Math.round(x * 100)}%`);
