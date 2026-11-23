import type { Confidence } from '../types';

export function ConfidenceBadge({ confidence, note }: { confidence?: Confidence; note?: string }) {
  if (!confidence || confidence === 'high') return null;
  return (
    <span className="pill warn" title={note ?? 'Verify this against the current source before relying on it.'}>
      ⚠ Verify{confidence === 'low' ? ' (low confidence)' : ''}
    </span>
  );
}

export function Meter({ value, bad, label }: { value: number; bad?: boolean; label?: string }) {
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className={`meter${bad ? ' bad' : ''}`} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(v * 100)} aria-label={label}>
      <span style={{ width: `${v * 100}%` }} />
    </div>
  );
}

export function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="stat">
      <b>{value}</b>
      <small>{label}</small>
    </div>
  );
}

export function PercentRangeLabel({ p }: { p?: { min: number; max: number } }) {
  if (!p) return null;
  return <span className="pill">{p.min === p.max ? `${p.min}%` : `${p.min}–${p.max}%`}</span>;
}
