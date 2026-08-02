import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createEmptyQuizDataset } from "./quizData";
import { loadQuizTopicData } from "./quizLoader";
import { buildSuccessText, isAnswerCorrect, shuffle } from "./quizUtils";
import { loadPreference, savePreference } from "./storage";
import { LEVELS, TOPICS, type QuizDataset, type QuizLevel, type QuizTopic, type TerminalLine } from "../types/quiz";

const ADVANCE_DELAY = 700;

export function useQuiz() {
  const [dataset, setDataset] = useState<QuizDataset>(createEmptyQuizDataset);
  const [level, setLevel] = useState<QuizLevel>(() => {
    const saved = loadPreference<QuizLevel>("level", "junior");
    return LEVELS.includes(saved) ? saved : "junior";
  });
  const [topic, setTopic] = useState<QuizTopic>(() => {
    const saved = loadPreference<QuizTopic>("topic", "filesystem");
    return TOPICS.includes(saved) ? saved : "filesystem";
  });
  const [sessionSeed, setSessionSeed] = useState(() => Date.now()); ////linepoint
  const [questionIndex, setQuestionIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [input, setInput] = useState("");
  const [hintStage, setHintStage] = useState(0);
  const [transcript, setTranscript] = useState<TerminalLine[]>([]);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const lineIdRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedTopicKeysRef = useRef(new Set<string>());
  const historyRef = useRef<string[]>([]);
  const historyCursorRef = useRef(-1);

  const clearPendingAdvance = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => clearPendingAdvance, [clearPendingAdvance]);

  useEffect(() => {
    savePreference("level", level);
  }, [level]);

  useEffect(() => {
    savePreference("topic", topic);
  }, [topic]);

  useEffect(() => {
    let cancelled = false;
    const selectionKey = `${level}:${topic}`;

    if (loadedTopicKeysRef.current.has(selectionKey)) {
      setIsLoading(false);
      setLoadError(null);
      return;
    }

    async function hydrateQuizSelection() {
      try {
        setIsLoading(true);
        setLoadError(null);

        const nextQuestionFile = await loadQuizTopicData(level, topic);

        if (!cancelled) {
          loadedTopicKeysRef.current.add(selectionKey);
          setDataset((currentDataset) => ({
            ...currentDataset,
            [level]: {
              ...currentDataset[level],
              [topic]: nextQuestionFile,
            },
          }));
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        setLoadError(error instanceof Error ? error.message : "Quiz data could not be loaded.");
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void hydrateQuizSelection();

    return () => {
      cancelled = true;
    };
  }, [level, topic]);

  const resetRunState = useCallback(() => {
    clearPendingAdvance();
    lineIdRef.current = 0;
    setQuestionIndex(0);
    setStepIndex(0);
    setScore(0);
    setSkipped(0);
    setWrongAttempts(0);
    setInput("");
    setHintStage(0);
    setTranscript([]);
    setIsAdvancing(false);
  }, [clearPendingAdvance]);

  /////linebreak 2
  const questionSet = useMemo(() => {
    return shuffle(dataset[level][topic].questions, `${level}:${topic}:${sessionSeed}`);
  }, [dataset, level, topic, sessionSeed]);

  const totalQuestions = questionSet.length;
  const finished = totalQuestions > 0 && questionIndex >= totalQuestions;
  const currentQuestion = finished ? null : questionSet[questionIndex] ?? null;
  const currentStep = currentQuestion?.steps[stepIndex] ?? null;
  const sessionClockKey = `${level}:${topic}:${sessionSeed}`;
  const questionClockKey = `${level}:${topic}:${sessionSeed}:${questionIndex}`;
  const questionCursorKey = currentQuestion && currentStep
    ? `${level}:${topic}:${sessionSeed}:${questionIndex}:${stepIndex}:${currentStep.answer}`
    : null;

  const hintMessage =
    hintStage === 1
      ? currentStep?.hint_text ?? null
      : hintStage >= 2
        ? currentStep?.hint_partial ?? null
        : null;

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

    historyRef.current.push(submittedValue);
    historyCursorRef.current = -1;

    const baseLineId = lineIdRef.current;
    lineIdRef.current += 2;

    if (isAnswerCorrect(submittedValue, currentStep)) {
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
    setWrongAttempts((current) => current + 1);
  }, [currentQuestion, currentStep, input, isAdvancing, scheduleAdvance, stepIndex]);

  const historyUp = useCallback(() => {
    const history = historyRef.current;

    if (history.length === 0) {
      return;
    }

    const nextCursor = historyCursorRef.current === -1 ? history.length - 1 : Math.max(0, historyCursorRef.current - 1);
    historyCursorRef.current = nextCursor;
    setInput(history[nextCursor]);
  }, []);

  const historyDown = useCallback(() => {
    if (historyCursorRef.current === -1) {
      return;
    }

    const nextCursor = historyCursorRef.current + 1;

    if (nextCursor >= historyRef.current.length) {
      historyCursorRef.current = -1;
      setInput("");
      return;
    }

    historyCursorRef.current = nextCursor;
    setInput(historyRef.current[nextCursor]);
  }, []);

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
    setSkipped((current) => current + 1);
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

  const selectionKey = `${level}:${topic}`;
  const selectionLoaded = loadedTopicKeysRef.current.has(selectionKey);
  const displayLoading = isLoading || (!selectionLoaded && !loadError);

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
    historyUp,
    historyDown,
    transcript,
    currentQuestion,
    currentStep,
    hintMessage,
    hintStage,
    isAdvancing,
    isLoading: displayLoading,
    loadError,
    finished,
    isEmpty: !displayLoading && !loadError && totalQuestions === 0,
    score,
    skipped,
    wrongAttempts,
    totalQuestions,
    progressCurrent: totalQuestions === 0 ? 0 : finished ? totalQuestions : questionIndex + 1,
    questionNumber: questionIndex + 1,
    stepNumber: stepIndex + 1,
    sessionClockKey,
    questionClockKey,
    questionCursorKey,
  };
}
