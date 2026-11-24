import { useState } from 'react';
import type { Question } from '../types';
import { Link, useParams } from 'react-router-dom';
import { CASE_BY_ID, EXAM_BY_ID, OBJECTIVE_BY_ID } from '../content';
import { QuizRunner } from '../components/QuizRunner';
import { useProgress } from '../lib/progress';
import { pct } from '../lib/stats';

export function CaseStudyPage() {
  const { caseId = '' } = useParams();
  const cs = CASE_BY_ID.get(caseId);
  const p = useProgress();
  const [run, setRun] = useState(0);
  const [subset, setSubset] = useState<Question[] | null>(null);
  if (!cs) return <div className="notice">Unknown case study “{caseId}”.</div>;
  const exam = EXAM_BY_ID.get(cs.division);
  const objIds = [...new Set(cs.questions.map((q) => q.objectiveId))];
  const answered = cs.questions.filter((q) => p.questions[q.id]);
  const lastRight = answered.filter((q) => p.questions[q.id].recent.endsWith('1')).length;

  return (
    <div className="stack">
      <div className="crumbs">
        <Link to="/">Dashboard</Link> / <Link to={`/exam/${cs.division}`}>{cs.division}</Link> / Case study
      </div>
      <div className="row">
        <h1 style={{ margin: 0 }}>{cs.title}</h1>
        <div className="spacer" />
        {answered.length > 0 && (
          <span className="muted">
            Last attempt: {lastRight}/{cs.questions.length} ({pct(lastRight / cs.questions.length)})
          </span>
        )}
      </div>
      <p className="muted reading" style={{ fontSize: '0.92rem' }}>
        {exam?.name} case study · {cs.questions.length} questions · resources: {cs.resources.map((r) => r.title).join(', ')}. The
        scenario and resources stay open beside every question, as on the ARE. Objectives tested:{' '}
        {objIds.map((id, k) => (
          <span key={id}>
            {k > 0 && ', '}
            <Link to={`/study/${id}`}>{OBJECTIVE_BY_ID.get(id)?.number}</Link>
          </span>
        ))}
        .
      </p>
      <QuizRunner
        key={run}
        questions={subset ?? cs.questions}
        mode="practice"
        scope={cs.id}
        onExit={() => {
          setSubset(null);
          setRun((r) => r + 1);
        }}
        onRetry={(missed) => {
          setSubset(missed);
          setRun((r) => r + 1);
        }}
      />
    </div>
  );
}
