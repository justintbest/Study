import { useState } from 'react';
import type { CaseStudy } from '../types';
import { Markdown } from './Markdown';

/** Scenario + resource tabs, shown beside every question of a case study (like the ARE's resource tabs). */
export function CaseStudyPanel({ cs, compact }: { cs: CaseStudy; compact?: boolean }) {
  const tabs = [{ id: 'scenario', title: 'Scenario', kind: 'Case study', body: cs.scenario }, ...cs.resources];
  const [tab, setTab] = useState('scenario');
  const current = tabs.find((t) => t.id === tab) ?? tabs[0];
  return (
    <aside className={`case-panel card${compact ? ' compact' : ''}`} aria-label={`Case study: ${cs.title}`}>
      <div className="case-title">
        <span className="pill accent">Case study</span> <strong>{cs.title}</strong>
      </div>
      <div className="tabs case-tabs" role="tablist">
        {tabs.map((t) => (
          <button key={t.id} role="tab" aria-selected={t.id === current.id} className={t.id === current.id ? 'on' : ''} onClick={() => setTab(t.id)}>
            {t.title}
          </button>
        ))}
      </div>
      {current.id !== 'scenario' && <div className="muted case-kind">{current.kind}</div>}
      <div className="case-body">
        <Markdown>{current.body}</Markdown>
      </div>
    </aside>
  );
}
