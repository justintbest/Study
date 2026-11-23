# Plan: ARE 5.0 + CSE study app

## Goals
- A personal, static (no backend) study app for the six ARE 5.0 divisions and California's CSE.
- Every piece of study content maps to an official objective ID (ARE) or task/knowledge statement ID (CSE).
- Content lives in `/content` as JSON and Markdown. Adding a division means adding files, not changing app code.
- Keep the ARE (national: IBC, ADA, AIA, NCARB) and the CSE (California: Title 24/CBC, BPC, CCR) separate.

## Sources of truth (status)
| Source | Where | Status |
|---|---|---|
| ARE 5.0 Guidelines, October 2026 edition (effective 2026-10-01, includes the April 27, 2026 objective updates) | `sources/are/ARE-5-Guidelines.pdf` | ✅ downloaded and extracted to `content/are-objectives.json` (6 divisions, 23 sections, 91 objectives) |
| Which 12 objectives changed in April 2026 | `content/are-objective-changes.json` | ⚠️ not listed in the Guidelines. Two identified from third-party reports (PcM 3.3, PPD 5.2), both unverified |
| CSE Handbook (holds the CSE Test Plan) | PSI-hosted link on cab.ca.gov | ❌ **blocked**, needs you to supply the PDF |
| CSE Reference Material list | `sources/cse/cab-cse-reference-material.*` | ✅ downloaded and transcribed into `content/cse-objectives.json` |
| Architects Practice Act (BPC 5500 et seq.) + CCR Title 16, Div. 2 (CAB 2026 publication) | `sources/cse/architects-practice-act.pdf` | ✅ |
| California Coastal Act (PRC Div. 20) | `sources/cse/coastal-act.pdf` | ✅ |
| Other CA statutes (HSC, EDC, CIV, PCC on leginfo) | n/a | ❌ site sits behind a bot-check. Needed only when CSE content is built |

## Architecture
- **Vite + React + TypeScript**, built to `dist/`. It deploys to Vercel as a static site (the framework preset is detected automatically; `vercel.json` included).
- **Routing:** `HashRouter`, so deep links work on any static host with no rewrite rules.
- **Content loading:** `import.meta.glob('/content/**/*.json')` and `'/content/**/*.md?raw'` are bundled at build time. When you add files, the app picks them up with no code change.
- **State:** a single progress object in `localStorage` (`are-study-progress-v1`) with JSON export/import. It stores no content, only IDs, so content can be regenerated without losing progress.
- **Markdown:** `react-markdown` + `remark-gfm` (no raw HTML). A `> [!VERIFY]` blockquote renders as a yellow "verify this" callout.
- **Validation:** `npm run validate` (also runs before `build`) checks that:
  - every content file maps to a real objective ID;
  - question and flashcard counts are within 8–12 and 10–20;
  - every multiple-choice question has exactly one correct answer;
  - every check-all-that-apply question's "select N" matches its number of correct answers;
  - every wrong option has an explanation;
  - IDs are unique;
  - **ARE files cite no California codes or statutes** (CBC, Title 24, BPC, CCR…).

## Content model
```
content/
  are-objectives.json            ← generated from the Guidelines PDF (scripts/extract_are_objectives.py)
  are-objective-changes.json     ← April 2026 change annotations (with confidence)
  cse-objectives.json            ← CSE Test Plan (awaiting Handbook) + CAB reference list
  schema/objective-content.schema.json
  are/
    PcM/
      PcM-1.1.md                 ← study note (Markdown)
      PcM-1.1.json               ← references, questions, flashcards, confidence flags
      …one .md + .json pair per objective
    PjM/ PA/ PPD/ PDD/ CE/       ← added one division at a time after review
  cse/                           ← same pattern, keyed by CAB task/knowledge IDs, added last
```
Per-objective JSON (`objectiveId` must exist in the objectives file):
```jsonc
{
  "objectiveId": "PcM-2.1", "exam": "ARE", "division": "PcM",
  "references": [{ "kind": "AIA", "citation": "B101-2017 §11.10.2", "topic": "…", "confidence": "medium", "confidenceNote": "…" }],
  "questions": [
    { "id": "PcM-2.1-q01", "type": "mc" | "cata" | "numeric", "stem": "…",
      "options": [{ "id": "a", "text": "…", "correct": true, "explanation": "why right / why wrong" }],
      "selectCount": 2,                       // cata only
      "answer": { "value": 2.5, "tolerance": 0.01, "unit": "" },  // numeric only
      "explanation": "…", "confidence": "high" | "medium" | "low", "confidenceNote": "…" }
  ],
  "flashcards": [{ "id": "PcM-2.1-f01", "front": "…", "back": "…", "confidence": "high" }]
}
```
Question formats follow the October 2026 Guidelines, which list **multiple choice, check-all-that-apply, and hotspot** as the only ARE item types. Fill-in-the-blank is not a current ARE format. The `numeric` type is kept as a math study aid and labelled as such in the app. Hotspot items need images and are left out for now.

## App features → where they live
| Feature | Route / module |
|---|---|
| Dashboard: 7 exams → content areas → objectives, progress per objective | `/` → `/exam/:examId` (`Dashboard.tsx`, `ExamPage.tsx`) |
| Study mode: read the note, then quiz on that objective | `/study/:objectiveId` (`StudyPage.tsx`) |
| Quiz: random or weighted by official %, timed exam simulation, review missed | `/quiz` (`QuizSetup.tsx`, `QuizRunner.tsx`, `lib/quiz.ts`) |
| Flashcards with SM-2 spaced repetition | `/flashcards` (`Flashcards.tsx`, `lib/sm2.ts`) |
| Weak spots: lowest-accuracy objectives highlighted | `/weak` + badges on the dashboard (`lib/stats.ts`) |
| localStorage + export/import JSON | `/settings` (`lib/progress.ts`) |
| Dark mode | CSS variables; follows the system setting, with a manual toggle |

**Weighting:** each objective's weight is the midpoint of its official target % range (for example, PcM 2.1 at 11–15% weighs 13). A weighted quiz draws questions from each objective in proportion to that weight. **Timed simulation:** the time per item is taken from the division's official ratio (for example, PcM: 2 hr 40 min for 65 items), scaled to the length you choose.

**SM-2:** the ratings Again / Hard / Good / Easy map to quality scores 1 / 3 / 4 / 5. The ease factor starts at 2.5 with a floor of 1.3. Intervals run 1 day, then 6 days, then interval × ease. "Again" resets the repetition count.

## Workflow
1. ✅ Plan + file structure (this file).
2. App shell + PcM content (12 objectives).
3. **Stop for your review.**
4. Then PjM → PA → PPD → PDD → CE, one at a time.
5. CSE last, once the Handbook PDF is in `sources/cse/`.
6. README: run locally on Windows, regenerate content, study inside Claude Code.
