import { describe, expect, it } from 'vitest';
import { review, MIN_EF } from './sm2';

describe('SM-2', () => {
  const day = '2026-11-23';
  it('schedules 1 → 6 → interval×EF on successive good reviews', () => {
    const a = review(undefined, 'good', day);
    expect(a.interval).toBe(1);
    expect(a.due).toBe('2026-11-24');
    const b = review(a, 'good', a.due);
    expect(b.interval).toBe(6);
    const c = review(b, 'good', b.due);
    expect(c.interval).toBe(Math.round(6 * b.ef));
    expect(c.reps).toBe(3);
  });
  it('resets on again and counts a lapse; EF never drops below 1.3', () => {
    let s = review(undefined, 'good', day);
    s = review(s, 'good', day);
    for (let i = 0; i < 10; i++) s = review(s, 'again', day);
    expect(s.reps).toBe(0);
    expect(s.interval).toBe(1);
    expect(s.lapses).toBe(10);
    expect(s.ef).toBeGreaterThanOrEqual(MIN_EF);
  });
  it('easy grows faster than good', () => {
    let g = review(undefined, 'good', day);
    g = review(g, 'good', day);
    const e = review(g, 'easy', day);
    const gg = review(g, 'good', day);
    expect(e.interval).toBeGreaterThan(gg.interval);
  });
});
