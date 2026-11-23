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
