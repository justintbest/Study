# Question-writing style (match NCARB)

Model every question on the sample items in the ARE 5.0 Guidelines (October 2026, pp. 57–61) and on NCARB's practice exams. The goal: a candidate who doesn't know the material **can't** pick the answer by spotting a silly option or a giveaway in the wording.

## What NCARB's items look like
- **Mold item (CATA).** A short, factual scenario with a telling detail ("seven months after substantial completion"), then: *"In which of the following ways should the architect address this issue? Check the two that apply."* All six options are short, parallel actions an architect might plausibly take:
  - "Submit an additional service request to the owner."
  - "Advise the owner to notify the original contractor…"
  - "Specify a new fan for the owner to purchase…"

  The wrong ones are wrong because of **who** should act, **when**, or **whether it's the architect's role**, never because they're absurd.
- **Footing item (MC).** Four numeric options. The wrong ones are what you'd get from **common calculation mistakes**.
- **Case-study item.** The answer requires pulling facts from the scenario and its resources (program, zoning, financials), then doing a step of reasoning.

## Calibrated against NCARB's official practice exam
NCARB publishes PDF practice exams for supervisors (`sources/are/practice-exams/`, fetched locally). **Their license allows study use only and forbids derivative works, so never copy, paraphrase or adapt their questions.** Use them only to calibrate style. Measured on the PcM practice exam (62 items):
- About 1 in 4 items is check-all-that-apply, and most of those have **3 or 4** correct responses, not 2.
- Options are short (median ~7 words). Many are noun phrases ("Client type", "Project delivery method"), others are short imperative sentences.
- The correct option is **not** longer than the distractors (median length ratio 1.0).
- Stems run about 60 words and often include **bulleted facts**: project details, firm goals, budgets, schedules, expense lists. Some say "Refer to the exhibit" (staffing tables with rates and utilization, consultant comparisons, financial statements).
- About 1 in 6 items is a **multi-step calculation** (fees, not-to-exceed amounts, first-year cash, allocations). The numeric distractors are the partial results a candidate gets by skipping a step. The explanation lists the steps.
- Common question forms: "What action should the architect take next?", "How should the architect respond?", "Which … should the firm recommend?", "Which factors should the firm consider?", "For which of the following reasons should the firm …?", "Which … best meets these goals?"

## Stems
- A realistic scenario with concrete facts: firm size, project phase, timing, contract, numbers. Use generic names ("a 25-person firm", "XYZ Architects").
- Include the detail that decides the answer, and enough plausible detail that the decider doesn't stand out.
- End with a direct question:
  - "Which of the following is the most appropriate action?"
  - "What should the architect do first?"
  - "Which type of coverage would respond?"
  - "Which of the following best describes…?"
- Small exhibits (tables of staffing, financials, fees) go in the stem as Markdown tables. Lists of facts or goals go in as Markdown bullets. Both render in the app.
- For calculations, write the explanation as numbered steps, one per line ("1. … = …").
- No negative stems ("Which is NOT…", "…EXCEPT").
- Don't test pure recall. ARE items are Understand/Apply or Analyze/Evaluate.

## Options
- **MC:** 3 or 4 options, exactly 1 correct. **CATA:** 6 options, 2–4 correct, with "Check the N that apply."
- **Parallel and similar in length:** all verb phrases ("Hire…", "Engage…") or all noun phrases. Usually under about 15 words.
- **The correct answer must not stand out.** It shouldn't be the longest, the most qualified, or the only one with "and" or a caveat. The validator warns when the correct option is much longer than the rest.
- **Every distractor is something a reasonable person might choose.** Use these patterns:
  1. **Right action, wrong time**: fine later, not first.
  2. **Right action, wrong party**: the contractor's, owner's or consultant's job.
  3. **Overreach**: the architect takes on a role it shouldn't, such as site safety, means and methods, or guarantees.
  4. **Insufficient**: helps, but doesn't solve the stated problem.
  5. **Right in a different context**: a different delivery method, firm situation or project type.
  6. **Common misconception**: e.g., "CGL covers design errors"; "disclosure cures a supplier commission".
  7. **Numeric**: results of plausible mistakes (inverted ratio, wrong base, omitted term).
- **Never use** absurd, comic, or blatantly unethical options ("secretly…", "ignore the code"), unless the item is about recognizing a *subtle* ethics problem.
- **Never use** "all of the above" or "none of the above". Avoid "always/never" unless the rule really is absolute.

## Explanations
- The correct option: why it's the *best* answer, citing the rule, contract clause or concept.
- Every wrong option: why it's *less appropriate here* (which pattern above), not just "this is wrong."
- The question-level `explanation` states the principle in one or two sentences.

## IDs and history
- When a question is rewritten substantially, give it a **new ID** so old answers in someone's saved progress don't count toward the new item.

## Case studies
- Build each case study around 1–3 resources of the types NCARB lists for the division. Questions should need facts from **both** the scenario and a resource, and often from two resources (e.g., a staffing plan from the roster priced at the break-even rate from the financials).
- Write the scenario as short paragraphs plus bulleted constraints (policies, caps, deadlines). Those constraints should decide answers.
- Check every number twice. When one fact changes, recompute every question that uses it.
