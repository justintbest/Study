import { describe, expect, it } from 'vitest';
import { allocate, buildQuiz, grade } from './quiz';
import type { ObjectiveMeta, Question } from '../types';

const obj = (id: string, weight: number): ObjectiveMeta => ({ id, number: id, title: id, description: '', weight, examId: 'X', sectionId: 'S' });
const qs = (oid: string, n: number): Question[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `${oid}-q${i}`,
    type: 'mc',
    stem: 's',
    explanation: 'e',
    objectiveId: oid,
    options: [
      { id: 'a', text: 'a', correct: true, explanation: 'x' },
      { id: 'b', text: 'b', explanation: 'x' },
      { id: 'c', text: 'c', explanation: 'x' },
    ],
  }));

describe('allocate', () => {
  it('splits proportionally and sums to n', () => {
    const out = allocate(20, [13, 7], [100, 100]);
    expect(out.reduce((a, b) => a + b)).toBe(20);
    expect(out[0]).toBe(13);
  });
  it('respects caps and redistributes', () => {
    const out = allocate(10, [9, 1], [3, 10]);
    expect(out).toEqual([3, 7]);
  });
  it('never exceeds total supply', () => {
    expect(allocate(50, [1, 1], [2, 3])).toEqual([2, 3]);
  });
});

describe('buildQuiz', () => {
  const objectives = [obj('A', 13), obj('B', 3)];
  const map = new Map([
    ['A', qs('A', 10)],
    ['B', qs('B', 10)],
  ]);
  it('weighted mode follows weights', () => {
    const q = buildQuiz({ objectives, questionsByObjective: map, count: 16, mode: 'weighted', lastResult: () => undefined });
    expect(q.filter((x) => x.objectiveId === 'A').length).toBe(10); // capped at supply
    expect(q.length).toBe(16);
  });
  it('missed mode only returns last-wrong questions', () => {
    const q = buildQuiz({ objectives, questionsByObjective: map, count: 99, mode: 'missed', lastResult: (id) => (id === 'B-q2' ? false : true) });
    expect(q.map((x) => x.id)).toEqual(['B-q2']);
  });
});

describe('grade', () => {
  it('cata is all-or-nothing', () => {
    const q: Question = {
      id: 'q',
      type: 'cata',
      selectCount: 2,
      stem: '',
      explanation: '',
      objectiveId: 'A',
      options: ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => ({ id, text: id, explanation: 'x', correct: id === 'a' || id === 'c' })),
    };
    expect(grade(q, { kind: 'choice', selected: ['c', 'a'] })).toBe(true);
    expect(grade(q, { kind: 'choice', selected: ['a'] })).toBe(false);
    expect(grade(q, { kind: 'choice', selected: ['a', 'b'] })).toBe(false);
  });
  it('numeric accepts tolerance and strips formatting', () => {
    const q: Question = { id: 'n', type: 'numeric', stem: '', explanation: '', objectiveId: 'A', answer: { value: 1250000, tolerance: 1 } };
    expect(grade(q, { kind: 'numeric', value: '$1,250,000' })).toBe(true);
    expect(grade(q, { kind: 'numeric', value: '1,250,002' })).toBe(false);
  });
});
