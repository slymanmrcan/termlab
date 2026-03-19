import { type QuizTopic } from "../config/topics";

export { TOPIC_LABELS, TOPIC_SECTIONS, TOPICS, type QuizTopic } from "../config/topics";

export const LEVELS = ["junior", "mid", "senior"] as const;

export type QuizLevel = (typeof LEVELS)[number];
export type QuizQuestionType = "single" | "multi-step";

export interface QuizStep {
  prompt: string;
  answer: string;
  hint_text: string;
  hint_partial: string;
}

export interface QuizQuestion {
  id: string;
  type: QuizQuestionType;
  scenario: string;
  steps: QuizStep[];
}

export interface QuizQuestionFile {
  level: QuizLevel;
  topic: QuizTopic;
  questions: QuizQuestion[];
}

export type QuizDataset = Record<QuizLevel, Record<QuizTopic, QuizQuestionFile>>;

export interface TerminalLine {
  id: number;
  kind: "command" | "output" | "error" | "skip";
  text: string;
  prompt?: string;
}
