import { Link } from 'react-router-dom';
import { EXAMS, OBJECTIVE_BY_ID, OBJECTIVES } from '../content';
import { useProgress } from '../lib/progress';
import { pct, rollup, weakSpots } from '../lib/stats';
import { Meter, Stat } from '../components/bits';
import { daysBetween, todayISO } from '../lib/dates';

export function Dashboard() {
  const p = useProgress();
  const all = rollup(OBJECTIVES, p);
  const weak = weakSpots(OBJECTIVES, p).slice(0, 5);
  const lastExport = p.lastExportAt ? daysBetween(p.lastExportAt.slice(0, 10), todayISO()) : null;
  const hasProgress = Object.keys(p.questions).length + Object.keys(p.cards).length > 0;

  return (
    <div className="stack">
      <div className="row">
        <h1 style={{ margin: 0 }}>Dashboard</h1>
        <div className="spacer" />
        <Link className="btn" to="/flashcards">
          Review {all.dueCards} due card{all.dueCards === 1 ? '' : 's'}
        </Link>
        <Link className="btn primary" to="/quiz">
          Start a quiz
        </Link>
      </div>

      {hasProgress && (lastExport === null || lastExport > 7) && (
        <div className="notice warn">
          {lastExport === null ? 'You haven’t exported a backup yet.' : `Last backup was ${lastExport} days ago.`} Progress
          lives only in this browser. <Link to="/settings">Export progress</Link>.
        </div>
      )}

      <div className="card row" style={{ gap: '2rem' }}>
        <Stat value={pct(all.mastery)} label="question mastery (all content)" />
        <Stat value={`${all.seen}/${all.questions}`} label="questions attempted" />
        <Stat value={`${all.learnedCards}/${all.totalCards}`} label="flashcards learned" />
        <Stat value={`${all.notesRead}/${all.withContent}`} label="notes read" />
      </div>

      <div className="grid">
        {EXAMS.map((e) => {
          const objs = e.sections.flatMap((s) => s.objectives);
          const r = rollup(objs, p);
          const weakCount = weakSpots(objs, p).filter((s) => (s.recentAccuracy ?? 1) < 0.7).length;
          return (
            <Link key={e.id} to={`/exam/${e.id}`} className="card link">
              <div className="row" style={{ gap: '0.5rem' }}>
                <span className="pill accent">{e.kind}</span>
                <strong>{e.id}</strong>
                <div className="spacer" />
                {weakCount > 0 && <span className="pill bad">{weakCount} weak</span>}
              </div>
              <h3 style={{ marginTop: '0.5rem' }}>{e.name}</h3>
              {e.status === 'awaiting-source' ? (
                <p className="muted" style={{ fontSize: '0.9rem' }}>
                  Awaiting official source (CSE Handbook / Test Plan).
                </p>
              ) : (
                <>
                  <p className="muted" style={{ fontSize: '0.9rem', marginBottom: '0.6rem' }}>
                    {e.sections.length} sections · {r.objectives} objectives ·{' '}
                    {r.withContent ? `${r.withContent} with content` : 'content not generated yet'}
                  </p>
                  <Meter value={r.mastery} label={`${e.id} mastery`} />
                  <small className="muted">
                    {pct(r.mastery)} mastery · {r.dueCards} cards due
                  </small>
                </>
              )}
            </Link>
          );
        })}
      </div>

      <div className="card">
        <div className="row">
          <h2 style={{ margin: 0 }}>Weak spots</h2>
          <div className="spacer" />
          <Link to="/weak">All weak spots →</Link>
        </div>
        {weak.length === 0 ? (
          <p className="muted" style={{ marginTop: '0.5rem' }}>
            Answer at least 3 questions in an objective to see your accuracy there. The objectives where you score lowest show up here.
          </p>
        ) : (
          <table className="data" style={{ marginTop: '0.5rem' }}>
            <tbody>
              {weak.map((s) => {
                const o = OBJECTIVE_BY_ID.get(s.objectiveId)!;
                return (
                  <tr key={s.objectiveId}>
                    <td style={{ width: '5.5rem' }}>
                      <Link to={`/study/${o.id}`}>
                        {o.examId} {o.number}
                      </Link>
                    </td>
                    <td>{o.title}</td>
                    <td className="num">
                      <span className={`pill ${(s.recentAccuracy ?? 1) < 0.7 ? 'bad' : ''}`}>{pct(s.recentAccuracy)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
