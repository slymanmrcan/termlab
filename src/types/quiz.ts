export const LEVELS = ["junior", "mid", "senior"] as const;

export const TOPICS = [
  // Keep this in sync with the `topic` values used in `src/data/**/*.json`.
  "filesystem",
  "networking",
  "process",
  "permissions",
  "text",
  "system",
  "shell",
  "storage",
  "security",
  "scripting",
  "ssh",
  "git",
  "package",
  "monitoring",
  "github-cli",
  "ansible",
  "docker",
  "docker-compose",
  "docker-swarm",
  "kubernetes",
  "helm",
  "terraform",
] as const;

export type QuizLevel = (typeof LEVELS)[number];
export type QuizTopic = (typeof TOPICS)[number];
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
