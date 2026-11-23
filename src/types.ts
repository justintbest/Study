// ---------- Official objectives (generated from source documents) ----------

export interface PercentRange {
  min: number;
  max: number;
}

export type ExamKind = 'ARE' | 'CSE';
export type CognitiveLevel = 'U/A' | 'A/E';

export interface ObjectiveMeta {
  /** Globally unique, e.g. "PcM-2.3" or "CSE-T12". */
  id: string;
  /** Display number, e.g. "2.3" or "T12". */
  number: string;
  title: string;
  description: string;
  cognitiveLevel?: CognitiveLevel;
  targetPercent?: PercentRange;
  /** Weight used for weighted quizzes (midpoint of targetPercent, or 1). */
  weight: number;
  examId: string;
  sectionId: string;
}

export interface SectionMeta {
  id: string;
  number: string;
  name: string;
  intro?: string;
  targetPercent?: PercentRange;
  expectedItems?: string;
  objectives: ObjectiveMeta[];
}

export interface ExamDetails {
  totalItems?: number;
  scoredItems?: number;
  pretestItems?: number;
  caseStudies?: string;
  caseStudyItems?: string;
  testDuration?: string;
  breakDuration?: string;
  appointmentDuration?: string;
}

export interface ExamMeta {
  /** "PcM", "PjM", "PA", "PPD", "PDD", "CE", "CSE" */
  id: string;
  kind: ExamKind;
  name: string;
  overview?: string;
  details?: ExamDetails;
  sections: SectionMeta[];
  /** 'ready' when objectives exist; 'awaiting-source' when the official source is missing. */
  status: 'ready' | 'awaiting-source';
  statusNote?: string;
  /** Seconds per item for timed simulations (from the official duration ÷ items). */
  secondsPerItem: number;
}

// ---------- Study content (one file pair per objective) ----------

export type Confidence = 'high' | 'medium' | 'low';

export interface Reference {
  kind: string; // "AIA" | "IBC" | "ADA" | "NCARB" | "AIA Code of Ethics" | "Federal law" | "CA statute" | ...
  citation: string;
  topic: string;
  confidence?: Confidence;
  confidenceNote?: string;
}

export interface QuestionOption {
  id: string;
  text: string;
  correct?: boolean;
  explanation: string;
}

export type QuestionType = 'mc' | 'cata' | 'numeric';

export interface Question {
  id: string;
  type: QuestionType;
  stem: string;
  options?: QuestionOption[];
  selectCount?: number;
  answer?: { value: number; tolerance?: number; unit?: string };
  explanation: string;
  cognitiveLevel?: CognitiveLevel;
  confidence?: Confidence;
  confidenceNote?: string;
  /** Filled in by the loader. */
  objectiveId: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  confidence?: Confidence;
  confidenceNote?: string;
  /** Filled in by the loader. */
  objectiveId: string;
}

export interface ObjectiveContent {
  objectiveId: string;
  exam: ExamKind;
  division: string;
  generated?: string;
  /** Date the content's facts were checked against the files in /sources. */
  verified?: string;
  references: Reference[];
  questions: Question[];
  flashcards: Flashcard[];
  note?: string; // markdown, attached by the loader from the .md file
}

export interface ObjectiveChange {
  objectiveId: string;
  summary: string;
  confidence: Confidence;
  evidence: string;
}
