# ARE + CSE study repo: instructions for Claude Code

This repo is a personal study app (Vite + React + TS) for NCARB's ARE 5.0 and California's CSE. All study content is in `/content`. The official source documents are in `/sources`.

## Hard rules for content
1. **Never invent objectives.** ARE objective IDs come only from `content/are-objectives.json`, which is generated from `sources/are/ARE-5-Guidelines.pdf`. CSE IDs come only from `content/cse-objectives.json`, which must be extracted from the CAB CSE Handbook using CAB's original numbering. If a source is missing, stop and tell the user.
2. **Keep the ARE and the CSE separate.** ARE content uses the national model codes and federal standards: IBC 2021, ICC A117.1-2017, 2010 ADA Standards, AIA documents, NCARB rules, federal law. It must never cite California codes or law (CBC/Title 24, BPC, CCR, CEQA, DSA, Field Act, Coastal Act…). `npm run validate` fails if it does. California material belongs in `content/cse/` only.
3. **Write in your own words.** Cite section numbers only. Never paste copyrighted text from codes, AIA documents or books.
4. **Flag uncertainty.** Set `"confidence": "medium"` or `"low"` plus a `"confidenceNote"` on anything that may be outdated or that you aren't sure of, such as paragraph numbers, thresholds or edition years. In notes, use `> [!VERIFY] …`.
5. **Match the formats.** The ARE (Oct 2026 Guidelines) uses multiple choice (3–4 options, 1 correct), check-all-that-apply (6 options, 2–4 correct, "Check the N that apply") and hotspot. `numeric` items are a math study aid only. The CSE is multiple choice only. Every option needs an explanation of why it is right or wrong. Each objective gets 8–12 questions and 10–20 flashcards.
6. After any content change, run `npm run validate` (and `npm run build` before committing).

Format details: `content/schema/README.md` and `content/schema/objective-content.schema.json`.

## Generating a division
Do one division at a time and stop for the user's review afterward.
1. Read that division's objectives in `content/are-objectives.json`: title, cognitive level, target %, official description.
2. For each objective, write `content/are/<DIV>/<DIV>-<n.n>.md` (the study note: key concepts, definitions, rules of thumb, exam traps, verify callouts) and `.json` (references, questions, flashcards). Follow the existing PcM files as the style reference.
3. Check facts against `/sources` before flagging them:
   - `sources/are/ethics/` for the NCARB Model Rules and the AIA Code;
   - `sources/are/law/` for federal statutes and regulations; fetch more from govinfo.gov or ecfr.gov if needed;
   - `sources/are/aia/` for AIA contracts, if the user has added them.

   Set `"verified": "<date>"` on objectives you checked, and record what you checked in `content/VERIFICATION.md`. Run `npm run fetch:sources` first if the PDFs are missing.
4. Run `npm run validate -- --strict`, fix everything, then summarize the flagged items for the user.

## Study sessions in Claude Code
When the user asks to be quizzed or to study (e.g. "quiz me on PcM objective 2.3", "flashcards for PcM section 3", "10-question weighted PcM quiz", "explain PcM 3.2"):
- Resolve the objective(s) from `content/are-objectives.json` and read `content/are/<DIV>/<ID>.json` and `.md`. Section scope covers all objectives in that section. Division scope covers all of them.
- **Quiz:**
  - Ask **one question at a time**, using the bank's questions. Shuffle the order, and relabel options A–D (or A–F) in a shuffled order.
  - Don't reveal the answer or hint at it.
  - For check-all-that-apply items, state "Check the N that apply."
  - After the user answers, say right or wrong, give the correct answer, and explain why each wrong option is wrong, using the stored explanations.
  - Keep a running score. At the end, list the missed questions and the objectives to review.
- **Weighted quiz:** pick questions per objective in proportion to the midpoint of each objective's `targetPercent`.
- **Flashcards:** show the front, wait for the user, then show the back. Ask the user to rate it Again, Hard, Good or Easy. Progress is not saved; mention that the app's Flashcards page does SM-2 scheduling.
- **New questions:** if the user wants questions beyond the bank, write them from the study note and the official objective description. Label them "(new: not in the bank)" and offer to add good ones to the JSON. Validate after adding.
- **Weak spots:** the app's progress lives in browser localStorage, which isn't readable from here. If the user exports progress (Progress & settings → Export) and gives you the file path, read it. `questions[<id>].recent` holds the last five results as "1"/"0" and `.obj` is the objective ID. Rank objectives by accuracy and drill the weakest.
- **Explain:** summarize the note in plain language, then offer a quick check question.
