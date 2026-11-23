import { useRef, useState } from 'react';
import {
  exportProgress,
  parseProgress,
  replaceProgress,
  resetProgress,
  STORAGE_KEY,
  updateSettings,
  useProgress,
} from '../lib/progress';
import type { ThemePref } from '../lib/progress';

export function SettingsPage() {
  const p = useProgress();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'bad'; text: string } | null>(null);

  function doExport() {
    const { filename, json } = exportProgress();
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMsg({ kind: 'ok', text: `Exported ${filename}.` });
  }

  async function doImport(file: File) {
    try {
      const next = parseProgress(JSON.parse(await file.text()));
      const n = Object.keys(next.questions).length;
      const c = Object.keys(next.cards).length;
      if (!confirm(`Replace your current progress with this file (${n} questions answered, ${c} cards scheduled)?`)) return;
      replaceProgress(next);
      setMsg({ kind: 'ok', text: `Imported ${file.name}.` });
    } catch (e) {
      setMsg({ kind: 'bad', text: `Import failed: ${(e as Error).message}` });
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  const answered = Object.keys(p.questions).length;
  const scheduled = Object.keys(p.cards).length;

  return (
    <div className="reading stack">
      <h1>Progress &amp; settings</h1>

      <div className="card stack">
        <h2>Backup</h2>
        <p className="muted" style={{ fontSize: '0.95rem' }}>
          Progress is saved in this browser’s localStorage (key <code>{STORAGE_KEY}</code>). Export a JSON backup regularly. Clearing
          browser data or switching browsers or computers loses anything you haven’t exported.
        </p>
        <p style={{ fontSize: '0.95rem' }}>
          {answered} questions answered · {scheduled} cards scheduled · {Object.keys(p.notesRead).length} notes read ·{' '}
          {p.sessions.length} sessions
          <br />
          <span className="muted">
            Last saved {new Date(p.updatedAt).toLocaleString()}
            {p.lastExportAt ? ` · last export ${new Date(p.lastExportAt).toLocaleString()}` : ' · never exported'}
          </span>
        </p>
        <div className="row">
          <button className="btn primary" onClick={doExport}>
            Export progress (.json)
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            Import progress…
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => e.target.files?.[0] && doImport(e.target.files[0])}
          />
        </div>
        {msg && <div className={`notice ${msg.kind === 'bad' ? 'bad' : ''}`}>{msg.text}</div>}
      </div>

      <div className="card stack">
        <h2>Preferences</h2>
        <div className="field">
          Theme
          <div className="segmented">
            {(['system', 'light', 'dark'] as ThemePref[]).map((t) => (
              <button key={t} className={p.settings.theme === t ? 'on' : ''} onClick={() => updateSettings({ theme: t })}>
                {t[0].toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <label className="field">
          New flashcards per day
          <input
            type="number"
            min={0}
            max={500}
            value={p.settings.newCardsPerDay}
            onChange={(e) => updateSettings({ newCardsPerDay: Math.max(0, Number(e.target.value) || 0) })}
            style={{ width: '7rem' }}
          />
        </label>
      </div>

      <div className="card stack">
        <h2>Reset</h2>
        <p className="muted" style={{ fontSize: '0.95rem' }}>Deletes all answers, card schedules and notes-read marks from this browser.</p>
        <div>
          <button
            className="btn danger"
            onClick={() => {
              if (confirm('Delete all progress in this browser? Export first if you might want it back.')) resetProgress();
            }}
          >
            Reset all progress
          </button>
        </div>
      </div>
    </div>
  );
}
