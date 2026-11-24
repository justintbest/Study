# Content formats

## Official objectives (generated, don't hand-edit)
- `content/are-objectives.json` is produced by `scripts/extract_are_objectives.py` from `sources/are/ARE-5-Guidelines.pdf`. It contains 6 divisions → sections (with target %) → objectives (ID, title, cognitive level, target %, official description).
- `content/are-objective-changes.json` holds annotations about the April 27, 2026 objective updates, each with a confidence level.
- `content/cse-objectives.json` holds CAB's CSE Test Plan. It is **awaiting the CSE Handbook**. When filled in, it should use this shape, keeping CAB's original numbering:

```jsonc
{
  "exam": "CSE",
  "status": "ready",
  "examFormat": { "itemType": "multiple-choice", "itemCount": 0, "timeMinutes": 0 },   // from the Handbook
  "contentAreas": [
    {
      "id": "1", "number": "1", "name": "<CAB content area name>",
      "weightPercent": 0,                      // or "targetPercent": { "min": 0, "max": 0 }
      "description": "<optional>",
      "statements": [
        { "id": "T1", "kind": "task", "text": "<verbatim task statement>" },
        { "id": "K1", "kind": "knowledge", "text": "<verbatim knowledge statement>" }
      ]
    }
  ],
  "referenceMaterial": { ... }                 // already filled in from cab.ca.gov
}
```
Each statement becomes a study "objective" with ID `CSE-<statement id>` (e.g. `CSE-K12`). If CAB's IDs repeat across content areas, prefix them with the area (e.g. `2-K12`) so they stay unique.

## Study content (one pair per objective)
```
content/are/<DIV>/<objectiveId>.md     study note (Markdown)
content/are/<DIV>/<objectiveId>.json   references, questions, flashcards
content/cse/<objectiveId>.md|.json     same pattern for CSE
```
- JSON shape: `objective-content.schema.json` in this folder.
- Callouts in notes: start a blockquote with `[!VERIFY]` (yellow "verify" box) or `[!TRAP]` (red "exam trap" box).
- Confidence: set `"confidence": "medium"` or `"low"` plus a `"confidenceNote"` on any reference, question or flashcard you aren't sure is current or accurate. It shows a ⚠ Verify badge in the app.
- `npm run validate` enforces the rules: real objective IDs, counts, ARE item formats, explanations for every option, unique IDs, and **no California code or law in ARE content**.

## Case studies
```
content/are/<DIV>/case-studies/<DIV>-CS<n>.json
```
```jsonc
{
  "id": "PcM-CS1", "exam": "ARE", "division": "PcM",
  "title": "…",
  "scenario": "markdown: the situation, firm or project facts",
  "resources": [                          // 1–3, like the ARE
    { "id": "r1", "title": "Firm Financial Statements", "kind": "Firm Financial Statements", "body": "markdown (tables)" }
  ],
  "questions": [                          // 3–8; same rules as standalone questions
    { "id": "PcM-CS1-q01", "objectiveId": "PcM-2.1", "type": "mc", "stem": "Refer to … ", "options": [ … ], "explanation": "…" }
  ]
}
```
- Every question names its official `objectiveId`, and case-study results count toward that objective's stats and weak spots.
- Answers must come from the scenario and resources: integrate two or more facts, don't recall one.
- Resource `kind` should match the ARE Guidelines' "Common Case Study Resources" list for the division. For PcM: AIA Contracts, Firm Financial Statements, Requests for Proposals, Staff Labor and Utilization Rates, Staff Resumes.
- Never paste AIA contract text. Summarize the terms of a fictional agreement in your own words.
