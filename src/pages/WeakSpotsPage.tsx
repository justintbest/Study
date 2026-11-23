import { Link, useNavigate } from 'react-router-dom';
import { OBJECTIVE_BY_ID, OBJECTIVES } from '../content';
import { useProgress } from '../lib/progress';
import { isWeak, objectiveStats, pct, WEAK_MIN_ATTEMPTS, WEAK_THRESHOLD, weakSpots } from '../lib/stats';
import { Meter } from '../components/bits';

export function WeakSpotsPage() {
  const p = useProgress();
  const nav = useNavigate();
  const ranked = weakSpots(OBJECTIVES, p);
  const untested = OBJECTIVES.map((o) => objectiveStats(o, p)).filter((s) => s.hasContent && s.attempts < WEAK_MIN_ATTEMPTS);

  return (
    <div className="stack">
      <h1>Weak spots</h1>
      <p className="muted reading">
        Objectives are ranked by accuracy over your last five answers to each question. An objective needs at least {WEAK_MIN_ATTEMPTS}{' '}
        answers to be ranked. Anything under {Math.round(WEAK_THRESHOLD * 100)}% is marked weak.
      </p>

      {ranked.length === 0 ? (
        <div className="notice">No data yet. Take a quiz and your weakest objectives will show up here.</div>
      ) : (
        <div className="card table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Objective</th>
                <th className="num">Accuracy</th>
                <th className="num">Answers</th>
                <th>Mastery</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((s) => {
                const o = OBJECTIVE_BY_ID.get(s.objectiveId)!;
                const weak = isWeak(s);
                return (
                  <tr key={o.id}>
                    <td>
                      <Link to={`/study/${o.id}`}>
                        <strong>
                          {o.examId} {o.number}
                        </strong>
                      </Link>{' '}
                      {o.title}
                    </td>
                    <td className="num">
                      <span className={`pill ${weak ? 'bad' : 'good'}`}>{pct(s.recentAccuracy)}</span>
                    </td>
                    <td className="num">{s.attempts}</td>
                    <td style={{ minWidth: 90 }}>
                      <Meter value={s.mastery} bad={weak} label="mastery" />
                    </td>
                    <td>
                      <button className="btn small" onClick={() => nav(`/quiz?scope=${o.id}`)}>
                        Drill
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {untested.length > 0 && (
        <div className="card">
          <h3>Not enough data yet ({untested.length})</h3>
          <p className="muted" style={{ fontSize: '0.9rem' }}>
            These objectives have content but fewer than {WEAK_MIN_ATTEMPTS} answers.
          </p>
          <div className="row" style={{ gap: '0.4rem' }}>
            {untested.map((s) => {
              const o = OBJECTIVE_BY_ID.get(s.objectiveId)!;
              return (
                <Link key={o.id} to={`/study/${o.id}`} className="pill" title={o.title}>
                  {o.examId} {o.number}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
