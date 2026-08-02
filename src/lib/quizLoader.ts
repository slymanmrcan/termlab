import { createEmptyQuizDataset, mergeQuizFiles } from "./quizData";
import {
  LEVELS,
  TOPICS,
  type QuizLevel,
  type QuizQuestion,
  type QuizQuestionFile,
  type QuizStep,
  type QuizTopic,
} from "../types/quiz";

const quizModules = import.meta.glob(["../data/**/*.json"], {
  import: "default",
}) as Record<string, () => Promise<unknown>>;

const TOPIC_FILE_STEMS: Partial<Record<QuizTopic, readonly string[]>> = {
  package: ["packages"],
  docker: ["containers"],
};

const quizTopicCache = new Map<string, Promise<QuizQuestionFile>>();

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
    (value.accepted_answers === undefined ||
      (Array.isArray(value.accepted_answers) && value.accepted_answers.every((item: unknown) => typeof item === "string"))) &&
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

function resolveQuizModulePaths(level: QuizLevel, topic: QuizTopic) {
  const fileStems = TOPIC_FILE_STEMS[topic] ?? [topic];

  return fileStems
    .flatMap((fileStem) => [`../data/${level}/${fileStem}.json`, `../data/${level}/${fileStem}-expanded.json`])
    .filter((modulePath) => modulePath in quizModules)
    .sort((leftPath, rightPath) => leftPath.localeCompare(rightPath));
}

function normalizeQuizTopicFile(modulePath: string, value: unknown, level: QuizLevel, topic: QuizTopic) {
  const file = normalizeQuizFile(modulePath, value);

  if (file.level !== level || file.topic !== topic) {
    throw new Error(`Quiz file does not match requested selection: ${modulePath}`);
  }

  return file;
}

export function loadQuizTopicData(level: QuizLevel, topic: QuizTopic): Promise<QuizQuestionFile> {
  const cacheKey = `${level}:${topic}`;
  const cachedLoad = quizTopicCache.get(cacheKey);

  if (cachedLoad) {
    return cachedLoad;
  }

  const nextLoad = (async () => {
    const modulePaths = resolveQuizModulePaths(level, topic);

    if (modulePaths.length === 0) {
      return createEmptyQuizDataset()[level][topic];
    }

    const files = await Promise.all(
      modulePaths.map(async (modulePath) =>
        normalizeQuizTopicFile(modulePath, await quizModules[modulePath](), level, topic),
      ),
    );

    return mergeQuizFiles(files)[level][topic];
  })().catch((error) => {
    quizTopicCache.delete(cacheKey);
    throw error;
  });

  quizTopicCache.set(cacheKey, nextLoad);
  return nextLoad;
}
