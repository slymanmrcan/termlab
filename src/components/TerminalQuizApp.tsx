import { useMemo, useCallback, useEffect, useState } from "react";
import { BottomBar } from "./BottomBar";
import { Header } from "./Header";
import { Terminal } from "./Terminal";
import { useQuiz } from "../lib/useQuiz";

export function TerminalQuizApp() {
  const quiz = useQuiz();
  const [revealedQuestionNumber, setRevealedQuestionNumber] = useState<number | null>(null);
  const showAnswer = revealedQuestionNumber === quiz.questionNumber;

  // 1. Uzun boolean zincirini bir yere topla
  const isDisabled = useMemo(
    () =>
      quiz.finished ||
      quiz.isEmpty ||
      quiz.isAdvancing ||
      quiz.isLoading ||
      Boolean(quiz.loadError),
    [quiz.finished, quiz.isEmpty, quiz.isAdvancing, quiz.isLoading, quiz.loadError]
  );

  // 2. Klavye kısayolları
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isDisabled) return;
      // Input odaklanmışsa kısayolları tetikleme
      if (document.activeElement?.tagName === "INPUT") return;

      if (e.key === "h") quiz.revealHint();
      if (e.key === "s") quiz.skipQuestion();
      if (e.key === " ") {
        e.preventDefault();
        setRevealedQuestionNumber((currentValue) => (currentValue === quiz.questionNumber ? null : quiz.questionNumber));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDisabled, quiz]);

  const toggleAnswer = useCallback(
    () => setRevealedQuestionNumber((currentValue) => (currentValue === quiz.questionNumber ? null : quiz.questionNumber)),
    [quiz.questionNumber]
  );

  return (
    // 4. aria-live: soru değişince ekran okuyucular duyursun
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

        {/* 5. Terminal artık layout içinde, flex-1 ile kalan alanı doldurur */}
        <Terminal
          level={quiz.level}
          topic={quiz.topic}
          questionNumber={quiz.questionNumber}
          totalQuestions={quiz.totalQuestions}
          stepNumber={quiz.stepNumber}
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
          onHint={quiz.revealHint}
          onSkip={quiz.skipQuestion}
          onToggleAnswer={toggleAnswer}
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
