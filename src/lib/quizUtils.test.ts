import { describe, expect, it } from "vitest";
import { buildSuccessText, hashSeed, isAnswerCorrect, normalizeAnswer, shuffle } from "./quizUtils";

describe("hashSeed", () => {
  it("returns a positive integer for any string", () => {
    expect(hashSeed("hello")).toBeGreaterThan(0);
    expect(hashSeed("")).toBe(1);
    expect(hashSeed("a")).toBeGreaterThan(0);
  });

  it("is deterministic", () => {
    expect(hashSeed("junior:filesystem:123")).toBe(hashSeed("junior:filesystem:123"));
  });

  it("produces different seeds for different inputs", () => {
    expect(hashSeed("seed-a")).not.toBe(hashSeed("seed-b"));
  });
});

describe("shuffle", () => {
  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  it("returns an array of the same length", () => {
    expect(shuffle(items, "seed")).toHaveLength(items.length);
  });

  it("contains all original elements", () => {
    const result = shuffle(items, "seed");
    expect(result.sort((a, b) => a - b)).toEqual(items);
  });

  it("is deterministic for the same seed", () => {
    expect(shuffle(items, "fixed-seed")).toEqual(shuffle(items, "fixed-seed"));
  });

  it("produces different order for different seeds", () => {
    const resultA = shuffle(items, "seed-a");
    const resultB = shuffle(items, "seed-b");
    expect(resultA).not.toEqual(resultB);
  });

  it("does not mutate the original array", () => {
    const original = [...items];
    shuffle(items, "seed");
    expect(items).toEqual(original);
  });
});

describe("normalizeAnswer", () => {
  it("trims leading and trailing whitespace", () => {
    expect(normalizeAnswer("  docker ps  ")).toBe("docker ps");
  });

  it("collapses multiple internal spaces", () => {
    expect(normalizeAnswer("docker   ps   -a")).toBe("docker ps -a");
  });

  it("lowercases the input", () => {
    expect(normalizeAnswer("Docker PS")).toBe("docker ps");
  });

  it("handles tabs and mixed whitespace", () => {
    expect(normalizeAnswer("git\t add\t.")).toBe("git add .");
  });
});

describe("isAnswerCorrect", () => {
  it("matches exact answer", () => {
    expect(isAnswerCorrect("docker ps", { answer: "docker ps" })).toBe(true);
  });

  it("matches case-insensitively", () => {
    expect(isAnswerCorrect("Docker PS", { answer: "docker ps" })).toBe(true);
  });

  it("matches with extra whitespace", () => {
    expect(isAnswerCorrect("  docker   ps  ", { answer: "docker ps" })).toBe(true);
  });

  it("rejects wrong answer", () => {
    expect(isAnswerCorrect("docker images", { answer: "docker ps" })).toBe(false);
  });

  it("matches against accepted_answers when provided", () => {
    const step = { answer: "docker ps", accepted_answers: ["docker ps", "docker container ls"] };
    expect(isAnswerCorrect("docker container ls", step)).toBe(true);
  });

  it("falls back to answer field when accepted_answers is empty", () => {
    const step = { answer: "docker ps", accepted_answers: [] as string[] };
    expect(isAnswerCorrect("docker ps", step)).toBe(true);
    expect(isAnswerCorrect("docker container ls", step)).toBe(false);
  });

  it("normalizes accepted_answers too", () => {
    const step = { answer: "git add .", accepted_answers: ["git add .", "git add -A"] };
    expect(isAnswerCorrect("GIT ADD -a", step)).toBe(true);
  });
});

describe("buildSuccessText", () => {
  it("returns step progress for multi-step questions mid-flow", () => {
    expect(buildSuccessText(1, 3)).toBe("step 1/3 complete");
    expect(buildSuccessText(2, 3)).toBe("step 2/3 complete");
  });

  it("returns 'command accepted' for the final step", () => {
    expect(buildSuccessText(3, 3)).toBe("command accepted");
  });

  it("returns 'command accepted' for single-step questions", () => {
    expect(buildSuccessText(1, 1)).toBe("command accepted");
  });
});
