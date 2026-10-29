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
  onHistoryUp: () => void;
  onHistoryDown: () => void;
  hintMessage: string | null;
  isAdvancing: boolean;
  isLoading: boolean;
  loadError: string | null;
  finished: boolean;
  isEmpty: boolean;
  score: number;
  skipped: number;
  wrongAttempts: number;
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
  onHistoryUp,
  onHistoryDown,
  hintMessage,
  isAdvancing,
  isLoading,
  loadError,
  finished,
  isEmpty,
  score,
  skipped,
  wrongAttempts,
  onRestart,
  showAnswer,
}: TerminalProps) {
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const shellLocation = `devops@termlab:~/${topic}`;

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

  const handleContainerClick = () => {
    if (!finished && !isEmpty && !isLoading && !loadError) {
      inputRef.current?.focus();
    }
  };

  const accuracyPercentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  const getRankBadge = (percentage: number) => {
    if (percentage === 100) return { title: "Terminal Master", color: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10" };
    if (percentage >= 80) return { title: "Senior Engineer", color: "text-emerald-300 border-emerald-500/30 bg-emerald-500/10" };
    if (percentage >= 60) return { title: "Mid DevOps Engineer", color: "text-amber-300 border-amber-500/30 bg-amber-500/10" };
    return { title: "Junior Practitioner", color: "text-sky-300 border-sky-500/30 bg-sky-500/10" };
  };

  const rank = getRankBadge(accuracyPercentage);

  return (
    <section
      onClick={handleContainerClick}
      className={`terminal-shell flex min-h-[26rem] flex-col overflow-hidden rounded-[1.25rem] border border-emerald-500/20 bg-slate-950/90 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:min-h-[29rem] ${className ?? ""}`}
    >
      {/* Terminal Header Bar with Window Dots & Level Selector */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-slate-900/80 px-4 py-2.5 backdrop-blur-md">
        {/* macOS Style Window Control Dots */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-rose-500/80 hover:bg-rose-500 transition-colors" />
            <div className="h-3 w-3 rounded-full bg-amber-500/80 hover:bg-amber-500 transition-colors" />
            <div className="h-3 w-3 rounded-full bg-emerald-500/80 hover:bg-emerald-500 transition-colors" />
          </div>
          <span className="ml-2 hidden font-mono text-[0.7rem] text-zinc-400 sm:inline">
            {shellLocation}
          </span>
        </div>

        {/* Level Switcher Pills */}
        <div className="flex items-center gap-1.5 font-mono">
          <span className="hidden text-[0.6rem] uppercase tracking-wider text-zinc-500 sm:inline">
            LEVEL:
          </span>
          <div className="flex gap-1 rounded-lg border border-white/5 bg-slate-950/60 p-0.5">
            {LEVELS.map((currentLevel) => {
              const active = currentLevel === level;
              return (
                <button
                  key={currentLevel}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onLevelChange(currentLevel);
                  }}
                  className={`rounded-md px-2.5 py-1 text-[0.65rem] font-medium transition-all duration-150 ${
                    active
                      ? "border border-emerald-500/40 bg-emerald-500/20 text-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-slate-900"
                  }`}
                >
                  {currentLevel}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Terminal Output Stream */}
      <div
        ref={outputRef}
        className="flex-1 space-y-4 overflow-y-auto p-4 font-mono text-sm text-emerald-100/90 sm:p-6"
      >
        {isLoading ? (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-emerald-300">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
            </span>
            <div>
              <p className="font-semibold text-xs tracking-wider uppercase">Loading Topic Data...</p>
              <p className="text-xs text-zinc-400">Loading dataset for topic: <span className="text-emerald-400 font-bold">{topic}</span></p>
            </div>
          </div>
        ) : loadError ? (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-300">
            <p className="font-semibold text-xs uppercase tracking-wider text-rose-400">Dataset Load Failed</p>
            <p className="mt-1 text-xs text-zinc-300">{loadError}</p>
          </div>
        ) : finished ? (
          /* Completion Summary Dashboard */
          <div className="mx-auto max-w-xl space-y-4 py-4">
            <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-6 text-center shadow-2xl backdrop-blur-xl">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/40 bg-emerald-500/10 text-2xl font-bold text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.25)]">
                {accuracyPercentage}%
              </div>

              <span className={`inline-block rounded-full border px-3 py-1 font-mono text-xs font-semibold ${rank.color}`}>
                🏆 {rank.title}
              </span>

              <h2 className="mt-3 font-mono text-xl font-bold text-zinc-100">
                Session Complete!
              </h2>
              <p className="mt-1 text-xs text-zinc-400">
                Great job completing the <span className="text-emerald-400 uppercase font-semibold">{topic}</span> scenario challenge.
              </p>

              {/* Stats Grid */}
              <div className="mt-6 grid grid-cols-3 gap-2 text-center font-mono">
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <p className="text-xs text-zinc-400">Score</p>
                  <p className="text-lg font-bold text-emerald-400">{score}/{totalQuestions}</p>
                </div>
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                  <p className="text-xs text-zinc-400">Skipped</p>
                  <p className="text-lg font-bold text-amber-400">{skipped}</p>
                </div>
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3">
                  <p className="text-xs text-zinc-400">Errors</p>
                  <p className="text-lg font-bold text-rose-400">{wrongAttempts}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRestart();
                }}
                className="mt-6 inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/20 px-5 py-2.5 font-mono text-xs font-semibold text-emerald-200 transition-all duration-200 hover:border-emerald-400 hover:bg-emerald-500/30 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95"
              >
                <span>🔄 Restart Session</span>
              </button>
            </div>
          </div>
        ) : isEmpty ? (
          <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4 text-zinc-400">
            <p className="text-xs uppercase tracking-wider text-amber-400 font-semibold">No Questions Available</p>
            <p className="mt-1 text-xs text-zinc-400">No questions found for this level and topic combination.</p>
          </div>
        ) : (
          <>
            {/* Active Question Scenario Card */}
            {currentQuestion ? (
              <div className="rounded-xl border border-emerald-500/20 bg-slate-900/70 p-4 shadow-lg backdrop-blur-md">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[0.65rem] font-bold text-emerald-400 uppercase tracking-wider">
                      TASK #{currentQuestion.id}
                    </span>
                    <span className="rounded border border-white/10 bg-slate-950/60 px-2 py-0.5 text-[0.65rem] text-zinc-400">
                      #{topic}
                    </span>
                  </div>
                  <span className="text-[0.65rem] text-zinc-500">
                    Difficulty: <span className="text-amber-400 capitalize">{level}</span>
                  </span>
                </div>

                <p className="text-[0.95rem] leading-relaxed text-zinc-100 font-medium">
                  {currentQuestion.scenario}
                </p>

                {/* Hint Card */}
                {hintMessage ? (
                  <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                    <span className="rounded bg-amber-500/20 px-1.5 py-0.5 font-bold uppercase text-amber-400 text-[0.6rem] tracking-wider">
                      HINT
                    </span>
                    <span className="flex-1 leading-normal">{hintMessage}</span>
                  </div>
                ) : null}

                {/* Show Answer Card */}
                {showAnswer && currentStep?.answer ? (
                  <div className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200">
                    <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 font-bold uppercase text-emerald-400 text-[0.6rem] tracking-wider">
                      ANSWER
                    </span>
                    <code className="flex-1 font-mono font-semibold text-emerald-300">
                      {currentStep.answer}
                    </code>
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Transcript Stream */}
            <div className="mt-4 space-y-2" aria-live="polite">
              {transcript.map((line) => {
                if (line.kind === "command") {
                  return (
                    <div key={line.id} className="flex items-center gap-2 text-zinc-200">
                      <span className="text-zinc-500 text-xs">{shellLocation}</span>
                      <span className="text-emerald-400 font-bold">$</span>
                      <span className="font-semibold text-emerald-200">{line.text}</span>
                    </div>
                  );
                }
                return (
                  <div
                    key={line.id}
                    className={`pl-4 border-l-2 text-xs leading-relaxed ${
                      line.kind === "output"
                        ? "border-emerald-500/50 text-emerald-300"
                        : line.kind === "skip"
                          ? "border-amber-500/50 text-amber-300"
                          : "border-rose-500/50 text-rose-300"
                    }`}
                  >
                    {line.text}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Terminal Input Line */}
      {!finished && !isEmpty && !isLoading && !loadError ? (
        <div className="border-t border-white/10 bg-slate-900/90 px-4 py-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }}
          >
            <label className="flex items-center gap-2 font-mono text-sm">
              <span className="text-zinc-500 text-xs sm:inline hidden">{shellLocation}</span>
              <span className="text-emerald-400 font-bold">$</span>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => onInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Tab") {
                    e.preventDefault();
                    onCycleTopic();
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    onHistoryUp();
                  } else if (e.key === "ArrowDown") {
                    e.preventDefault();
                    onHistoryDown();
                  }
                }}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                disabled={isAdvancing}
                className="min-w-[180px] flex-1 bg-transparent text-zinc-100 caret-emerald-400 outline-none placeholder:text-zinc-600 disabled:cursor-wait font-mono text-sm"
                placeholder="Type command and press Enter..."
              />
            </label>
          </form>
        </div>
      ) : null}
    </section>
  );
}
