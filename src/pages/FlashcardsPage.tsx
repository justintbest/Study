import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CONTENT_BY_OBJECTIVE, EXAMS, OBJECTIVE_BY_ID, objectivesInScope, scopeLabel } from '../content';
import { getProgress, reviewCard, useProgress } from '../lib/progress';
import type { Rating } from '../lib/sm2';
import { review } from '../lib/sm2';
import { todayISO } from '../lib/dates';
import type { Flashcard } from '../types';
import { ConfidenceBadge, Stat } from '../components/bits';
import { shuffle } from '../lib/quiz';

function cardsInScope(scope: string): Flashcard[] {
  return objectivesInScope(scope).flatMap((o) => CONTENT_BY_OBJECTIVE.get(o.id)?.flashcards ?? []);
}

function scopeOptions() {
  const out: { value: string; label: string }[] = [];
  if (cardsInScope('ARE').length) out.push({ value: 'ARE', label: 'All ARE divisions' });
  for (const e of EXAMS) {
    if (!cardsInScope(e.id).length) continue;
    out.push({ value: e.id, label: `${e.id} · ${e.name}` });
    for (const s of e.sections) if (cardsInScope(s.id).length) out.push({ value: s.id, label: `  Section ${s.number}: ${s.name}` });
  }
  return out;
}

const RATINGS: { r: Rating; label: string; hint: string }[] = [
  { r: 'again', label: 'Again', hint: 'forgot' },
  { r: 'hard', label: 'Hard', hint: 'struggled' },
  { r: 'good', label: 'Good', hint: 'recalled' },
  { r: 'easy', label: 'Easy', hint: 'instant' },
];

function intervalLabel(days: number) {
  if (days <= 1) return '1 day';
  if (days < 30) return `${days} days`;
  if (days < 365) return `${Math.round(days / 30)} mo`;
  return `${(days / 365).toFixed(1)} yr`;
}

export function FlashcardsPage() {
  const [params, setParams] = useSearchParams();
  const p = useProgress();
  const options = useMemo(scopeOptions, []);
  const requested = params.get('scope');
  // allow objective-level scope via link from a study page
  const scope =
    requested && (options.some((o) => o.value === requested) || OBJECTIVE_BY_ID.has(requested)) ? requested : (options[0]?.value ?? '');
  const [session, setSession] = useState<{ queue: Flashcard[]; cram: boolean; reviewed: number; again: number } | null>(null);
  const [flipped, setFlipped] = useState(false);

  const today = todayISO();
  const cards = cardsInScope(scope);
  const due = cards.filter((c) => p.cards[c.id] && p.cards[c.id].due <= today).sort((a, b) => p.cards[a.id].due.localeCompare(p.cards[b.id].due));
  const newCards = cards.filter((c) => !p.cards[c.id]);
  const newToday = Object.values(p.cards).filter((c) => c.firstSeen === today).length;
  const newAllowance = Math.max(0, p.settings.newCardsPerDay - newToday);
  const learned = cards.filter((c) => (p.cards[c.id]?.reps ?? 0) > 0).length;

  if (!options.length) return <div className="notice">No flashcards yet. Generate content for a division first.</div>;

  if (session) {
    const card = session.queue[0];
    if (!card) {
      return (
        <div className="reading stack">
          <h1>Session complete</h1>
          <div className="card row" style={{ gap: '2rem' }}>
            <Stat value={session.reviewed} label="reviews" />
            <Stat value={session.again} label="marked Again" />
          </div>
          <div className="row">
            <button className="btn primary" onClick={() => setSession(null)}>
              Back to decks
            </button>
          </div>
        </div>
      );
    }
    const obj = OBJECTIVE_BY_ID.get(card.objectiveId);
    const state = getProgress().cards[card.id];
    const rate = (r: Rating) => {
      if (!session.cram) reviewCard(card.id, card.objectiveId, r);
      const rest = session.queue.slice(1);
      // "Again" → see it once more at the end of this session
      setSession({
        ...session,
        queue: r === 'again' ? [...rest, card] : rest,
        reviewed: session.reviewed + 1,
        again: session.again + (r === 'again' ? 1 : 0),
      });
      setFlipped(false);
    };
    return (
      <div className="reading stack">
        <div className="row">
          <strong>{session.cram ? 'Cram (not scheduled)' : 'Review'}</strong>
          <span className="muted">· {session.queue.length} left</span>
          <div className="spacer" />
          <button className="btn ghost small" onClick={() => setSession(null)}>
            End
          </button>
        </div>
        <div
          className="card flashcard"
          onClick={() => setFlipped(true)}
          onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && setFlipped(true)}
          role="button"
          tabIndex={0}
          aria-label={flipped ? 'Card back shown' : 'Show answer'}
        >
          <div>
            <div className="row" style={{ justifyContent: 'center', marginBottom: '0.75rem', gap: '0.4rem' }}>
              {obj && (
                <Link to={`/study/${obj.id}`} className="pill accent" onClick={(e) => e.stopPropagation()}>
                  {obj.examId} {obj.number}
                </Link>
              )}
              <ConfidenceBadge confidence={card.confidence} note={card.confidenceNote} />
            </div>
            <div>{card.front}</div>
            {flipped ? <div className="back">{card.back}</div> : <small className="muted">Click or press Space to reveal</small>}
          </div>
        </div>
        {flipped && (
          <div className="ratings">
            {RATINGS.map(({ r, label, hint }) => (
              <button key={r} className={`btn${r === 'good' ? ' primary' : ''}`} onClick={() => rate(r)}>
                {label}
                <small>{session.cram ? hint : `${hint} · ${intervalLabel(review(state, r, today).interval)}`}</small>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="reading stack">
      <h1>Flashcards</h1>
      <div className="card stack">
        <label className="field">
          Deck
          <select value={scope} onChange={(e) => setParams({ scope: e.target.value })}>
            {!options.some((o) => o.value === scope) && <option value={scope}>{scopeLabel(scope)}</option>}
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <div className="row" style={{ gap: '2rem' }}>
          <Stat value={due.length} label="due now" />
          <Stat value={Math.min(newCards.length, newAllowance)} label={`new today (limit ${p.settings.newCardsPerDay}/day)`} />
          <Stat value={`${learned}/${cards.length}`} label="learned" />
        </div>
        <div className="row">
          <button
            className="btn"
            onClick={() => {
              setFlipped(false);
              setSession({ queue: shuffle(cards), cram: true, reviewed: 0, again: 0 });
            }}
          >
            Cram all {cards.length} (doesn’t change schedule)
          </button>
          <div className="spacer" />
          <button
            className="btn primary"
            disabled={due.length + Math.min(newCards.length, newAllowance) === 0}
            onClick={() => {
              setFlipped(false);
              setSession({ queue: [...due, ...newCards.slice(0, newAllowance)], cram: false, reviewed: 0, again: 0 });
            }}
          >
            Start review ({due.length + Math.min(newCards.length, newAllowance)})
          </button>
        </div>
        {due.length + Math.min(newCards.length, newAllowance) === 0 && (
          <div className="notice">Nothing due in this deck right now. Come back tomorrow, or cram.</div>
        )}
      </div>
      <p className="muted" style={{ fontSize: '0.9rem' }}>
        Scheduling uses SM-2. Each rating sets the next interval (shown on the button), and “Again” brings the card back later in the
        same session.
      </p>
    </div>
  );
}
