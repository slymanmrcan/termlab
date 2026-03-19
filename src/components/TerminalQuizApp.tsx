import { useMemo, useCallback, useEffect, useState } from "react";
import { BottomBar } from "./BottomBar";
import { Header } from "./Header";
import { Terminal } from "./Terminal";
import { useQuiz } from "../lib/useQuiz";

export function TerminalQuizApp() {
  const quiz = useQuiz();
  const [revealedCursorKey, setRevealedCursorKey] = useState<string | null>(null);
  const showAnswer = quiz.questionCursorKey !== null && revealedCursorKey === quiz.questionCursorKey;

  const toggleAnswer = useCallback(
    () =>
      setRevealedCursorKey((currentValue) =>
        currentValue === quiz.questionCursorKey ? null : quiz.questionCursorKey,
      ),
    [quiz.questionCursorKey]
  );

  const isDisabled = useMemo(
    () =>
      quiz.finished ||
      quiz.isEmpty ||
      quiz.isAdvancing ||
      quiz.isLoading ||
      Boolean(quiz.loadError),
    [quiz.finished, quiz.isEmpty, quiz.isAdvancing, quiz.isLoading, quiz.loadError]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isDisabled) return;

      const inputFocused = document.activeElement?.tagName === "INPUT";
      const isPlainShortcut = !e.ctrlKey && !e.metaKey && !e.altKey;

      if (!isPlainShortcut) {
        return;
      }

      if (![".", ","].includes(e.key)) {
        return;
      }

      if (inputFocused && quiz.input.length > 0) {
        return;
      }

      e.preventDefault();

      if (e.key === ".") {
        toggleAnswer();
        return;
      }

      if (e.key === ",") {
        quiz.revealHint();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDisabled, quiz, toggleAnswer]);

  return (
    <main
      className="min-h-screen bg-background px-4 py-4 text-foreground sm:px-6 lg:px-8"
      aria-live="polite"
      aria-atomic="false"
    >
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-6xl flex-col gap-3">
        <Header
          topic={quiz.topic}
          onTopicChange={quiz.setTopic}
          topicCounts={quiz.topicCounts}
        />

        <Terminal
          level={quiz.level}
          topic={quiz.topic}
          totalQuestions={quiz.totalQuestions}
          currentQuestion={quiz.currentQuestion}
          currentStep={quiz.currentStep}
          transcript={quiz.transcript}
          input={quiz.input}
          onInputChange={quiz.setInput}
          onLevelChange={quiz.setLevel}
          onSubmit={quiz.submitAnswer}
          onCycleTopic={quiz.cycleTopic}
          hintMessage={quiz.hintMessage}
          isAdvancing={quiz.isAdvancing}
          isLoading={quiz.isLoading}
          loadError={quiz.loadError}
          finished={quiz.finished}
          isEmpty={quiz.isEmpty}
          score={quiz.score}
          onRestart={quiz.restartSession}
          showAnswer={showAnswer}
        />

        <BottomBar
          key={quiz.questionClockKey}
          onHint={quiz.revealHint}
          onSkip={quiz.skipQuestion}
          onToggleAnswer={toggleAnswer}
          timerRunning={!quiz.finished && !quiz.isLoading && !quiz.isEmpty && !quiz.loadError}
          progressCurrent={quiz.progressCurrent}
          progressTotal={quiz.totalQuestions}
          score={quiz.score}
          hintStage={quiz.hintStage}
          showAnswer={showAnswer}
          disabled={isDisabled}
        />
      </div>
    </main>
  );
}
