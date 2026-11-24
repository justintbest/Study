import { NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { getStorageError, updateSettings, useProgress } from './lib/progress';
import { resolveTheme, useApplyTheme } from './lib/theme';
import { Dashboard } from './pages/Dashboard';
import { ExamPage } from './pages/ExamPage';
import { StudyPage } from './pages/StudyPage';
import { QuizPage } from './pages/QuizPage';
import { FlashcardsPage } from './pages/FlashcardsPage';
import { WeakSpotsPage } from './pages/WeakSpotsPage';
import { SettingsPage } from './pages/SettingsPage';
import { CaseStudyPage } from './pages/CaseStudyPage';

export default function App() {
  const progress = useProgress();
  useApplyTheme(progress.settings.theme);
  const { pathname } = useLocation();
  useEffect(() => {
    // braces matter: newer browsers return a Promise from scrollTo, which must not be an effect's return value
    window.scrollTo(0, 0);
  }, [pathname]);
  const storageError = getStorageError();
  const dark = resolveTheme(progress.settings.theme) === 'dark';

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <NavLink to="/" className="brand">
            ARE<span>+</span>CSE Study
          </NavLink>
          <nav className="nav" aria-label="Main">
            <NavLink to="/" end>
              Dashboard
            </NavLink>
            <NavLink to="/quiz">Quiz</NavLink>
            <NavLink to="/flashcards">Flashcards</NavLink>
            <NavLink to="/weak">Weak spots</NavLink>
            <NavLink to="/settings">Progress &amp; settings</NavLink>
          </nav>
          <button
            className="btn ghost small"
            onClick={() => updateSettings({ theme: dark ? 'light' : 'dark' })}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={dark ? 'Light mode' : 'Dark mode'}
          >
            {dark ? '☀︎' : '☾'}
          </button>
        </div>
      </header>
      <main className="main">
        {storageError && <div className="notice bad" style={{ marginBottom: '1rem' }}>{storageError}</div>}
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/exam/:examId" element={<ExamPage />} />
          <Route path="/study/:objectiveId" element={<StudyPage />} />
          <Route path="/case/:caseId" element={<CaseStudyPage />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/flashcards" element={<FlashcardsPage />} />
          <Route path="/weak" element={<WeakSpotsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<div className="notice">Page not found.</div>} />
        </Routes>
      </main>
    </>
  );
}
