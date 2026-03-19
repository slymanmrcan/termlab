import { useEffect, useRef } from "react";
import { LEVELS, type QuizLevel, type QuizQuestion, type QuizStep, type QuizTopic, type TerminalLine } from "../types/quiz";

interface TerminalProps {
  className?: string;
  level: QuizLevel;
  topic: QuizTopic;
  questionNumber: number;
  totalQuestions: number;
  stepNumber: number;
  currentQuestion: QuizQuestion | null;
  currentStep: QuizStep | null;
  transcript: TerminalLine[];
  input: string;
  onInputChange: (value: string) => void;
  onLevelChange: (level: QuizLevel) => void;
  onSubmit: () => void;
  onCycleTopic: () => void;
  hintMessage: string | null;
  isAdvancing: boolean;
  isLoading: boolean;
  loadError: string | null;
  finished: boolean;
  isEmpty: boolean;
  score: number;
  onRestart: () => void;
  showAnswer: boolean;
}

export function Terminal({
  className,
  level,
  topic,
  questionNumber,
  totalQuestions,
  stepNumber,
  currentQuestion,
  currentStep,
  transcript,
  input,
  onInputChange,
  onLevelChange,
  onSubmit,
  onCycleTopic,
  hintMessage,
  isAdvancing,
  isLoading,
  loadError,
  finished,
  isEmpty,
  score,
  onRestart,
  showAnswer,
}: TerminalProps) {
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    outputRef.current?.scrollTo({
      top: outputRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [transcript, hintMessage, finished]);

  useEffect(() => {
    if (!finished && !isEmpty && !isLoading && !loadError) {
      inputRef.current?.focus();
    }
  }, [finished, isEmpty, isLoading, loadError, currentQuestion, currentStep]);

  return (
    <section
      className={`terminal-shell overflow-hidden rounded-[2rem] border border-emerald-500/20 bg-black shadow-[0_0_80px_rgba(16,185,129,0.09)] ${className ?? ""}`}
    >
      <div className="flex flex-col gap-3 border-b border-emerald-500/10 bg-zinc-950/90 px-5 py-3 font-mono text-[0.72rem] uppercase tracking-[0.28em] text-zinc-500 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <div className="hidden sm:block" />

        <div className="flex flex-wrap justify-center gap-2 font-mono text-sm normal-case tracking-normal">
          {LEVELS.map((currentLevel) => {
            const active = currentLevel === level;

            return (
              <button
                key={currentLevel}
                type="button"
                onClick={() => onLevelChange(currentLevel)}
                className={`rounded-full border px-4 py-2 transition ${
                  active
                    ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-200"
                    : "border-zinc-800 bg-black/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                }`}
              >
                [{currentLevel}]
              </button>
            );
          })}
        </div>

        <span className="justify-self-end text-center sm:text-right">{topic}</span>
      </div>

      <div
        ref={outputRef}
        className="terminal-grid space-y-6 overflow-y-auto px-5 py-5 font-mono text-sm text-emerald-200 sm:px-6 sm:py-6"
      >
        {isLoading ? (
          <div className="space-y-4">
            <p className="text-zinc-500">loading dataset</p>
            <p className="max-w-2xl leading-7 text-zinc-400">Quiz files are being loaded from `src/data/`.</p>
          </div>
        ) : loadError ? (
          <div className="space-y-4">
            <p className="text-rose-400">dataset load failed</p>
            <p className="max-w-2xl leading-7 text-zinc-400">{loadError}</p>
          </div>
        ) : finished ? (
          <div className="space-y-4">
            <p className="text-zinc-500">session complete</p>
            <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-5">
              <p className="text-lg text-emerald-300">Final score: {score}/{totalQuestions}</p>
              <p className="mt-2 text-sm leading-7 text-zinc-400">
                Shuffle a fresh run and try to beat your clean streak.
              </p>
            </div>
            <button
              type="button"
              onClick={onRestart}
              className="rounded-full border border-emerald-500/30 px-4 py-2 text-sm text-emerald-200 transition hover:border-emerald-400/60"
            >
              restart session
            </button>
          </div>
        ) : isEmpty ? (
          <div className="space-y-4">
            <p className="text-zinc-500">no questions loaded</p>
            <p className="max-w-2xl leading-7 text-zinc-400">
              This topic does not have quiz data yet. Add JSON files under `src/data/` and the app will merge them
              automatically.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-[1.6rem] border border-zinc-800 bg-zinc-950/60 p-5">
              <div className="flex flex-wrap items-center gap-3 text-[0.72rem] uppercase tracking-[0.24em] text-zinc-500">
                <span>
                  question {questionNumber}/{totalQuestions}
                </span>
                <span>{currentQuestion?.type}</span>
                {currentQuestion && currentQuestion.steps.length > 1 ? (
                  <span>
                    step {stepNumber}/{currentQuestion.steps.length}
                  </span>
                ) : null}
              </div>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-400 sm:text-base">{currentQuestion?.scenario}</p>

              {hintMessage ? <p className="mt-4 text-sm text-amber-300">hint: {hintMessage}</p> : null}

              {showAnswer && currentStep?.answer ? (
                <p className="mt-4 border-t border-zinc-800 pt-3 text-sm text-emerald-300/70">
                  <span className="text-zinc-600">answer: </span>
                  {currentStep.answer}
                </p>
              ) : null}
            </div>

            <div className="space-y-2" aria-live="polite">
              {transcript.map((line) => {
                if (line.kind === "command") {
                  return (
                    <p key={line.id} className="break-words leading-7 text-zinc-200">
                      <span className="text-zinc-500">{line.prompt}</span>
                      {line.text}
                    </p>
                  );
                }

                return (
                  <p
                    key={line.id}
                    className={`break-words leading-7 ${
                      line.kind === "output"
                        ? "text-emerald-400"
                        : line.kind === "skip"
                          ? "text-amber-300"
                          : "text-rose-400"
                    }`}
                  >
                    {line.text}
                  </p>
                );
              })}
            </div>
          </>
        )}
      </div>

      {!finished && !isEmpty && !isLoading && !loadError ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
          className="border-t border-emerald-500/10 bg-zinc-950/90 px-5 py-4"
        >
          <label className="flex items-center gap-3 font-mono text-sm text-zinc-200">
            <span className="text-emerald-400">&gt;</span>
            <input
              ref={inputRef}
              value={input}
              onChange={(event) => onInputChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Tab") {
                  event.preventDefault();
                  onCycleTopic();
                }
              }}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              disabled={isAdvancing}
              className="min-w-0 flex-1 bg-transparent text-emerald-200 outline-none placeholder:text-zinc-700 disabled:cursor-wait"
              placeholder={currentStep?.prompt ?? "$ "}
            />
            <span className="min-w-0 flex-1 bg-transparent text-emerald-200 outline-none placeholder:text-zinc-700 disabled:cursor-wait caret-transparent" />
          </label>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.72rem] text-zinc-500">
            <span>shortcuts:</span>
            <span>. answer</span>
            <span>, hint</span>
            <span>tab topic</span>
          </div>
          <p className="mt-2 text-[0.72rem] text-zinc-600">Skip sadece butondan calisir. Kisayollar input bosken aktif olur.</p>
        </form>
      ) : null}
    </section>
  );
}
