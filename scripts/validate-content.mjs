#!/usr/bin/env node
// Validates everything under /content. Runs automatically before `npm run build`.
//   node scripts/validate-content.mjs            → errors fail (exit 1), warnings print
//   node scripts/validate-content.mjs --strict   → warnings fail too
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const C = join(ROOT, 'content');
const strict = process.argv.includes('--strict');
const errors = [];
const warnings = [];
const err = (f, m) => errors.push(`${f}: ${m}`);
const warn = (f, m) => warnings.push(`${f}: ${m}`);

const readJSON = (p) => {
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch (e) {
    err(relative(ROOT, p), `invalid JSON (${e.message})`);
    return null;
  }
};

// ---------- official objective IDs ----------
const are = readJSON(join(C, 'are-objectives.json'));
const cse = readJSON(join(C, 'cse-objectives.json'));
const objectiveIds = new Set();
const objectiveExam = new Map();
for (const d of are?.divisions ?? []) {
  for (const s of d.sections) for (const o of s.objectives) {
    objectiveIds.add(o.id);
    objectiveExam.set(o.id, 'ARE');
  }
}
for (const a of cse?.contentAreas ?? []) {
  for (const st of a.statements ?? []) {
    objectiveIds.add(`CSE-${st.id}`);
    objectiveExam.set(`CSE-${st.id}`, 'CSE');
  }
}
if (are && objectiveIds.size < 91) err('content/are-objectives.json', `expected 91 ARE objectives, found ${objectiveIds.size}`);

// ---------- California material must not appear in ARE content ----------
// (ARE tests the national IBC; California code/statute belongs in the CSE.)
const CA_PATTERNS = [
  /\bCBC\b/,
  /California Building Code/i,
  /\bTitle 24\b/i,
  /\bCCR\b/,
  /California Code of Regulations/i,
  /\bBPC\b/,
  /Business (and|&) Professions Code/i,
  /Architects Practice Act/i,
  /California Architects Board/i,
  /\bCALGreen\b/i,
  /\bCEQA\b/,
  /\bDSA\b/,
  /Field Act/i,
  /Coastal Act/i,
  /\bCal\/OSHA\b/i,
];
const caHits = (text) => CA_PATTERNS.filter((re) => re.test(text)).map((re) => re.source);

// ---------- walk content files ----------
function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const files = [...walk(join(C, 'are')), ...walk(join(C, 'cse'))];
const isCase = (f) => /[\\/]case-studies[\\/]/.test(f);
const caseFiles = files.filter((f) => f.endsWith('.json') && isCase(f));
const jsonFiles = files.filter((f) => f.endsWith('.json') && !isCase(f));
const mdFiles = new Set(files.filter((f) => f.endsWith('.md')));
const seenIds = new Map();
const covered = new Set();
const CONF = new Set(['high', 'medium', 'low']);
let qTotal = 0,
  cTotal = 0,
  flagged = 0;

// ---------- shared question rules (standalone and case-study) ----------
function checkQuestion(rel, q, exam, conf) {
  const where = `question ${q.id}`;
  if (!q.stem || !q.explanation) err(rel, `${where}: needs stem and explanation`);
  conf(q, where);
  if (exam === 'CSE' && q.type !== 'mc') err(rel, `${where}: CSE questions must be multiple choice`);
  if (q.type === 'mc' || q.type === 'cata') {
    const ops = q.options ?? [];
    const right = ops.filter((o) => o.correct).length;
    const optIds = new Set(ops.map((o) => o.id));
    if (optIds.size !== ops.length) err(rel, `${where}: duplicate option ids`);
    for (const o of ops) if (!o.explanation || o.explanation.length < 15) err(rel, `${where}: option ${o.id} needs an explanation of why it is right/wrong`);
    if (q.type === 'mc') {
      if (ops.length < 3 || ops.length > 4) err(rel, `${where}: multiple choice needs 3–4 options (ARE format), has ${ops.length}`);
      if (right !== 1) err(rel, `${where}: multiple choice needs exactly 1 correct option, has ${right}`);
    } else {
      if (ops.length !== 6) err(rel, `${where}: check-all-that-apply needs 6 options (ARE format), has ${ops.length}`);
      if (right < 2 || right > 4) err(rel, `${where}: check-all-that-apply needs 2–4 correct, has ${right}`);
      if (q.selectCount !== right) err(rel, `${where}: selectCount ${q.selectCount} ≠ ${right} correct options`);
    }
    const allText = [q.stem, ...ops.map((o) => o.text)].join(' ');
    if (/\b(all|none) of the above\b/i.test(allText)) err(rel, `${where}: don't use "all/none of the above"`);
    if (/\b(NOT|EXCEPT)\b/.test(q.stem)) warn(rel, `${where}: avoid negative stems (NOT/EXCEPT)`);
    if (q.type === 'mc' && right === 1) {
      const c = ops.find((o) => o.correct).text.length;
      const others = ops.filter((o) => !o.correct).map((o) => o.text.length);
      const avg = others.reduce((a, b) => a + b, 0) / (others.length || 1);
      if (c > 40 && c > avg * 1.6) warn(rel, `${where}: correct option is much longer than the distractors (${c} vs avg ${Math.round(avg)} chars), a giveaway`);
    }
  } else if (q.type === 'numeric') {
    if (!q.answer || typeof q.answer.value !== 'number') err(rel, `${where}: numeric needs answer.value`);
  } else err(rel, `${where}: unknown type "${q.type}"`);
}

for (const f of jsonFiles) {
  const rel = relative(ROOT, f);
  const doc = readJSON(f);
  if (!doc) continue;
  const id = doc.objectiveId;
  if (!id || !objectiveIds.has(id)) {
    err(rel, `objectiveId "${id}" is not an official objective/statement ID`);
    continue;
  }
  if (covered.has(id)) err(rel, `duplicate content for ${id}`);
  covered.add(id);
  if (basename(f, '.json') !== id) warn(rel, `file name should be ${id}.json`);
  const exam = objectiveExam.get(id);
  if (doc.exam !== exam) err(rel, `exam is "${doc.exam}" but ${id} belongs to ${exam}`);

  const md = f.replace(/\.json$/, '.md');
  if (!mdFiles.has(md)) warn(rel, 'no matching .md study note');

  const uniq = (x, kind) => {
    if (!x.id) return err(rel, `${kind} missing id`);
    if (seenIds.has(x.id)) err(rel, `duplicate id ${x.id} (also in ${seenIds.get(x.id)})`);
    seenIds.set(x.id, rel);
    if (!x.id.startsWith(id + '-')) err(rel, `${kind} id ${x.id} should start with "${id}-"`);
  };
  const conf = (x, where) => {
    if (x.confidence !== undefined && !CONF.has(x.confidence)) err(rel, `${where}: confidence must be high|medium|low`);
    if (x.confidence && x.confidence !== 'high') {
      flagged++;
      if (!x.confidenceNote) warn(rel, `${where}: flagged ${x.confidence} but no confidenceNote saying what to verify`);
    }
  };

  // references
  if (!Array.isArray(doc.references)) err(rel, 'references must be an array');
  for (const [k, r] of (doc.references ?? []).entries()) {
    if (!r.kind || !r.citation || !r.topic) err(rel, `reference #${k + 1} needs kind, citation, topic`);
    conf(r, `reference ${r.citation}`);
  }

  // questions
  const qs = doc.questions ?? [];
  qTotal += qs.length;
  if (exam === 'ARE' && (qs.length < 8 || qs.length > 12)) err(rel, `${qs.length} questions (expected 8–12)`);
  if (exam === 'CSE' && (qs.length < 8 || qs.length > 12)) err(rel, `${qs.length} questions (expected 8–12)`);
  for (const q of qs) {
    uniq(q, 'question');
    checkQuestion(rel, q, exam, conf);
  }

  // bank-level cue: correct answer shouldn't be the longest option much more often than chance
  {
    const mcs = qs.filter((q) => q.type === 'mc' && (q.options ?? []).filter((o) => o.correct).length === 1);
    const longest = mcs.filter((q) => {
      const c = q.options.find((o) => o.correct).text.length;
      return q.options.filter((o) => !o.correct).every((o) => c > o.text.length); // strictly longest; ties aren't a tell
    }).length;
    if (mcs.length >= 5 && longest / mcs.length > 0.5)
      warn(rel, `correct answer is the longest option in ${longest}/${mcs.length} multiple-choice items, which is a pattern test-takers can exploit`);
  }

  // flashcards
  const cs = doc.flashcards ?? [];
  cTotal += cs.length;
  if (cs.length < 10 || cs.length > 20) err(rel, `${cs.length} flashcards (expected 10–20)`);
  for (const c of cs) {
    uniq(c, 'flashcard');
    if (!c.front || !c.back) err(rel, `flashcard ${c.id}: needs front and back`);
    conf(c, `flashcard ${c.id}`);
  }

  // ARE/CSE separation
  if (exam === 'ARE') {
    const text = JSON.stringify(doc) + (mdFiles.has(md) ? readFileSync(md, 'utf8') : '');
    const hits = caHits(text);
    if (hits.length) err(rel, `ARE content mentions California-specific code/law (${hits.join(', ')}). Move it to CSE content.`);
  }
}

// ---------- case studies: content/<exam>/<DIV>/case-studies/<DIV>-CS<n>.json ----------
let caseCount = 0,
  caseQCount = 0;
for (const f of caseFiles) {
  const rel = relative(ROOT, f);
  const doc = readJSON(f);
  if (!doc) continue;
  caseCount++;
  const id = doc.id;
  const div = basename(dirname(dirname(f)));
  if (!id || !new RegExp(`^${div}-CS\\d+$`).test(id)) err(rel, `case study id "${id}" should look like ${div}-CS1`);
  if (basename(f, '.json') !== id) warn(rel, `file name should be ${id}.json`);
  if (seenIds.has(id)) err(rel, `duplicate id ${id}`);
  seenIds.set(id, rel);
  if (doc.division !== div) err(rel, `division "${doc.division}" doesn't match folder ${div}`);
  if (!doc.title || !doc.scenario) err(rel, 'case study needs title and scenario');
  const res = doc.resources ?? [];
  if (res.length < 1 || res.length > 3) err(rel, `${res.length} resources (expected 1–3, like the ARE)`);
  for (const r of res) if (!r.id || !r.title || !r.kind || !r.body) err(rel, `resource ${r.id}: needs id, title, kind, body`);
  const qs = doc.questions ?? [];
  caseQCount += qs.length;
  if (qs.length < 3 || qs.length > 8) err(rel, `${qs.length} questions (expected 3–8 per case study)`);
  const conf = (x, where) => {
    if (x.confidence !== undefined && !CONF.has(x.confidence)) err(rel, `${where}: confidence must be high|medium|low`);
    if (x.confidence && x.confidence !== 'high') {
      flagged++;
      if (!x.confidenceNote) warn(rel, `${where}: flagged ${x.confidence} but no confidenceNote saying what to verify`);
    }
  };
  for (const q of qs) {
    if (!q.id || !q.id.startsWith(id + '-')) err(rel, `question id ${q.id} should start with "${id}-"`);
    if (seenIds.has(q.id)) err(rel, `duplicate id ${q.id}`);
    seenIds.set(q.id, rel);
    if (!objectiveIds.has(q.objectiveId)) err(rel, `question ${q.id}: objectiveId "${q.objectiveId}" is not an official objective`);
    else if (!q.objectiveId.startsWith(div + '-') || objectiveExam.get(q.objectiveId) !== doc.exam)
      err(rel, `question ${q.id}: objective ${q.objectiveId} isn't in ${doc.exam} ${div}`);
    checkQuestion(rel, q, doc.exam, conf);
  }
  if (doc.exam === 'ARE') {
    const hits = caHits(JSON.stringify(doc));
    if (hits.length) err(rel, `ARE case study mentions California-specific code/law (${hits.join(', ')}).`);
  }
}

// ---------- difficulty profile vs NCARB practice exams (statistics in content/schema/difficulty-targets.json) ----------
{
  const tp = join(C, 'schema', 'difficulty-targets.json');
  if (existsSync(tp)) {
    const targets = JSON.parse(readFileSync(tp, 'utf8')).divisions;
    const bySec = new Map(); // "PcM|1" -> questions
    const add = (q) => {
      const [div, num] = q.objectiveId.split('-');
      const key = `${div}|${num.split('.')[0]}`;
      if (!bySec.has(key)) bySec.set(key, []);
      bySec.get(key).push(q);
    };
    for (const f of jsonFiles) {
      const d = JSON.parse(readFileSync(f, 'utf8'));
      if (d.exam === 'ARE') for (const q of d.questions ?? []) add({ ...q, objectiveId: d.objectiveId });
    }
    for (const f of caseFiles) {
      const d = JSON.parse(readFileSync(f, 'utf8'));
      if (d.exam === 'ARE') for (const q of d.questions ?? []) add({ ...q, caseStudyId: d.id });
    }
    // Stem words exclude Markdown table rows: NCARB puts exhibits outside the stem.
    const words = (q) => q.stem.split('\n').filter((l) => !l.trim().startsWith('|')).join(' ').split(/\s+/).filter(Boolean).length;
    const isCalc = (q) => q.calculation === true || /(^|\n)1\. /.test(q.explanation ?? '');
    const isExhibit = (q) => !!q.caseStudyId || /\n\s*\|/.test(q.stem) || /refer to the/i.test(q.stem);
    const median = (a) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
    const divs = [...new Set([...bySec.keys()].map((k) => k.split('|')[0]))];
    for (const div of divs) {
      const t = targets[div];
      if (!t) continue;
      console.log(`difficulty profile ${div} (app vs NCARB practice exam):`);
      for (const [num, tgt] of Object.entries(t.sections)) {
        const qs = bySec.get(`${div}|${num}`) ?? [];
        if (!qs.length || !tgt) continue;
        const m = {
          stem: median(qs.map(words)),
          cata: qs.filter((q) => q.type === 'cata').length / qs.length,
          calc: qs.filter(isCalc).length / qs.length,
          exh: qs.filter(isExhibit).length / qs.length,
        };
        const pctf = (x) => `${Math.round(x * 100)}%`;
        console.log(`  S${num}: stem ${Math.round(m.stem)}/${tgt.stemWordsMedian} words · CATA ${pctf(m.cata)}/${pctf(tgt.cataShare)} · calc ${pctf(m.calc)}/${pctf(tgt.calcShare)} · exhibit/case ${pctf(m.exh)}/${pctf(tgt.exhibitOrCaseShare)}  (${qs.length} items)`);
        const where = `content/are/${div} section ${num}`;
        if (m.stem < tgt.stemWordsMedian * 0.75) warn(where, `stems are shorter than NCARB's (${Math.round(m.stem)} vs ${tgt.stemWordsMedian} words median): questions likely easier`);
        if (m.calc < tgt.calcShare - 0.1) warn(where, `fewer calculations than NCARB (${pctf(m.calc)} vs ${pctf(tgt.calcShare)})`);
        if (m.exh < tgt.exhibitOrCaseShare - 0.1) warn(where, `fewer exhibit/case items than NCARB (${pctf(m.exh)} vs ${pctf(tgt.exhibitOrCaseShare)})`);
        if (Math.abs(m.cata - tgt.cataShare) > 0.12) warn(where, `check-all-that-apply share ${pctf(m.cata)} vs NCARB ${pctf(tgt.cataShare)}`);
      }
    }
  }
}

// ---------- guard: never copy NCARB practice-exam items (license forbids derivative works) ----------
// Runs only where the PDFs and poppler's pdftotext are available locally; otherwise skipped.
{
  const peDir = join(ROOT, 'sources', 'are', 'practice-exams');
  const pdfs = existsSync(peDir) ? readdirSync(peDir).filter((n) => n.endsWith('.pdf')) : [];
  let peText = '';
  try {
    for (const n of pdfs) peText += execFileSync('pdftotext', [join(peDir, n), '-'], { encoding: 'utf8', maxBuffer: 64e6 }) + '\n';
  } catch {
    peText = '';
  }
  if (peText) {
    const words = (s) => s.toLowerCase().match(/[a-z0-9$%]+/g) ?? [];
    const N = 9; // long enough that stock phrases ("which of the following is the most") don't trip it
    const pw = words(peText);
    const shingles = new Set();
    for (let i = 0; i + N <= pw.length; i++) shingles.add(pw.slice(i, i + N).join(' '));
    for (const f of [...jsonFiles, ...caseFiles]) {
      const doc = JSON.parse(readFileSync(f, 'utf8'));
      for (const q of doc.questions ?? []) {
        const w = words([q.stem, ...(q.options ?? []).map((o) => o.text)].join(' '));
        for (let i = 0; i + N <= w.length; i++) {
          if (shingles.has(w.slice(i, i + N).join(' '))) {
            err(relative(ROOT, f), `question ${q.id} repeats NCARB practice-exam wording ("${w.slice(i, i + N).join(' ')}"). Write it in your own words.`);
            break;
          }
        }
      }
    }
    console.log(`checked ${jsonFiles.length + caseFiles.length} files against ${pdfs.length} NCARB practice exams for copied wording`);
  }
}

for (const md of mdFiles) {
  if (!existsSync(md.replace(/\.md$/, '.json'))) warn(relative(ROOT, md), 'study note has no matching .json');
}

// ---------- report ----------
const byDivision = {};
for (const id of covered) {
  const d = id.split('-')[0];
  byDivision[d] = (byDivision[d] ?? 0) + 1;
}
console.log(
  `content: ${covered.size} objectives with content (${Object.entries(byDivision)
    .map(([d, n]) => `${d} ${n}`)
    .join(', ') || 'none'}), ${qTotal} questions, ${cTotal} flashcards, ${caseCount} case studies (${caseQCount} questions), ${flagged} items flagged for verification`,
);
if (cse?.status === 'awaiting-source') console.log('note: CSE objectives are awaiting the CSE Handbook (content/cse-objectives.json).');
for (const w of warnings) console.warn(`warning: ${w}`);
for (const e of errors) console.error(`error: ${e}`);
if (errors.length || (strict && warnings.length)) {
  console.error(`\n✗ content validation failed (${errors.length} errors, ${warnings.length} warnings)`);
  process.exit(1);
}
console.log('✓ content valid');
