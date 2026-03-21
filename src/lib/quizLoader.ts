import { createEmptyQuizDataset, mergeQuizFiles } from "./quizData";
import {
  LEVELS,
  TOPICS,
  type QuizDataset,
  type QuizQuestion,
  type QuizQuestionFile,
  type QuizStep,
} from "../types/quiz";

const quizModules = import.meta.glob(["../data/**/*.json"], {
  import: "default",
}) as Record<string, () => Promise<unknown>>;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isQuizLevel(value: unknown): value is (typeof LEVELS)[number] {
  return typeof value === "string" && LEVELS.includes(value as (typeof LEVELS)[number]);
}

function isQuizTopic(value: unknown): value is (typeof TOPICS)[number] {
  return typeof value === "string" && TOPICS.includes(value as (typeof TOPICS)[number]);
}

function isQuizStep(value: unknown): value is QuizStep {
  return (
    isObject(value) &&
    typeof value.prompt === "string" &&
    typeof value.answer === "string" &&
    typeof value.hint_text === "string" &&
    typeof value.hint_partial === "string"
  );
}

function isQuizQuestion(value: unknown): value is QuizQuestion {
  return (
    isObject(value) &&
    typeof value.id === "string" &&
    (value.type === "single" || value.type === "multi-step") &&
    typeof value.scenario === "string" &&
    Array.isArray(value.steps) &&
    value.steps.every(isQuizStep)
  );
}

function isQuizQuestionFile(value: unknown): value is QuizQuestionFile {
  return (
    isObject(value) &&
    isQuizLevel(value.level) &&
    isQuizTopic(value.topic) &&
    Array.isArray(value.questions) &&
    value.questions.every(isQuizQuestion)
  );
}

function normalizeQuizFile(modulePath: string, value: unknown): QuizQuestionFile {
  if (!isQuizQuestionFile(value)) {
    throw new Error(`Invalid quiz file: ${modulePath}`);
  }

  return value;
}

export async function loadQuizData(): Promise<QuizDataset> {
  const modules = Object.entries(quizModules).sort(([leftPath], [rightPath]) => leftPath.localeCompare(rightPath));

  if (modules.length === 0) {
    return createEmptyQuizDataset();
  }

  const files = await Promise.all(
    modules.map(async ([modulePath, loadModule]) => normalizeQuizFile(modulePath, await loadModule())),
  );

  return mergeQuizFiles(files);
}
