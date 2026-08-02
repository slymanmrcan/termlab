export function hashSeed(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash || 1;
}

export function shuffle<T>(items: T[], seedSource: string) {
  const copy = [...items];
  let seed = hashSeed(seedSource);

  for (let index = copy.length - 1; index > 0; index -= 1) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const swapIndex = seed % (index + 1);
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

export function normalizeAnswer(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function isAnswerCorrect(submitted: string, step: { answer: string; accepted_answers?: string[] }) {
  const normalizedSubmitted = normalizeAnswer(submitted);
  const candidates = step.accepted_answers?.length ? step.accepted_answers : [step.answer];

  return candidates.some((candidate) => normalizeAnswer(candidate) === normalizedSubmitted);
}

export function buildSuccessText(stepNumber: number, totalSteps: number) {
  if (totalSteps > 1 && stepNumber < totalSteps) {
    return `step ${stepNumber}/${totalSteps} complete`;
  }

  return "command accepted";
}
