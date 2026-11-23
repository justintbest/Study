import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CHANGES_BY_OBJECTIVE, CONTENT_BY_OBJECTIVE, EXAM_BY_ID, OBJECTIVE_BY_ID, SECTION_BY_ID } from '../content';
import { markNoteRead, useProgress } from '../lib/progress';
import { objectiveStats, pct } from '../lib/stats';
import { Markdown } from '../components/Markdown';
import { ConfidenceBadge, PercentRangeLabel } from '../components/bits';
import { QuizRunner } from '../components/QuizRunner';
import { shuffle } from '../lib/quiz';
import type { Question } from '../types';

type Tab = 'note' | 'refs' | 'quiz' | 'cards';

export function StudyPage() {
  const { objectiveId = '' } = useParams();
  // key → fresh tab/quiz state when moving between objectives
  return <StudyObjective key={objectiveId} objectiveId={objectiveId} />;
}

function StudyObjective({ objectiveId }: { objectiveId: string }) {
  const o = OBJECTIVE_BY_ID.get(objectiveId);
  const content = CONTENT_BY_OBJECTIVE.get(objectiveId);
  const p = useProgress();
  const [tab, setTab] = useState<Tab>('note');
  const [quizKey, setQuizKey] = useState(0);
  const [quizQs, setQuizQs] = useState<Question[] | null>(null);
  const defaultQs = useMemo(() => shuffle(content?.questions ?? []), [content, quizKey]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!o) return <div className="notice">Unknown objective “{objectiveId}”.</div>;
  const exam = EXAM_BY_ID.get(o.examId)!;
  const section = SECTION_BY_ID.get(o.sectionId)!;
  const st = objectiveStats(o, p);
  const change = CHANGES_BY_OBJECTIVE.get(o.id);

  // prev / next objective within the exam
  const flat = exam.sections.flatMap((s) => s.objectives);
  const idx = flat.findIndex((x) => x.id === o.id);
  const prev = flat[idx - 1];
  const next = flat[idx + 1];

  const flagged = content
    ? [
        ...content.references.filter((r) => r.confidence && r.confidence !== 'high').map((r) => `Reference: ${r.citation}`),
        ...content.questions.filter((q) => q.confidence && q.confidence !== 'high').map((q) => `Question ${q.id.split('-').pop()}`),
        ...content.flashcards.filter((c) => c.confidence && c.confidence !== 'high').map((c) => `Card ${c.id.split('-').pop()}`),
      ]
    : [];

  return (
    <div className="stack">
      <div className="crumbs">
        <Link to="/">Dashboard</Link> / <Link to={`/exam/${exam.id}`}>{exam.id}</Link> / Section {section.number}: {section.name}
      </div>

      <div>
        <div className="row" style={{ gap: '0.5rem', marginBottom: '0.4rem' }}>
          <span className="pill accent">
            {exam.id} {o.number}
          </span>
          {o.cognitiveLevel && <span className="pill">{o.cognitiveLevel === 'U/A' ? 'Understand/Apply' : 'Analyze/Evaluate'}</span>}
          <PercentRangeLabel p={o.targetPercent} />
          {change && (
            <span className="pill warn" title={`${change.summary} (${change.evidence})`}>
              Changed Apr 2026 · verify
            </span>
          )}
        </div>
        <h1>{o.title}</h1>
        <p className="muted reading" style={{ fontSize: '0.95rem' }}>
          <strong>Official objective description:</strong> {o.description}
        </p>
        {change && (
          <div className="notice warn reading" style={{ fontSize: '0.9rem' }}>
            <strong>April 2026 update:</strong> {change.summary} <em>Source: {change.evidence}</em>
          </div>
        )}
      </div>

      {!content ? (
        <div className="notice">
          No study content has been generated for this objective yet. See the README for how to add a division.
        </div>
      ) : (
        <>
          <div className="row">
            <span className="muted" style={{ fontSize: '0.9rem' }}>
              {st.seenQuestions}/{st.totalQuestions} questions tried · recent accuracy {pct(st.recentAccuracy)} ·{' '}
              {st.learnedCards}/{st.totalCards} cards learned
            </span>
            <div className="spacer" />
            <label className="row" style={{ gap: '0.4rem', fontSize: '0.9rem' }}>
              <input type="checkbox" checked={st.noteRead} onChange={(e) => markNoteRead(o.id, e.target.checked)} />
              Note read
            </label>
          </div>

          {flagged.length > 0 && (
            <details className="notice warn" style={{ fontSize: '0.9rem' }}>
              <summary>
                <strong>{flagged.length} item(s) flagged for verification</strong>: check these against current sources.
              </summary>
              <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.2rem' }}>
                {flagged.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </details>
          )}

          <div className="tabs" role="tablist">
            {(
              [
                ['note', 'Study note'],
                ['refs', `References (${content.references.length})`],
                ['quiz', `Practice quiz (${content.questions.length})`],
                ['cards', `Flashcards (${content.flashcards.length})`],
              ] as [Tab, string][]
            ).map(([k, label]) => (
              <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
                {label}
              </button>
            ))}
          </div>

          {tab === 'note' && (
            <div className="reading">
              {content.note ? <Markdown>{content.note}</Markdown> : <div className="notice">No note file for this objective.</div>}
              <div className="row" style={{ marginTop: '2rem' }}>
                <button
                  className="btn primary"
                  onClick={() => {
                    markNoteRead(o.id);
                    setTab('quiz');
                  }}
                >
                  Done reading → quiz me on {o.number}
                </button>
              </div>
            </div>
          )}

          {tab === 'refs' && (
            <div className="reading stack">
              <p className="muted" style={{ fontSize: '0.9rem' }}>
                Section numbers only. Read the actual text in the source document (AIA contracts are free to ARE candidates through
                the NCARB Record).
              </p>
              <div className="ref-list">
                {content.references.map((r, k) => (
                  <div className="ref" key={k}>
                    <div>
                      <div className="kind">{r.kind}</div>
                      <strong>{r.citation}</strong>
                    </div>
                    <div>
                      {r.topic} <ConfidenceBadge confidence={r.confidence} note={r.confidenceNote} />
                      {r.confidenceNote && r.confidence !== 'high' && (
                        <div>
                          <small className="muted">{r.confidenceNote}</small>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'quiz' && (
            <div className="reading">
              <QuizRunner
                key={quizKey}
                questions={quizQs ?? defaultQs}
                mode="practice"
                scope={o.id}
                sessionMode="study"
                onExit={() => {
                  setQuizQs(null);
                  setQuizKey((k) => k + 1);
                }}
                onRetry={(missed) => {
                  setQuizQs(shuffle(missed));
                  setQuizKey((k) => k + 1);
                }}
              />
            </div>
          )}

          {tab === 'cards' && (
            <div className="reading stack">
              <div className="row">
                <span className="muted">Browse the cards here. Review them with spaced repetition on the Flashcards page.</span>
                <div className="spacer" />
                <Link className="btn primary" to={`/flashcards?scope=${o.id}`}>
                  Review with spaced repetition
                </Link>
              </div>
              {content.flashcards.map((c) => (
                <details key={c.id} className="card">
                  <summary style={{ cursor: 'pointer' }}>
                    {c.front} <ConfidenceBadge confidence={c.confidence} note={c.confidenceNote} />
                  </summary>
                  <div style={{ marginTop: '0.6rem', fontFamily: 'var(--font-read)' }}>{c.back}</div>
                </details>
              ))}
            </div>
          )}
        </>
      )}

      <div className="row" style={{ marginTop: '2rem' }}>
        {prev && (
          <Link className="btn ghost" to={`/study/${prev.id}`}>
            ← {prev.number} {prev.title.length > 40 ? prev.title.slice(0, 40) + '…' : prev.title}
          </Link>
        )}
        <div className="spacer" />
        {next && (
          <Link className="btn ghost" to={`/study/${next.id}`}>
            {next.number} {next.title.length > 40 ? next.title.slice(0, 40) + '…' : next.title} →
          </Link>
        )}
      </div>
    </div>
  );
}
