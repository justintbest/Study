import { Link, useParams } from 'react-router-dom';
import { caseStudiesInScope, CHANGES_BY_OBJECTIVE, EXAM_BY_ID, OBJECTIVE_BY_ID } from '../content';
import { useProgress } from '../lib/progress';
import { isWeak, objectiveStats, pct, rollup } from '../lib/stats';
import { Meter, PercentRangeLabel, Stat } from '../components/bits';

export function ExamPage() {
  const { examId = '' } = useParams();
  const exam = EXAM_BY_ID.get(examId);
  const p = useProgress();
  if (!exam) return <div className="notice">Unknown exam “{examId}”.</div>;
  const objs = exam.sections.flatMap((s) => s.objectives);
  const r = rollup(objs, p);
  const d = exam.details;

  return (
    <div className="stack">
      <div className="crumbs">
        <Link to="/">Dashboard</Link> / {exam.id}
      </div>
      <div className="row">
        <h1 style={{ margin: 0 }}>
          {exam.id} · {exam.name}
        </h1>
        <div className="spacer" />
        {exam.status === 'ready' && r.withContent > 0 && (
          <>
            <Link className="btn" to={`/flashcards?scope=${exam.id}`}>
              Flashcards
            </Link>
            <Link className="btn primary" to={`/quiz?scope=${exam.id}`}>
              Quiz {exam.id}
            </Link>
          </>
        )}
      </div>

      {exam.status === 'awaiting-source' && (
        <div className="notice warn">
          <strong>Official source missing.</strong> {exam.statusNote}
        </div>
      )}

      {exam.overview && <p className="reading">{exam.overview}</p>}

      {d && (
        <div className="card row" style={{ gap: '2rem' }}>
          <Stat value={d.totalItems ?? '–'} label={`items (${d.scoredItems} scored, ${d.pretestItems} pretest)`} />
          <Stat value={d.testDuration ?? '–'} label="test time" />
          <Stat value={d.caseStudies ?? '–'} label={`case studies (${d.caseStudyItems} items)`} />
          <Stat value={pct(r.mastery)} label="your mastery" />
          <Stat value={`${r.withContent}/${r.objectives}`} label="objectives with content" />
        </div>
      )}

      {caseStudiesInScope(exam.id).length > 0 && (
        <section className="section-block">
          <div className="section-head">
            <h2 style={{ margin: 0 }}>Case studies</h2>
            <span className="muted">
              {d?.caseStudies} on the exam, {d?.caseStudyItems} questions · resources stay open beside each question
            </span>
          </div>
          <div className="obj-list">
            {caseStudiesInScope(exam.id).map((cs) => {
              const answered = cs.questions.filter((q) => p.questions[q.id]);
              const right = answered.filter((q) => p.questions[q.id].recent.endsWith('1')).length;
              return (
                <Link key={cs.id} to={`/case/${cs.id}`} className="obj-row case-row">
                  <span className="obj-num">CS{cs.id.split('-CS')[1]}</span>
                  <span>
                    <span className="obj-title">{cs.title}</span>{' '}
                    <span className="muted" style={{ fontSize: '0.85rem' }}>
                      · {cs.resources.map((r) => r.kind).join(', ')} · objectives{' '}
                      {[...new Set(cs.questions.map((q) => OBJECTIVE_BY_ID.get(q.objectiveId)?.number))].join(', ')}
                    </span>
                  </span>
                  <span className="obj-metrics">
                    <span className="muted" style={{ fontSize: '0.8rem' }}>
                      {answered.length ? `${right}/${cs.questions.length} last try` : `${cs.questions.length} questions`}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {exam.sections.map((s) => (
        <section key={s.id} className="section-block">
          <div className="section-head">
            <h2 style={{ margin: 0 }}>
              {exam.kind === 'ARE' ? `Section ${s.number}` : `Area ${s.number}`}: {s.name}
            </h2>
            <PercentRangeLabel p={s.targetPercent} />
            {s.expectedItems && <span className="muted">{s.expectedItems} items</span>}
            <div className="spacer" />
            {rollup(s.objectives, p).withContent > 0 && (
              <Link to={`/quiz?scope=${s.id}`} className="btn small">
                Quiz section
              </Link>
            )}
          </div>
          {s.intro && <p className="muted reading" style={{ fontSize: '0.95rem' }}>{s.intro}</p>}
          <div className="obj-list">
            {s.objectives.map((o) => {
              const st = objectiveStats(o, p);
              const weak = isWeak(st);
              const change = CHANGES_BY_OBJECTIVE.get(o.id);
              return (
                <Link key={o.id} to={`/study/${o.id}`} className={`obj-row${weak ? ' weak' : ''}`}>
                  <span className="obj-num">{o.number}</span>
                  <span>
                    <span className="obj-title">{o.title}</span>{' '}
                    <span className="muted" style={{ fontSize: '0.85rem' }}>
                      {o.cognitiveLevel && `(${o.cognitiveLevel})`}
                    </span>
                    {change && (
                      <>
                        {' '}
                        <span className="pill warn" title={change.summary}>
                          Changed Apr 2026
                        </span>
                      </>
                    )}
                  </span>
                  <span className="obj-metrics">
                    <PercentRangeLabel p={o.targetPercent} />
                    {!st.hasContent ? (
                      <span className="pill">no content yet</span>
                    ) : (
                      <>
                        {st.noteRead && <span className="pill good">note ✓</span>}
                        {st.attempts > 0 && (
                          <span className={`pill ${weak ? 'bad' : ''}`} title="Accuracy over your recent answers">
                            {pct(st.recentAccuracy)}
                          </span>
                        )}
                        <span className="muted" style={{ fontSize: '0.8rem' }}>
                          {st.seenQuestions}/{st.totalQuestions} Q
                        </span>
                        <Meter value={st.mastery} bad={weak} label="mastery" />
                      </>
                    )}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
