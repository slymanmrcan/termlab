import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createEmptyQuizDataset } from "./quizData";
import { loadQuizData } from "./quizLoader";
import { TOPICS, type QuizDataset, type QuizLevel, type QuizTopic, type TerminalLine } from "../types/quiz";

const ADVANCE_DELAY = 700;

function hashSeed(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash || 1;
}

function shuffle<T>(items: T[], seedSource: string) {
  const copy = [...items];
  let seed = hashSeed(seedSource);

  for (let index = copy.length - 1; index > 0; index -= 1) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const swapIndex = seed % (index + 1);
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

function normalizeAnswer(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function buildSuccessText(stepNumber: number, totalSteps: number) {
  if (totalSteps > 1 && stepNumber < totalSteps) {
    return `step ${stepNumber}/${totalSteps} complete`;
  }

  return "command accepted";
}

export function useQuiz() {
  const [dataset, setDataset] = useState<QuizDataset>(createEmptyQuizDataset);
  const [level, setLevel] = useState<QuizLevel>("junior");
  const [topic, setTopic] = useState<QuizTopic>("filesystem");
  const [sessionSeed, setSessionSeed] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [input, setInput] = useState("");
  const [hintStage, setHintStage] = useState(0);
  const [transcript, setTranscript] = useState<TerminalLine[]>([]);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const lineIdRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPendingAdvance = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => clearPendingAdvance, [clearPendingAdvance]);

  useEffect(() => {
    let cancelled = false;

    async function hydrateQuiz() {
      try {
        setIsLoading(true);
        setLoadError(null);

        const nextDataset = await loadQuizData();

        if (!cancelled) {
          setDataset(nextDataset);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        setDataset(createEmptyQuizDataset());
        setLoadError(error instanceof Error ? error.message : "Quiz data could not be loaded.");
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void hydrateQuiz();

    return () => {
      cancelled = true;
    };
  }, []);

  const resetRunState = useCallback(() => {
    clearPendingAdvance();
    lineIdRef.current = 0;
    setQuestionIndex(0);
    setStepIndex(0);
    setScore(0);
    setInput("");
    setHintStage(0);
    setTranscript([]);
    setIsAdvancing(false);
  }, [clearPendingAdvance]);

  const questionSet = useMemo(() => {
    return shuffle(dataset[level][topic].questions, `${level}:${topic}:${sessionSeed}`);
  }, [dataset, level, topic, sessionSeed]);

  const totalQuestions = questionSet.length;
  const finished = totalQuestions > 0 && questionIndex >= totalQuestions;
  const currentQuestion = finished ? null : questionSet[questionIndex] ?? null;
  const currentStep = currentQuestion?.steps[stepIndex] ?? null;
  const questionCursorKey = currentQuestion && currentStep
    ? `${level}:${topic}:${sessionSeed}:${questionIndex}:${stepIndex}:${currentStep.answer}`
    : null;

  const hintMessage =
    hintStage === 1
      ? currentStep?.hint_text ?? null
      : hintStage >= 2
        ? currentStep?.hint_partial ?? null
        : null;

  const topicCounts = useMemo(
    () =>
      TOPICS.reduce<Record<QuizTopic, number>>((counts, currentTopic) => {
        counts[currentTopic] = dataset[level][currentTopic].questions.length;
        return counts;
      }, {} as Record<QuizTopic, number>),
    [dataset, level],
  );

  const scheduleAdvance = useCallback(
    (mode: "step" | "question") => {
      setIsAdvancing(true);
      clearPendingAdvance();

      timerRef.current = setTimeout(() => {
        timerRef.current = null;

        if (mode === "step") {
          setStepIndex((value) => value + 1);
          setHintStage(0);
          setInput("");
          setIsAdvancing(false);
          return;
        }

        setQuestionIndex((value) => value + 1);
        setStepIndex(0);
        setHintStage(0);
        setInput("");
        setTranscript([]);
        setIsAdvancing(false);
      }, ADVANCE_DELAY);
    },
    [clearPendingAdvance],
  );

  const submitAnswer = useCallback(() => {
    if (!currentQuestion || !currentStep || isAdvancing) {
      return;
    }

    const submittedValue = input.trim();

    if (!submittedValue) {
      return;
    }

    const baseLineId = lineIdRef.current;
    lineIdRef.current += 2;

    if (normalizeAnswer(submittedValue) === normalizeAnswer(currentStep.answer)) {
      const isQuestionComplete = stepIndex === currentQuestion.steps.length - 1;

      setTranscript((currentTranscript) => [
        ...currentTranscript,
        { id: baseLineId + 1, kind: "command", prompt: currentStep.prompt, text: submittedValue },
        {
          id: baseLineId + 2,
          kind: "output",
          text: buildSuccessText(stepIndex + 1, currentQuestion.steps.length),
        },
      ]);

      setInput("");

      if (isQuestionComplete) {
        setScore((currentScore) => currentScore + 1);
      }

      scheduleAdvance(isQuestionComplete ? "question" : "step");
      return;
    }

    setTranscript((currentTranscript) => [
      ...currentTranscript,
      { id: baseLineId + 1, kind: "command", prompt: currentStep.prompt, text: submittedValue },
      {
        id: baseLineId + 2,
        kind: "error",
        text: "bash: command not found - try again",
      },
    ]);
    setInput("");
  }, [currentQuestion, currentStep, input, isAdvancing, scheduleAdvance, stepIndex]);

  const skipQuestion = useCallback(() => {
    if (!currentStep || isAdvancing) {
      return;
    }

    const lineId = lineIdRef.current + 1;
    lineIdRef.current += 1;

    setTranscript((currentTranscript) => [
      ...currentTranscript,
      {
        id: lineId,
        kind: "skip",
        text: `answer: ${currentStep.answer}`,
      },
    ]);

    scheduleAdvance("question");
  }, [currentStep, isAdvancing, scheduleAdvance]);

  const revealHint = useCallback(() => {
    if (!currentStep) {
      return;
    }

    setHintStage((currentStage) => Math.min(currentStage + 1, 2));
  }, [currentStep]);

  const cycleTopic = useCallback(() => {
    resetRunState();
    setTopic((currentTopic) => {
      const currentIndex = TOPICS.indexOf(currentTopic);
      return TOPICS[(currentIndex + 1) % TOPICS.length];
    });
  }, [resetRunState]);

  const changeLevel = useCallback(
    (nextLevel: QuizLevel) => {
      resetRunState();
      setLevel(nextLevel);
    },
    [resetRunState],
  );

  const changeTopic = useCallback(
    (nextTopic: QuizTopic) => {
      resetRunState();
      setTopic(nextTopic);
    },
    [resetRunState],
  );

  const restartSession = useCallback(() => {
    resetRunState();
    setSessionSeed((currentSeed) => currentSeed + 1);
  }, [resetRunState]);

  return {
    level,
    topic,
    setLevel: changeLevel,
    setTopic: changeTopic,
    cycleTopic,
    restartSession,
    input,
    setInput,
    submitAnswer,
    skipQuestion,
    revealHint,
    transcript,
    currentQuestion,
    currentStep,
    hintMessage,
    hintStage,
    isAdvancing,
    isLoading,
    loadError,
    finished,
    isEmpty: !isLoading && !loadError && totalQuestions === 0,
    score,
    totalQuestions,
    progressCurrent: totalQuestions === 0 ? 0 : finished ? totalQuestions : questionIndex + 1,
    questionNumber: questionIndex + 1,
    stepNumber: stepIndex + 1,
    questionCursorKey,
    topicCounts,
  };
}
