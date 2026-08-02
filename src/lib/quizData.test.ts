import { describe, expect, it } from "vitest";
import { createEmptyQuizDataset, mergeQuizFiles } from "./quizData";
import type { QuizQuestionFile } from "../types/quiz";

describe("createEmptyQuizDataset", () => {
  it("creates a dataset with all levels and topics", () => {
    const dataset = createEmptyQuizDataset();

    expect(Object.keys(dataset)).toEqual(["junior", "mid", "senior"]);
    expect(Object.keys(dataset.junior).length).toBeGreaterThan(20);
  });

  it("every cell has an empty questions array", () => {
    const dataset = createEmptyQuizDataset();

    for (const level of Object.values(dataset)) {
      for (const file of Object.values(level)) {
        expect(file.questions).toEqual([]);
      }
    }
  });
});

describe("mergeQuizFiles", () => {
  const makeFile = (overrides: Partial<QuizQuestionFile> = {}): QuizQuestionFile => ({
    level: "junior",
    topic: "filesystem",
    questions: [],
    ...overrides,
  });

  it("merges questions from multiple files into the dataset", () => {
    const fileA = makeFile({
      questions: [
        { id: "fs-001", type: "single", scenario: "A", steps: [{ prompt: "$ ", answer: "ls", hint_text: "h", hint_partial: "p" }] },
      ],
    });
    const fileB = makeFile({
      questions: [
        { id: "fs-002", type: "single", scenario: "B", steps: [{ prompt: "$ ", answer: "pwd", hint_text: "h", hint_partial: "p" }] },
      ],
    });

    const dataset = mergeQuizFiles([fileA, fileB]);
    const questions = dataset.junior.filesystem.questions;

    expect(questions).toHaveLength(2);
    expect(questions.map((q) => q.id)).toEqual(["fs-001", "fs-002"]);
  });

  it("deduplicates questions by id (last wins)", () => {
    const fileA = makeFile({
      questions: [
        { id: "fs-001", type: "single", scenario: "Original", steps: [{ prompt: "$ ", answer: "ls", hint_text: "h", hint_partial: "p" }] },
      ],
    });
    const fileB = makeFile({
      questions: [
        { id: "fs-001", type: "single", scenario: "Override", steps: [{ prompt: "$ ", answer: "ls -la", hint_text: "h", hint_partial: "p" }] },
      ],
    });

    const dataset = mergeQuizFiles([fileA, fileB]);
    const questions = dataset.junior.filesystem.questions;

    expect(questions).toHaveLength(1);
    expect(questions[0].scenario).toBe("Override");
  });

  it("sorts questions by id", () => {
    const file = makeFile({
      questions: [
        { id: "fs-003", type: "single", scenario: "C", steps: [{ prompt: "$ ", answer: "c", hint_text: "h", hint_partial: "p" }] },
        { id: "fs-001", type: "single", scenario: "A", steps: [{ prompt: "$ ", answer: "a", hint_text: "h", hint_partial: "p" }] },
        { id: "fs-002", type: "single", scenario: "B", steps: [{ prompt: "$ ", answer: "b", hint_text: "h", hint_partial: "p" }] },
      ],
    });

    const dataset = mergeQuizFiles([file]);
    const ids = dataset.junior.filesystem.questions.map((q) => q.id);

    expect(ids).toEqual(["fs-001", "fs-002", "fs-003"]);
  });

  it("handles empty input", () => {
    const dataset = mergeQuizFiles([]);

    for (const level of Object.values(dataset)) {
      for (const file of Object.values(level)) {
        expect(file.questions).toEqual([]);
      }
    }
  });
});
