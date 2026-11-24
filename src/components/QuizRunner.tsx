import { useEffect, useMemo, useRef, useState } from 'react';
import type { Question } from '../types';
import type { Response } from '../lib/quiz';
import { grade, isAnswered, shuffle } from '../lib/quiz';
import { recordAnswer, recordSession } from '../lib/progress';
import { QuestionView } from './QuestionView';
import { CASE_BY_ID, OBJECTIVE_BY_ID } from '../content';
import { CaseStudyPanel } from './CaseStudyPanel';
import { formatDuration } from '../lib/dates';
import { Link } from 'react-router-dom';
import { pct } from '../lib/stats';

export interface QuizRunnerProps {
  questions: Question[];
  mode: 'practice' | 'exam';
  /** Exam mode only: auto-submits at zero. */
  timeLimitSec?: number;
  scope: string;
  sessionMode?: 'practice' | 'exam' | 'study';
  onExit?: () => void;
  onRetry?: (questions: Question[]) => void;
}

export function QuizRunner(props: QuizRunnerProps) {
  const { questions, mode } = props;
  const orders = useMemo(
    () => Object.fromEntries(questions.map((q) => [q.id, q.options ? shuffle(q.options.map((o) => o.id)) : []])),
    [questions],
  );
  const [i, setI] = useState(0);
  const [responses, setResponses] = useState<Record<string, Response>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [done, setDone] = useState(false);
  const started = useRef(Date.now());
  const [now, setNow] = useState(Date.now());

  const timed = mode === 'exam' && !!props.timeLimitSec;
  const remaining = timed ? props.timeLimitSec! - (now - started.current) / 1000 : 0;

  useEffect(() => {
    if (!timed || done) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [timed, done]);

  useEffect(() => {
    if (timed && !done && remaining <= 0) finishExam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, timed, done]);

  const q = questions[i];
  if (!questions.length) return <div className="notice">No questions match this selection.</div>;

  function setResp(r: Response) {
    setResponses((prev) => ({ ...prev, [q.id]: r }));
  }

  function checkPractice() {
    if (revealed[q.id]) return;
    recordAnswer(q.id, q.objectiveId, grade(q, responses[q.id]));
    setRevealed((p) => ({ ...p, [q.id]: true }));
  }

  function finishPractice() {
    const answered = questions.filter((x) => revealed[x.id]);
    recordSession({
      at: new Date().toISOString(),
      mode: props.sessionMode ?? 'practice',
      scope: props.scope,
      total: answered.length,
      correct: answered.filter((x) => grade(x, responses[x.id])).length,
      seconds: Math.round((Date.now() - started.current) / 1000),
    });
    setDone(true);
  }

  function finishExam() {
    if (done) return;
    for (const x of questions) recordAnswer(x.id, x.objectiveId, grade(x, responses[x.id]));
    recordSession({
      at: new Date().toISOString(),
      mode: 'exam',
      scope: props.scope,
      total: questions.length,
      correct: questions.filter((x) => grade(x, responses[x.id])).length,
      seconds: Math.round((Date.now() - started.current) / 1000),
    });
    setDone(true);
  }

  if (done) {
    const graded = mode === 'exam' ? questions : questions.filter((x) => revealed[x.id]);
    return (
      <QuizResults
        questions={graded}
        responses={responses}
        orders={orders}
        seconds={(Date.now() - started.current) / 1000}
        onExit={props.onExit}
        onRetry={props.onRetry}
      />
    );
  }

  const answeredCount = questions.filter((x) => isAnswered(x, responses[x.id])).length;
  const isRevealed = mode === 'practice' && !!revealed[q.id];

  return (
    <div className="stack">
      <div className="row">
        <strong>
          Question {i + 1} of {questions.length}
        </strong>
        <span className="muted">· {answeredCount} answered</span>
        <div className="spacer" />
        {timed && (
          <span className={`timer${remaining < 300 ? ' low' : ''}`} aria-live="polite">
            ⏱ {formatDuration(remaining)}
          </span>
        )}
      </div>

      {mode === 'exam' && (
        <div className="navgrid" aria-label="Question navigator">
          {questions.map((x, k) => (
            <button
              key={x.id}
              className={[k === i ? 'current' : '', isAnswered(x, responses[x.id]) ? 'answered' : '', flagged[x.id] ? 'flagged' : '', x.caseStudyId ? 'case' : ''].join(' ')}
              title={x.caseStudyId ? 'Case study question' : undefined}
              onClick={() => setI(k)}
              aria-label={`Question ${k + 1}${flagged[x.id] ? ' (flagged)' : ''}`}
            >
              {k + 1}
            </button>
          ))}
        </div>
      )}

      {(() => {
        const cs = q.caseStudyId ? CASE_BY_ID.get(q.caseStudyId) : undefined;
        const card = (
          <div className="card">
            {cs && (
              <div className="muted" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                Case study: question {cs.questions.findIndex((x) => x.id === q.id) + 1} of {cs.questions.length}
              </div>
            )}
            <QuestionView
              key={q.id}
              question={q}
              response={responses[q.id]}
              onChange={setResp}
              revealed={isRevealed}
              optionOrder={orders[q.id]}
              showObjective={isRevealed}
            />
          </div>
        );
        return cs ? (
          <div className="case-layout">
            <CaseStudyPanel key={cs.id} cs={cs} />
            {card}
          </div>
        ) : (
          card
        );
      })()}

      <div className="row">
        <button className="btn" onClick={() => setI(Math.max(0, i - 1))} disabled={i === 0}>
          ← Back
        </button>
        {mode === 'exam' && (
          <button className="btn ghost" onClick={() => setFlagged((f) => ({ ...f, [q.id]: !f[q.id] }))}>
            {flagged[q.id] ? '★ Flagged' : '☆ Flag for review'}
          </button>
        )}
        <div className="spacer" />
        {mode === 'practice' && !isRevealed && (
          <button className="btn primary" onClick={checkPractice} disabled={!isAnswered(q, responses[q.id])}>
            Check answer
          </button>
        )}
        {mode === 'practice' && isRevealed && i < questions.length - 1 && (
          <button className="btn primary" onClick={() => setI(i + 1)}>
            Next →
          </button>
        )}
        {mode === 'practice' && (isRevealed && i === questions.length - 1 ? (
          <button className="btn primary" onClick={finishPractice}>
            See results
          </button>
        ) : (
          <button className="btn ghost" onClick={finishPractice}>
            End session
          </button>
        ))}
        {mode === 'exam' && i < questions.length - 1 && (
          <button className="btn" onClick={() => setI(i + 1)}>
            Next →
          </button>
        )}
        {mode === 'exam' && (
          <button
            className="btn primary"
            onClick={() => {
              const unanswered = questions.length - answeredCount;
              const flags = Object.values(flagged).filter(Boolean).length;
              const msg = [
                unanswered ? `${unanswered} question(s) unanswered.` : '',
                flags ? `${flags} flagged.` : '',
                'Submit the exam?',
              ]
                .filter(Boolean)
                .join(' ');
              if (confirm(msg)) finishExam();
            }}
          >
            Submit exam
          </button>
        )}
      </div>
    </div>
  );
}

function QuizResults({
  questions,
  responses,
  orders,
  seconds,
  onExit,
  onRetry,
}: {
  questions: Question[];
  responses: Record<string, Response>;
  orders: Record<string, string[]>;
  seconds: number;
  onExit?: () => void;
  onRetry?: (q: Question[]) => void;
}) {
  const [onlyMissed, setOnlyMissed] = useState(true);
  const results = questions.map((q) => ({ q, ok: grade(q, responses[q.id]) }));
  const correct = results.filter((r) => r.ok).length;
  const missed = results.filter((r) => !r.ok).map((r) => r.q);

  const byObj = new Map<string, { n: number; ok: number }>();
  for (const r of results) {
    const e = byObj.get(r.q.objectiveId) ?? { n: 0, ok: 0 };
    e.n++;
    if (r.ok) e.ok++;
    byObj.set(r.q.objectiveId, e);
  }
  const rows = [...byObj.entries()].sort((a, b) => a[1].ok / a[1].n - b[1].ok / b[1].n);

  return (
    <div className="stack">
      <div className="card row" style={{ gap: '2rem' }}>
        <div className="stat">
          <b>{questions.length ? pct(correct / questions.length) : '–'}</b>
          <small>
            {correct} of {questions.length} correct
          </small>
        </div>
        <div className="stat">
          <b>{formatDuration(seconds)}</b>
          <small>time used</small>
        </div>
        <div className="spacer" />
        {missed.length > 0 && onRetry && (
          <button className="btn primary" onClick={() => onRetry(missed)}>
            Retry {missed.length} missed
          </button>
        )}
        {onExit && (
          <button className="btn" onClick={onExit}>
            Done
          </button>
        )}
      </div>

      {rows.length > 1 && (
        <div className="card table-wrap">
          <h3>By objective</h3>
          <table className="data">
            <thead>
              <tr>
                <th>Objective</th>
                <th className="num">Score</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([id, e]) => {
                const o = OBJECTIVE_BY_ID.get(id);
                return (
                  <tr key={id}>
                    <td>
                      <Link to={`/study/${id}`}>
                        {o?.examId} {o?.number}
                      </Link>{' '}
                      {o?.title}
                    </td>
                    <td className="num">
                      {e.ok}/{e.n}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="row">
        <h2 style={{ margin: 0 }}>Review</h2>
        <div className="spacer" />
        <div className="segmented">
          <button className={onlyMissed ? 'on' : ''} onClick={() => setOnlyMissed(true)}>
            Missed ({missed.length})
          </button>
          <button className={!onlyMissed ? 'on' : ''} onClick={() => setOnlyMissed(false)}>
            All ({questions.length})
          </button>
        </div>
      </div>
      {(onlyMissed ? results.filter((r) => !r.ok) : results).map(({ q }) => (
        <div className="card" key={q.id}>
          <QuestionView question={q} response={responses[q.id]} revealed optionOrder={orders[q.id]} showObjective />
        </div>
      ))}
      {onlyMissed && missed.length === 0 && <div className="notice">Nothing missed. 🎉</div>}
    </div>
  );
}
