import type {
  ExamMeta,
  ObjectiveChange,
  ObjectiveContent,
  ObjectiveMeta,
  PercentRange,
  Question,
  Flashcard,
  SectionMeta,
} from '../types';

// ---- Raw files (bundled at build time; adding files needs no code change) ----
import areDoc from '../../content/are-objectives.json';
import cseDoc from '../../content/cse-objectives.json';
import changesDoc from '../../content/are-objective-changes.json';

const contentFiles = import.meta.glob<ObjectiveContent>(
  ['/content/are/**/*.json', '/content/cse/**/*.json'],
  { eager: true, import: 'default' },
);
const noteFiles = import.meta.glob<string>(['/content/are/**/*.md', '/content/cse/**/*.md'], {
  eager: true,
  query: '?raw',
  import: 'default',
});

// ---- Helpers ----
const midpoint = (p?: PercentRange) => (p ? (p.min + p.max) / 2 : 1);

function parseDurationToSeconds(s?: string): number | undefined {
  if (!s) return undefined;
  const h = /(\d+)\s*hr/.exec(s);
  const m = /(\d+)\s*min/.exec(s);
  const total = (h ? +h[1] * 3600 : 0) + (m ? +m[1] * 60 : 0);
  return total || undefined;
}

// ---- ARE ----
interface RawAreObjective {
  id: string;
  number: string;
  title: string;
  cognitiveLevel: 'U/A' | 'A/E';
  targetPercent: PercentRange;
  description: string;
}
interface RawAreSection {
  id: string;
  number: string;
  name: string;
  intro?: string;
  targetPercent?: PercentRange;
  expectedItems?: string;
  objectives: RawAreObjective[];
}
interface RawAreDivision {
  code: string;
  name: string;
  overview: string;
  details: ExamMeta['details'];
  sections: RawAreSection[];
}

const areExams: ExamMeta[] = (areDoc as unknown as { divisions: RawAreDivision[] }).divisions.map((d) => {
  const sections: SectionMeta[] = d.sections.map((s) => ({
    id: s.id,
    number: s.number,
    name: s.name,
    intro: s.intro,
    targetPercent: s.targetPercent,
    expectedItems: s.expectedItems,
    objectives: s.objectives.map(
      (o): ObjectiveMeta => ({
        id: o.id,
        number: o.number,
        title: o.title,
        description: o.description,
        cognitiveLevel: o.cognitiveLevel,
        targetPercent: o.targetPercent,
        weight: midpoint(o.targetPercent),
        examId: d.code,
        sectionId: s.id,
      }),
    ),
  }));
  const secs = parseDurationToSeconds(d.details?.testDuration);
  return {
    id: d.code,
    kind: 'ARE',
    name: d.name,
    overview: d.overview,
    details: d.details,
    sections,
    status: 'ready',
    secondsPerItem: secs && d.details?.totalItems ? secs / d.details.totalItems : 120,
  };
});

// ---- CSE ----
// Expected shape once the CSE Handbook is extracted (see content/schema/README.md):
// contentAreas: [{ id, number, name, targetPercent?, weightPercent?, statements: [{ id, kind, text }] }]
interface RawCseStatement {
  id: string; // CAB's original number, e.g. "T12" or "K34"
  kind?: 'task' | 'knowledge';
  text: string;
}
interface RawCseArea {
  id: string;
  number: string;
  name: string;
  description?: string;
  targetPercent?: PercentRange;
  weightPercent?: number;
  statements?: RawCseStatement[];
}
const cseRaw = cseDoc as unknown as {
  name: string;
  status?: string;
  statusNote?: string;
  contentAreas: RawCseArea[];
  examFormat?: { itemCount?: number; timeMinutes?: number };
};

const cseSections: SectionMeta[] = cseRaw.contentAreas.map((a) => {
  const areaWeight = a.weightPercent ?? midpoint(a.targetPercent);
  const stmts = a.statements ?? [];
  return {
    id: `CSE-A${a.number}`,
    number: a.number,
    name: a.name,
    intro: a.description,
    targetPercent: a.targetPercent ?? (a.weightPercent ? { min: a.weightPercent, max: a.weightPercent } : undefined),
    objectives: stmts.map(
      (st): ObjectiveMeta => ({
        id: `CSE-${st.id}`,
        number: st.id,
        title: st.text,
        description: st.kind === 'knowledge' ? 'Knowledge statement' : st.kind === 'task' ? 'Task statement' : '',
        // Area weight split evenly across its statements.
        weight: stmts.length ? areaWeight / stmts.length : 1,
        examId: 'CSE',
        sectionId: `CSE-A${a.number}`,
      }),
    ),
  };
});

const cseExam: ExamMeta = {
  id: 'CSE',
  kind: 'CSE',
  name: cseRaw.name,
  sections: cseSections,
  status: cseSections.length ? 'ready' : 'awaiting-source',
  statusNote: cseRaw.statusNote,
  secondsPerItem:
    cseRaw.examFormat?.itemCount && cseRaw.examFormat.timeMinutes
      ? (cseRaw.examFormat.timeMinutes * 60) / cseRaw.examFormat.itemCount
      : 90,
};

export const EXAMS: ExamMeta[] = [...areExams, cseExam];

export const OBJECTIVES: ObjectiveMeta[] = EXAMS.flatMap((e) => e.sections.flatMap((s) => s.objectives));
export const OBJECTIVE_BY_ID = new Map(OBJECTIVES.map((o) => [o.id, o]));
export const EXAM_BY_ID = new Map(EXAMS.map((e) => [e.id, e]));
export const SECTION_BY_ID = new Map(EXAMS.flatMap((e) => e.sections.map((s) => [s.id, s] as const)));

// ---- Study content ----
export const CONTENT_BY_OBJECTIVE = new Map<string, ObjectiveContent>();
const unknownContent: string[] = [];

for (const [path, raw] of Object.entries(contentFiles)) {
  if (!raw || typeof raw !== 'object' || !('objectiveId' in raw)) continue; // e.g. a stray JSON file
  const meta = OBJECTIVE_BY_ID.get(raw.objectiveId);
  if (!meta) {
    unknownContent.push(`${path} → ${raw.objectiveId}`);
    continue;
  }
  const notePath = path.replace(/\.json$/, '.md');
  const content: ObjectiveContent = {
    ...raw,
    references: raw.references ?? [],
    questions: (raw.questions ?? []).map((q) => ({ ...q, objectiveId: raw.objectiveId })),
    flashcards: (raw.flashcards ?? []).map((c) => ({ ...c, objectiveId: raw.objectiveId })),
    note: noteFiles[notePath],
  };
  CONTENT_BY_OBJECTIVE.set(raw.objectiveId, content);
}
if (unknownContent.length) {
  // The validator fails the build on this; in dev, make it loud.
  console.warn('Content files reference unknown objective IDs:', unknownContent);
}

export const ALL_QUESTIONS: Question[] = [...CONTENT_BY_OBJECTIVE.values()].flatMap((c) => c.questions);
export const QUESTION_BY_ID = new Map(ALL_QUESTIONS.map((q) => [q.id, q]));
export const ALL_CARDS: Flashcard[] = [...CONTENT_BY_OBJECTIVE.values()].flatMap((c) => c.flashcards);

export const CHANGES_BY_OBJECTIVE = new Map<string, ObjectiveChange>(
  (changesDoc as unknown as { identified: ObjectiveChange[] }).identified.map((c) => [c.objectiveId, c]),
);
export const CHANGES_NOTE = (changesDoc as unknown as { note: string }).note;

/** Objectives belonging to a scope: an exam id, a section id, or an objective id. */
export function objectivesInScope(scope: string): ObjectiveMeta[] {
  if (scope === 'ARE') return OBJECTIVES.filter((o) => EXAM_BY_ID.get(o.examId)?.kind === 'ARE');
  if (EXAM_BY_ID.has(scope)) return OBJECTIVES.filter((o) => o.examId === scope);
  if (SECTION_BY_ID.has(scope)) return SECTION_BY_ID.get(scope)!.objectives;
  const o = OBJECTIVE_BY_ID.get(scope);
  return o ? [o] : [];
}

export function scopeLabel(scope: string): string {
  if (scope === 'ARE') return 'All ARE divisions';
  const exam = EXAM_BY_ID.get(scope);
  if (exam) return `${exam.id} · ${exam.name}`;
  const sec = SECTION_BY_ID.get(scope);
  if (sec) {
    const examId = sec.objectives[0]?.examId ?? scope.split('-')[0];
    return `${examId} · Section ${sec.number}: ${sec.name}`;
  }
  const o = OBJECTIVE_BY_ID.get(scope);
  return o ? `${o.examId} ${o.number} · ${o.title}` : scope;
}
