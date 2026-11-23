import { addDays } from './dates';

/** Per-card scheduling state (SuperMemo-2). */
export interface CardState {
  ef: number; // ease factor, >= 1.3
  interval: number; // days
  reps: number; // consecutive successful reviews
  lapses: number;
  due: string; // YYYY-MM-DD
  lastReview: string; // YYYY-MM-DD
}

export type Rating = 'again' | 'hard' | 'good' | 'easy';

/** Map the four buttons to SM-2 quality scores (0–5). */
export const RATING_QUALITY: Record<Rating, number> = { again: 1, hard: 3, good: 4, easy: 5 };

export const MIN_EF = 1.3;
export const START_EF = 2.5;

/**
 * Classic SM-2:
 *  - quality < 3 → repetition resets, interval 1 day, lapse counted
 *  - 1st success → 1 day, 2nd → 6 days, then interval × EF
 *  - EF' = EF + (0.1 − (5−q)(0.08 + (5−q)·0.02)), floored at 1.3
 * Small tweak: "easy" on a mature card gets a 1.3× bonus, "hard" grows the interval by only 1.2×.
 */
export function review(prev: CardState | undefined, rating: Rating, today: string): CardState {
  const q = RATING_QUALITY[rating];
  const ef0 = prev?.ef ?? START_EF;
  let reps = prev?.reps ?? 0;
  let interval = prev?.interval ?? 0;
  let lapses = prev?.lapses ?? 0;

  if (q < 3) {
    reps = 0;
    interval = 1;
    lapses += prev ? 1 : 0;
  } else {
    if (reps === 0) interval = 1;
    else if (reps === 1) interval = 6;
    else if (rating === 'hard') interval = Math.max(interval + 1, Math.round(interval * 1.2));
    else interval = Math.round(interval * ef0 * (rating === 'easy' ? 1.3 : 1));
    reps += 1;
  }

  const ef = Math.max(MIN_EF, ef0 + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
  return { ef: Math.round(ef * 1000) / 1000, interval, reps, lapses, due: addDays(today, interval), lastReview: today };
}

export function isDue(state: CardState | undefined, today: string): boolean {
  return !!state && state.due <= today;
}
