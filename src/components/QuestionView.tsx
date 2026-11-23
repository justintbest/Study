import type { Question } from '../types';
import type { Response } from '../lib/quiz';
import { grade } from '../lib/quiz';
import { ConfidenceBadge } from './bits';
import { OBJECTIVE_BY_ID } from '../content';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const LETTERS = 'ABCDEFGH';

export function typeLabel(q: Question): string {
  if (q.type === 'mc') return 'Multiple choice';
  if (q.type === 'cata') return `Check ${numberWord(q.selectCount ?? 0)} that apply`;
  return 'Numeric entry · study aid';
}
function numberWord(n: number) {
  return ['zero', 'one', 'two', 'three', 'four', 'five', 'six'][n] ?? String(n);
}

interface Props {
  question: Question;
  response?: Response;
  onChange?: (r: Response) => void;
  revealed: boolean;
  optionOrder?: string[];
  showObjective?: boolean;
}

export function QuestionView({ question: q, response, onChange, revealed, optionOrder, showObjective }: Props) {
  const obj = OBJECTIVE_BY_ID.get(q.objectiveId);
  const selected = response?.kind === 'choice' ? response.selected : [];
  const options = optionOrder
    ? optionOrder.map((id) => q.options!.find((o) => o.id === id)!).filter(Boolean)
    : (q.options ?? []);
  const isRight = revealed ? grade(q, response) : false;
  const limit = q.type === 'cata' ? (q.selectCount ?? 0) : 1;

  function toggle(id: string) {
    if (revealed || !onChange) return;
    if (q.type === 'mc') return onChange({ kind: 'choice', selected: [id] });
    const has = selected.includes(id);
    if (has) onChange({ kind: 'choice', selected: selected.filter((s) => s !== id) });
    else if (selected.length < limit) onChange({ kind: 'choice', selected: [...selected, id] });
  }

  return (
    <div className="question">
      <div className="q-meta">
        {showObjective && obj && (
          <Link to={`/study/${obj.id}`} className="pill accent">
            {obj.examId} {obj.number}
          </Link>
        )}
        <span className="pill">{typeLabel(q)}</span>
        {q.cognitiveLevel && <span className="pill">{q.cognitiveLevel}</span>}
        <ConfidenceBadge confidence={q.confidence} note={q.confidenceNote} />
      </div>
      <div className="q-stem">
        {/* Stems are Markdown so they can carry small exhibits (tables). */}
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {q.type === 'cata' ? `${q.stem} **Check the ${numberWord(q.selectCount ?? 0)} that apply.**` : q.stem}
        </ReactMarkdown>
      </div>

      {q.type !== 'numeric' && (
        <div className="options" role={q.type === 'mc' ? 'radiogroup' : 'group'}>
          {options.map((op, i) => {
            const isSel = selected.includes(op.id);
            const cls = [
              'option',
              revealed ? 'revealed' : '',
              !revealed && isSel ? 'selected' : '',
              revealed && op.correct ? 'right' : '',
              revealed && isSel && !op.correct ? 'wrong' : '',
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <label key={op.id} className={cls}>
                <input
                  type={q.type === 'mc' ? 'radio' : 'checkbox'}
                  name={q.id}
                  checked={isSel}
                  disabled={revealed}
                  onChange={() => toggle(op.id)}
                />
                <span>
                  <strong>{LETTERS[i]}.</strong> {op.text}
                  {revealed && (
                    <div className="why">
                      {op.correct ? '✓ ' : isSel ? '✗ ' : ''}
                      {op.explanation}
                    </div>
                  )}
                </span>
              </label>
            );
          })}
        </div>
      )}

      {q.type === 'numeric' && (
        <div className="stack">
          <div className="numeric-input">
            <input
              type="text"
              inputMode="decimal"
              aria-label="Your answer"
              placeholder="Enter a number"
              value={response?.kind === 'numeric' ? response.value : ''}
              disabled={revealed}
              onChange={(e) => onChange?.({ kind: 'numeric', value: e.target.value })}
            />
            {q.answer?.unit && <span className="muted">{q.answer.unit}</span>}
          </div>
          <small className="muted">
            The ARE asks for numbers as multiple choice. Typing the answer here is a math drill, not an ARE item type.
          </small>
        </div>
      )}

      {revealed && (
        <div className={`feedback ${isRight ? 'right' : 'wrong'}`}>
          <strong>{isRight ? 'Correct.' : response ? 'Incorrect.' : 'Not answered.'}</strong>{' '}
          {q.type === 'numeric' && q.answer && (
            <span>
              Answer: <strong>{q.answer.value.toLocaleString()}</strong> {q.answer.unit}
              {q.answer.tolerance ? ` (±${q.answer.tolerance})` : ''}.{' '}
            </span>
          )}
          {q.explanation.includes('\n') ? <div style={{ marginTop: '0.35rem' }}>{q.explanation}</div> : q.explanation}
          {q.confidenceNote && (
            <div style={{ marginTop: '0.5rem' }}>
              <small>⚠ {q.confidenceNote}</small>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
