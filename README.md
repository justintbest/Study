# ARE + CSE Study

A personal study app for California architecture licensure:
- **ARE 5.0** (NCARB): PcM, PjM, PA, PPD, PDD, CE
- **CSE** (California Architects Board)

It's a static site: no backend and no account. Progress is saved in your browser, and you can export or import it as JSON.

**Status**
| Exam | Content |
|---|---|
| **PcM** | ✅ 12 objectives: notes, 121 questions, 167 flashcards |
| PjM, PA, PPD, PDD, CE | Official objectives loaded; content comes next, one division at a time |
| CSE | ⏳ Waiting for the CSE Handbook PDF (see `sources/README.md`) |

---

## Run it locally on Windows

You need **Node.js 20.19+ (22 LTS recommended)** and **Git**. In **PowerShell**:

```powershell
winget install OpenJS.NodeJS.LTS
```

```powershell
winget install Git.Git
```

Close and reopen PowerShell so `node` and `git` are on your PATH. Then:

```powershell
git clone https://github.com/justintbest/Study.git
```

```powershell
cd Study
```

```powershell
npm install
```

```powershell
npm run dev
```

Open **http://localhost:5173** in your browser. Press `Ctrl+C` in PowerShell to stop the server.

Other commands:

| Command | What it does |
|---|---|
| `npm run fetch:sources` | Downloads the official PDFs into `sources/`. NCARB's Guidelines PDF isn't committed because the repo is public; you need it only to re-extract objectives |
| `npm run build` | Validates the content, type-checks, and builds the static site into `dist/` |
| `npm run preview` | Serves the built `dist/` at http://localhost:4173 |
| `npm test` | Unit tests (SM-2 scheduling, quiz weighting, grading) |
| `npm run validate` | Checks every file in `/content` (add `-- --strict` to fail on warnings too) |


## Deploy to Vercel
1. Push the repo to GitHub (it's already there).
2. On vercel.com, choose **Add New → Project** and import `justintbest/Study`.
3. Vercel detects **Vite** automatically. `vercel.json` sets the build command to `npm run build` and the output directory to `dist`. Click **Deploy**.
4. Every push to the production branch redeploys. Other branches get preview URLs.

The app uses hash URLs (`/#/study/PcM-2.1`), so deep links work on any static host with no rewrite rules.

## Features
- **Dashboard.** All 7 exams → content areas (sections) → objectives. Each objective shows the official target %, whether you've read the note, your recent accuracy, and a mastery bar. Weak objectives get a red edge.
- **Study mode** (`/study/<objectiveId>`). The official objective description, then four tabs:
  - **Study note**, with "exam trap" and "⚠ verify" callouts
  - **References** (section numbers only)
  - **Practice quiz** with instant feedback and an explanation for every option
  - **Flashcard** preview
- **Quiz mode:**
  - Scope: a division, a section, or all of the ARE.
  - Question selection:
    - **weighted** by the official content-area percentages (each objective's weight is the midpoint of its range);
    - **random**;
    - **review missed** (questions you got wrong the last time you answered them);
    - **unseen only**.
  - **Timed exam simulation:** no feedback until you submit, a question navigator, flag-for-review, and a countdown at the official pace (e.g., PcM: 2 hr 40 min for 65 items). You can choose full length when the bank is big enough.
  - Results show a per-objective breakdown, a review of every missed question, and a one-click "retry missed."
- **Flashcards:**
  - **SM-2** spaced repetition with Again / Hard / Good / Easy ratings. Each button shows the next interval, and "Again" brings the card back later in the same session.
  - A daily new-card limit.
  - A cram mode that doesn't change the schedule.
- **Weak spots.** Objectives ranked by accuracy over your last five answers per question (minimum 3 answers to rank). Anything under 70% is flagged, with one-click drills.
- **Progress & settings:**
  - Export and import progress as JSON (do this regularly; the dashboard nags after 7 days).
  - Theme: system, light or dark.
  - New cards per day.
  - Reset.
- **Confidence flags.** Anything not yet checked against a source carries a **⚠ Verify** badge with a note on what to check. Each objective page lists its flagged items and shows when its facts were last checked. See `content/VERIFICATION.md` for what has been verified against the NCARB Model Rules, the AIA Code of Ethics and federal law, and what's waiting on the AIA contract PDFs.

### Notes on question formats
The October 2026 ARE 5.0 Guidelines list three item types: **multiple choice**, **check-all-that-apply**, and **hotspot**. **Fill-in-the-blank/quantitative is no longer an ARE item type.** The bank still includes a few `numeric` items (finance math, fee splits) as a study aid, labelled "Numeric entry · study aid". Hotspot items need images and aren't included yet. The CSE is multiple choice only.

## How the content is organized
```
sources/                 official documents (see sources/README.md)
  are/ARE-5-Guidelines.pdf
  cse/…                  Practice Act, Coastal Act, CAB reference list (CSE Handbook still needed)
content/
  are-objectives.json    ← generated from the Guidelines PDF: 6 divisions, 23 sections, 91 objectives, weightings
  are-objective-changes.json  April 27, 2026 objective-change annotations (with confidence)
  cse-objectives.json    CSE Test Plan (awaiting Handbook) + CAB reference material list
  schema/                content formats (README + JSON schema)
  are/PcM/PcM-1.1.md     study note
  are/PcM/PcM-1.1.json   references, questions, flashcards
  …
scripts/
  extract_are_objectives.py   PDF → content/are-objectives.json
  validate-content.mjs        content rules (runs before every build)
src/                     the React app (no content lives here)
CLAUDE.md                instructions Claude Code follows in this repo (content rules + study sessions)
PLAN.md                  the original plan and architecture
```

**Rules the validator enforces:**
- every content file maps to a real objective ID;
- 8–12 questions and 10–20 flashcards per objective;
- ARE item formats are correct;
- every option has an explanation;
- IDs are unique;
- **ARE content cites no California code or law.** Title 24, CBC, BPC, CCR, CEQA and the like belong in the CSE content only.

## Adding or regenerating content for a division
The app reads whatever is in `/content`, so adding a division never requires app code changes.

1. **Objectives are already extracted** for all six ARE divisions. To regenerate them from a newer Guidelines PDF:
   - run `npm run fetch:sources -- --force` (or save the new PDF as `sources/are/ARE-5-Guidelines.pdf`);
   - install [Python](https://www.python.org/downloads/) and Poppler (`winget install oschwartz10612.Poppler`, which provides `pdftotext`);
   - run:

   ```powershell
   npm run extract:are
   ```

   The script checks that it found 91 objectives and every weighting. If NCARB changes the page layout, update the page ranges at the top of `scripts/extract_are_objectives.py`.
2. **Generate the study content** with Claude Code from the repo folder:

   ```text
   Generate study content for ARE division PjM following CLAUDE.md, one objective at a time, then run the validator and list the flagged items.
   ```

   This creates `content/are/PjM/PjM-<n.n>.md` and `.json` for each objective.
3. **Validate:**

   ```powershell
   npm run validate -- --strict
   ```

4. **Review** the ⚠ Verify items on each objective page, fix or confirm them, and commit.

To **regenerate a single objective**, delete its `.md` and `.json` and ask Claude Code to "regenerate PcM 2.3". Your progress survives because it's keyed by question and card IDs. Reused IDs keep their history; removed IDs are ignored.

### CSE
1. Save the CSE Handbook as `sources/cse/CSE-Handbook.pdf`. The link is in `sources/README.md`.
2. Ask Claude Code to "extract the CSE Test Plan from the Handbook into content/cse-objectives.json, keeping CAB's numbering". The target shape is in `content/schema/README.md`.
3. Generate `content/cse/CSE-<id>.md` and `.json` files, multiple choice only, based on the Practice Act, Title 16, the Coastal Act and the other free CA statutes in `sources/cse/`.

## Studying inside Claude Code
Open the repo folder in Claude Code. `CLAUDE.md` tells Claude how to run a study session from the `/content` files. Try:

```text
quiz me on PcM objective 2.3
```

```text
give me a 10-question weighted quiz on PcM, one question at a time
```

```text
flashcards for PcM section 3
```

```text
explain PcM 3.2 delivery methods like I'm new to them, then check my understanding
```

```text
here's my exported progress file: C:\Users\me\Downloads\are-study-progress-2026-11-23.json, drill my weakest objectives
```

Claude asks one question at a time, never reveals the answer early, explains why each wrong option is wrong, and keeps score. It can also write new questions grounded in a study note; those are labelled "new: not in the bank", and you can ask it to add good ones to the JSON.

## Backing up progress
Progress lives in your browser's localStorage under `are-study-progress-v1`. It won't follow you to another browser or computer, and clearing site data erases it.

To back up, go to **Progress & settings → Export progress**. To restore on another machine, use **Import progress…**.

## Sources and copyright
- Objective titles, descriptions and weightings are taken from NCARB's *ARE 5.0 Guidelines* (October 2026) for personal study.
- Study notes, questions and flashcards are original. References cite section numbers only. No text from codes, AIA documents or textbooks is copied.
- AIA contract documents are free to ARE candidates through the NCARB Record. Read the real documents.
