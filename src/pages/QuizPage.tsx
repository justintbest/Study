import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CONTENT_BY_OBJECTIVE, EXAM_BY_ID, EXAMS, objectivesInScope, scopeLabel } from '../content';
import { getProgress, useProgress } from '../lib/progress';
import type { QuizMode } from '../lib/quiz';
import { buildQuiz, shuffle, timeLimitSeconds } from '../lib/quiz';
import { QuizRunner } from '../components/QuizRunner';
import { formatDuration } from '../lib/dates';
import type { Question } from '../types';

const MODE_LABELS: Record<QuizMode, string> = {
  weighted: 'Weighted by official %',
  random: 'Random',
  missed: 'Review missed',
  unseen: 'Unseen only',
};

/** Scopes that have at least one question. */
function scopeOptions() {
  const out: { value: string; label: string; group: string }[] = [];
  const has = (scope: string) => objectivesInScope(scope).some((o) => CONTENT_BY_OBJECTIVE.has(o.id));
  if (has('ARE')) out.push({ value: 'ARE', label: 'All ARE divisions (mixed)', group: 'Mixed' });
  for (const e of EXAMS) {
    if (!has(e.id)) continue;
    out.push({ value: e.id, label: `${e.id} · ${e.name}`, group: e.id });
    for (const s of e.sections) if (has(s.id)) out.push({ value: s.id, label: `  Section ${s.number}: ${s.name}`, group: e.id });
  }
  return out;
}

export function QuizPage() {
  const [params, setParams] = useSearchParams();
  useProgress(); // re-render on progress changes (missed/unseen counts)
  const options = useMemo(scopeOptions, []);
  const requested = params.get('scope');
  const scope = options.some((o) => o.value === requested) ? requested! : (options[0]?.value ?? '');
  const [mode, setMode] = useState<QuizMode>((params.get('mode') as QuizMode) || 'weighted');
  const [format, setFormat] = useState<'practice' | 'exam'>('practice');
  const [count, setCount] = useState(20);
  const [session, setSession] = useState<{ questions: Question[]; format: 'practice' | 'exam'; timeLimit?: number; key: number } | null>(null);

  const objectives = objectivesInScope(scope);
  const qByObj = new Map(objectives.map((o) => [o.id, CONTENT_BY_OBJECTIVE.get(o.id)?.questions ?? []]));
  const last = (id: string) => {
    const r = getProgress().questions[id];
    return r ? r.recent.endsWith('1') : undefined;
  };
  const available = buildQuiz({ objectives, questionsByObjective: qByObj, count: Infinity, mode, lastResult: last }).length;
  const n = Math.max(1, Math.min(count, available));

  // official pacing: an exam's own rate, or the average across ARE divisions for mixed scopes
  const examId = objectives[0]?.examId;
  const singleExam = objectives.every((o) => o.examId === examId) ? EXAM_BY_ID.get(examId!) : undefined;
  const areExams = EXAMS.filter((e) => e.kind === 'ARE');
  const secPerItem = singleExam?.secondsPerItem ?? areExams.reduce((s, e) => s + e.secondsPerItem, 0) / areExams.length;
  const fullLength = singleExam?.details?.totalItems;

  function start(questions?: Question[]) {
    const qs =
      questions ?? buildQuiz({ objectives, questionsByObjective: qByObj, count: n, mode, lastResult: last });
    setSession({
      questions: qs,
      format,
      timeLimit: format === 'exam' ? timeLimitSeconds(qs.length, secPerItem) : undefined,
      key: Date.now(),
    });
  }

  if (session) {
    return (
      <div className="reading stack" style={{ maxWidth: 820 }}>
        <div className="row">
          <h1 style={{ margin: 0 }}>{session.format === 'exam' ? 'Exam simulation' : 'Practice quiz'}</h1>
          <div className="spacer" />
          <span className="muted">{scopeLabel(scope)}</span>
        </div>
        <QuizRunner
          key={session.key}
          questions={session.questions}
          mode={session.format}
          timeLimitSec={session.timeLimit}
          scope={scope}
          onExit={() => setSession(null)}
          onRetry={(missed) => setSession({ ...session, questions: shuffle(missed), key: Date.now(), timeLimit: session.format === 'exam' ? timeLimitSeconds(missed.length, secPerItem) : undefined })}
        />
      </div>
    );
  }

  if (!options.length) {
    return <div className="notice">No questions yet. Generate content for a division first (see README).</div>;
  }

  return (
    <div className="reading stack">
      <h1>Quiz</h1>
      <div className="card stack">
        <label className="field">
          Scope
          <select value={scope} onChange={(e) => setParams({ scope: e.target.value })}>
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <div className="field">
          Question selection
          <div className="segmented">
            {(Object.keys(MODE_LABELS) as QuizMode[]).map((m) => (
              <button key={m} className={mode === m ? 'on' : ''} onClick={() => setMode(m)}>
                {MODE_LABELS[m]}
              </button>
            ))}
          </div>
          <small>
            {mode === 'weighted' && 'Questions per objective follow the midpoints of the official content-area percentages.'}
            {mode === 'random' && 'Uniformly random from everything in scope.'}
            {mode === 'missed' && 'Only questions you got wrong the last time you answered them.'}
            {mode === 'unseen' && 'Only questions you have never answered.'}
          </small>
        </div>

        <div className="field">
          Format
          <div className="segmented">
            <button className={format === 'practice' ? 'on' : ''} onClick={() => setFormat('practice')}>
              Practice (instant feedback)
            </button>
            <button className={format === 'exam' ? 'on' : ''} onClick={() => setFormat('exam')}>
              Timed exam simulation
            </button>
          </div>
          {format === 'exam' && (
            <small>
              No feedback until you submit. Time is based on the official pace
              {singleExam?.details?.testDuration
                ? ` (${singleExam.details.testDuration} for ${singleExam.details.totalItems} items)`
                : ''}
              : {formatDuration(timeLimitSeconds(n, secPerItem))} for {n} question{n === 1 ? '' : 's'}.
            </small>
          )}
        </div>

        <div className="row" style={{ alignItems: 'end' }}>
          <label className="field">
            Number of questions
            <input
              type="number"
              min={1}
              max={Math.max(1, available)}
              value={count}
              onChange={(e) => setCount(Math.max(1, Number(e.target.value) || 1))}
              style={{ width: '7rem' }}
            />
          </label>
          {fullLength && available >= fullLength && (
            <button className="btn small" onClick={() => { setCount(fullLength); setFormat('exam'); setMode('weighted'); }}>
              Full length ({fullLength})
            </button>
          )}
          <span className="muted" style={{ fontSize: '0.9rem' }}>
            {available} available in this scope
          </span>
        </div>

        <div className="row">
          <div className="spacer" />
          <button className="btn primary" onClick={() => start()} disabled={available === 0}>
            Start {format === 'exam' ? 'exam' : 'quiz'} ({n})
          </button>
        </div>
        {available === 0 && mode === 'missed' && <div className="notice">No missed questions in this scope. Nice.</div>}
      </div>
    </div>
  );
}
