import type { ObjectiveMeta, Question } from '../types';

export type QuizMode = 'random' | 'weighted' | 'missed' | 'unseen';

/** Fisher–Yates with injectable RNG for tests. */
export function shuffle<T>(arr: readonly T[], rng: () => number = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Split `n` items across buckets in proportion to `weights`, never exceeding `caps`
 * (largest-remainder method, with leftover redistributed to buckets that still have room).
 */
export function allocate(n: number, weights: number[], caps: number[]): number[] {
  const out = weights.map(() => 0);
  let remaining = Math.min(n, caps.reduce((s, c) => s + c, 0));
  while (remaining > 0) {
    const open = weights.map((w, i) => (out[i] < caps[i] && w > 0 ? i : -1)).filter((i) => i >= 0);
    if (!open.length) break;
    const wsum = open.reduce((s, i) => s + weights[i], 0);
    const raw = open.map((i) => ({ i, share: (remaining * weights[i]) / wsum }));
    let given = 0;
    for (const r of raw) {
      const take = Math.min(Math.floor(r.share), caps[r.i] - out[r.i]);
      out[r.i] += take;
      given += take;
    }
    if (given === 0) {
      // hand out single items by largest fractional share
      raw.sort((a, b) => b.share - Math.floor(b.share) - (a.share - Math.floor(a.share)) || b.share - a.share);
      for (const r of raw) {
        if (given >= remaining) break;
        if (out[r.i] < caps[r.i]) {
          out[r.i] += 1;
          given += 1;
        }
      }
    }
    remaining -= given;
    if (given === 0) break;
  }
  return out;
}

export interface BuildQuizOptions {
  objectives: ObjectiveMeta[];
  questionsByObjective: Map<string, Question[]>;
  count: number;
  mode: QuizMode;
  /** question id → last result correct? (undefined = never answered) */
  lastResult: (questionId: string) => boolean | undefined;
  rng?: () => number;
}

export function buildQuiz(o: BuildQuizOptions): Question[] {
  const rng = o.rng ?? Math.random;
  const pools = o.objectives.map((obj) => {
    let qs = o.questionsByObjective.get(obj.id) ?? [];
    if (o.mode === 'missed') qs = qs.filter((q) => o.lastResult(q.id) === false);
    if (o.mode === 'unseen') qs = qs.filter((q) => o.lastResult(q.id) === undefined);
    return shuffle(qs, rng);
  });

  if (o.mode === 'weighted') {
    const counts = allocate(
      o.count,
      o.objectives.map((obj) => obj.weight),
      pools.map((p) => p.length),
    );
    return shuffle(
      pools.flatMap((p, i) => p.slice(0, counts[i])),
      rng,
    );
  }
  return shuffle(pools.flat(), rng).slice(0, o.count);
}

// ---------------- grading ----------------

export type Response =
  | { kind: 'choice'; selected: string[] }
  | { kind: 'numeric'; value: string };

export function isAnswered(q: Question, r: Response | undefined): boolean {
  if (!r) return false;
  if (r.kind === 'numeric') return r.value.trim() !== '';
  if (q.type === 'cata') return r.selected.length === (q.selectCount ?? correctIds(q).length);
  return r.selected.length === 1;
}

export function correctIds(q: Question): string[] {
  return (q.options ?? []).filter((op) => op.correct).map((op) => op.id);
}

export function parseNumber(s: string): number {
  return Number(s.replace(/[,$%\s]/g, ''));
}

/** ARE scoring: all-or-nothing, no partial credit. */
export function grade(q: Question, r: Response | undefined): boolean {
  if (!r) return false;
  if (q.type === 'numeric') {
    if (r.kind !== 'numeric' || !q.answer) return false;
    const v = parseNumber(r.value);
    if (!Number.isFinite(v)) return false;
    const tol = q.answer.tolerance ?? 0;
    return Math.abs(v - q.answer.value) <= tol + 1e-9;
  }
  if (r.kind !== 'choice') return false;
  const want = new Set(correctIds(q));
  return r.selected.length === want.size && r.selected.every((id) => want.has(id));
}

/** Seconds allowed for `n` items at the exam's official pace. */
export function timeLimitSeconds(n: number, secondsPerItem: number): number {
  return Math.round(n * secondsPerItem);
}
