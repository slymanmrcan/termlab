import { useEffect, useRef } from "react";
import {
  LEVELS,
  type QuizLevel,
  type QuizQuestion,
  type QuizStep,
  type QuizTopic,
  type TerminalLine,
} from "../types/quiz";

interface TerminalProps {
  className?: string;
  level: QuizLevel;
  topic: QuizTopic;
  totalQuestions: number;
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
  totalQuestions,
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
  const shellLocation = `~/${topic}`;

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
      className={`flex min-h-[24rem] flex-col overflow-hidden rounded-[1.25rem] border border-emerald-400/10 bg-[linear-gradient(180deg,rgba(13,17,20,0.96),rgba(10,13,16,0.95))] shadow-[0_18px_50px_rgba(0,0,0,0.2)] sm:min-h-[27rem] ${className ?? ""}`}
    >
      {/* Level selector */}
      <div className="rounded-t-[1.25rem] border-b border-white/[0.05] bg-[linear-gradient(180deg,rgba(10,13,16,0.7),rgba(7,10,12,0.65))] px-3 py-2 sm:px-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[0.55rem] uppercase tracking-[0.22em] text-zinc-500">
            level
          </span>
          <div className="h-px flex-1 bg-white/[0.06]" />
          <div className="flex gap-1 font-mono">
            {LEVELS.map((currentLevel) => {
              const active = currentLevel === level;
              return (
                <button
                  key={currentLevel}
                  type="button"
                  onClick={() => onLevelChange(currentLevel)}
                  className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[0.64rem] transition-all duration-150 ${
                    active
                      ? "border-emerald-400/35 bg-emerald-400/12 text-emerald-100 shadow-[0_0_10px_rgba(52,211,153,0.08)]"
                      : "border-white/[0.07] bg-slate-950/20 text-zinc-400 hover:border-sky-300/10 hover:text-zinc-200"
                  }`}
                >
                  [{currentLevel}]
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Output area */}
      <div
        ref={outputRef}
        className="flex-1 space-y-4 overflow-y-auto px-5 py-4 font-mono text-sm text-emerald-100/90 sm:px-6"
      >
        {isLoading ? (
          <div className="space-y-2">
            <p className="text-[0.64rem] uppercase tracking-[0.22em] text-zinc-500">
              loading dataset
            </p>
            <p className="leading-7 text-zinc-400">
              Quiz files are being loaded from{" "}
              <span className="text-zinc-300">`src/data/`</span>.
            </p>
          </div>
        ) : loadError ? (
          <div className="space-y-2">
            <p className="text-[0.64rem] uppercase tracking-[0.22em] text-rose-500">
              dataset load failed
            </p>
            <p className="leading-7 text-zinc-400">{loadError}</p>
          </div>
        ) : finished ? (
          <div className="space-y-3">
            <p className="text-[0.64rem] uppercase tracking-[0.22em] text-zinc-500">
              session complete
            </p>
            <div className="rounded-[0.85rem] border border-emerald-500/15 bg-emerald-500/5 p-4">
              <p className="text-base text-emerald-300">
                Final score:{" "}
                <span className="rounded bg-emerald-400/15 px-1.5 py-0.5 text-[0.8rem] text-emerald-400">
                  {score}/{totalQuestions}
                </span>
              </p>
              <p className="mt-1.5 text-[0.8rem] leading-6 text-zinc-400">
                Shuffle a fresh run and try to beat your clean streak.
              </p>
            </div>
            <button
              type="button"
              onClick={onRestart}
              className="flex items-center gap-1.5 rounded-md border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[0.64rem] text-emerald-200 transition-all duration-150 hover:border-emerald-400/40 hover:bg-emerald-400/15"
            >
              [restart session]
            </button>
          </div>
        ) : isEmpty ? (
          <div className="space-y-2">
            <p className="text-[0.64rem] uppercase tracking-[0.22em] text-zinc-500">
              no questions loaded
            </p>
            <p className="leading-7 text-zinc-400">
              This topic does not have quiz data yet. Add JSON files under{" "}
              <span className="text-zinc-300">`src/data/`</span> and the app
              will merge them automatically.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <p className="max-w-4xl text-[1.05rem] leading-8 text-zinc-200">
                {currentQuestion?.scenario}
              </p>

              {hintMessage ? (
                <p className="flex flex-wrap items-baseline gap-2 text-sm leading-7">
                  <span className="rounded border border-amber-400/15 bg-amber-400/10 px-1.5 py-0.5 text-[0.58rem] uppercase tracking-[0.18em] text-amber-400/80">
                    hint
                  </span>
                  <span className="text-amber-200/90">{hintMessage}</span>
                </p>
              ) : null}

              {showAnswer && currentStep?.answer ? (
                <p className="flex flex-wrap items-baseline gap-2 text-sm leading-7">
                  <span className="rounded border border-emerald-400/15 bg-emerald-400/10 px-1.5 py-0.5 text-[0.58rem] uppercase tracking-[0.18em] text-emerald-400/80">
                    answer
                  </span>
                  <span className="text-emerald-200/90">{currentStep.answer}</span>
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5" aria-live="polite">
              {transcript.map((line) => {
                if (line.kind === "command") {
                  return (
                    <p key={line.id} className="break-words leading-7 text-zinc-200">
                      <span className="text-zinc-500">{shellLocation}</span>
                      <span className="mx-2 text-emerald-400">$</span>
                      {line.text}
                    </p>
                  );
                }
                return (
                  <p
                    key={line.id}
                    className={`break-words leading-7 ${
                      line.kind === "output"
                        ? "text-emerald-300/90"
                        : line.kind === "skip"
                          ? "text-amber-200/80"
                          : "text-rose-300/90"
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

      {/* Input */}
      {!finished && !isEmpty && !isLoading && !loadError ? (
        <div className="border-t border-white/[0.05]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }}
            className="px-5 py-3 sm:px-6"
          >
            <label className="flex flex-wrap items-center gap-2 font-mono text-sm">
              <span className="text-zinc-500">{shellLocation}</span>
              <span className="text-emerald-400">$</span>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => onInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Tab") {
                    e.preventDefault();
                    onCycleTopic();
                  }
                }}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                disabled={isAdvancing}
                className="min-w-[200px] flex-1 bg-transparent text-zinc-100 caret-emerald-400 outline-none placeholder:text-zinc-700 disabled:cursor-wait"
                placeholder="Enter command..."
              />
            </label>
          </form>
        </div>
      ) : null}
    </section>
  );
}