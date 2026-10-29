import { useEffect, useState } from "react";

function formatElapsed(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

interface BottomBarProps {
  onHint: () => void;
  onSkip: () => void;
  onToggleAnswer: () => void;
  timerRunning: boolean;
  progressCurrent: number;
  progressTotal: number;
  score: number;
  hintStage: number;
  disabled: boolean;
  showAnswer: boolean;
}

export function BottomBar({
  onHint,
  onSkip,
  onToggleAnswer,
  timerRunning,
  progressCurrent,
  progressTotal,
  score,
  hintStage,
  disabled,
  showAnswer,
}: BottomBarProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!timerRunning) return;
    const intervalId = window.setInterval(() => {
      setElapsedSeconds((v) => v + 1);
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [timerRunning]);

  const progressPercentage = progressTotal > 0 ? Math.min(100, Math.round((progressCurrent / progressTotal) * 100)) : 0;

  return (
    <footer className="rounded-[1.25rem] border border-emerald-500/20 bg-slate-950/80 p-3 shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-md sm:p-4">
      {/* Top Bar: Progress Line */}
      <div className="mb-3 space-y-1">
        <div className="flex items-center justify-between font-mono text-[0.65rem] text-zinc-400">
          <span className="flex items-center gap-1">
            <span>Session Progress</span>
            <span className="font-semibold text-emerald-400">({progressPercentage}%)</span>
          </span>
          <span>{progressCurrent} / {progressTotal} Completed</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-900 border border-white/5">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-300 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Main Bar: Actions & Stats */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between font-mono">
        {/* Interactive Action Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={onHint}
            disabled={disabled}
            title="Shortcut: ,"
            className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-200 transition-all duration-150 enabled:hover:border-amber-400 enabled:hover:bg-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>💡 Hint</span>
            <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[0.6rem] font-bold text-amber-300">
              {Math.min(hintStage + 1, 2)}/2
            </span>
            <kbd className="rounded border border-amber-500/30 bg-slate-900/80 px-1 py-0.2 text-[0.6rem] text-amber-400 font-mono">
              ,
            </kbd>
          </button>

          <button
            type="button"
            onClick={onSkip}
            disabled={disabled}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-slate-900/60 px-3 py-1.5 text-xs text-zinc-300 transition-all duration-150 enabled:hover:border-rose-400/40 enabled:hover:bg-rose-500/10 enabled:hover:text-rose-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>⏩ Skip</span>
          </button>

          <button
            type="button"
            onClick={onToggleAnswer}
            disabled={disabled}
            title="Shortcut: ."
            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${
              showAnswer
                ? "border-emerald-400/50 bg-emerald-500/20 text-emerald-100 shadow-[0_0_12px_rgba(16,185,129,0.2)] font-semibold"
                : "border-white/10 bg-slate-900/60 text-zinc-300 enabled:hover:border-emerald-500/30 enabled:hover:bg-emerald-500/10 enabled:hover:text-emerald-200"
            }`}
          >
            <span>{showAnswer ? "🙈 Hide Answer" : "👁️ Show Answer"}</span>
            <kbd className={`rounded border px-1 py-0.2 text-[0.6rem] font-mono ${showAnswer ? "border-emerald-400/40 bg-emerald-900/60 text-emerald-300" : "border-white/10 bg-slate-900/80 text-zinc-400"}`}>
              .
            </kbd>
          </button>
        </div>

        {/* Live Timer & Score Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-300">
            <span>⏱️</span>
            <span>TIME:</span>
            <span className="font-bold font-mono text-emerald-400">{formatElapsed(elapsedSeconds)}</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-slate-900/80 px-2.5 py-1 text-zinc-300">
            <span>⭐</span>
            <span>SCORE:</span>
            <span className="font-bold font-mono text-emerald-400">{score}</span>
          </div>
        </div>
      </div>

      {/* Shortcuts Legend */}
      <div className="mt-3 border-t border-white/5 pt-2.5">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[0.65rem] text-zinc-400 font-mono">
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-white/10 bg-slate-900 px-1.5 py-0.5 text-zinc-300 font-bold">.</kbd>
            <span>Show Answer</span>
          </span>
          <span className="text-white/10">•</span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-white/10 bg-slate-900 px-1.5 py-0.5 text-zinc-300 font-bold">,</kbd>
            <span>Hint</span>
          </span>
          <span className="text-white/10">•</span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-white/10 bg-slate-900 px-1.5 py-0.5 text-zinc-300 font-bold">↑↓</kbd>
            <span>History</span>
          </span>
          <span className="text-white/10">•</span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-white/10 bg-slate-900 px-1.5 py-0.5 text-zinc-300 font-bold">Tab</kbd>
            <span>Next Topic</span>
          </span>
          <span className="text-white/10">•</span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-white/10 bg-slate-900 px-1.5 py-0.5 text-zinc-300 font-bold">Enter</kbd>
            <span>Submit</span>
          </span>
        </div>
        <p className="mt-1.5 text-center text-[0.6rem] text-zinc-500 font-mono">
          Shortcuts are active when input is empty • Skip is button-only
        </p>
      </div>
    </footer>
  );
}