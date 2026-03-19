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

  return (
    <div className="rounded-[1.25rem] border border-emerald-400/10 bg-[linear-gradient(180deg,rgba(13,17,20,0.96),rgba(10,13,16,0.95))] px-3 py-2.5 font-mono text-sm shadow-[0_18px_50px_rgba(0,0,0,0.2)] sm:px-4 sm:py-3">
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
        {/* Action buttons */}
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={onHint}
            disabled={disabled}
            title="Shortcut: ,"
            className="flex items-center gap-1.5 rounded-md border border-emerald-400/[0.07] bg-emerald-400/[0.05] px-2.5 py-1 text-[0.64rem] text-zinc-300 transition-all duration-150 enabled:hover:border-emerald-300/20 enabled:hover:bg-emerald-300/[0.08] enabled:hover:text-zinc-100 disabled:cursor-not-allowed disabled:text-zinc-600"
          >
            [hint]
            <span className="rounded bg-white/[0.05] px-1 py-0.5 text-[0.58rem] leading-none text-zinc-500">
              {Math.min(hintStage + 1, 2)}/2
            </span>
            <span className="text-zinc-600">,</span>
          </button>

          <button
            type="button"
            onClick={onSkip}
            disabled={disabled}
            className="flex items-center gap-1.5 rounded-md border border-white/[0.07] bg-slate-950/20 px-2.5 py-1 text-[0.64rem] text-zinc-400 transition-all duration-150 enabled:hover:border-amber-300/15 enabled:hover:bg-amber-300/[0.06] enabled:hover:text-zinc-200 disabled:cursor-not-allowed disabled:text-zinc-600"
          >
            [skip]
          </button>

          <button
            type="button"
            onClick={onToggleAnswer}
            disabled={disabled}
            title="Shortcut: ."
            className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[0.64rem] transition-all duration-150 disabled:cursor-not-allowed disabled:text-zinc-600 ${
              showAnswer
                ? "border-emerald-400/35 bg-emerald-400/12 text-emerald-100 shadow-[0_0_10px_rgba(52,211,153,0.08)]"
                : "border-white/[0.07] bg-slate-950/20 text-zinc-400 enabled:hover:border-emerald-400/20 enabled:hover:bg-emerald-400/[0.06] enabled:hover:text-zinc-200"
            }`}
          >
            [{showAnswer ? "hide answer" : "show answer"}]
            <span className={`text-[0.58rem] ${showAnswer ? "text-emerald-500" : "text-zinc-600"}`}>.</span>
          </button>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap items-center gap-1 text-[0.64rem]">
          <span className="flex items-center gap-1.5 rounded-md border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-emerald-200">
            time
            <span className="rounded bg-emerald-400/15 px-1 py-0.5 text-[0.58rem] leading-none text-emerald-400">
              {formatElapsed(elapsedSeconds)}
            </span>
          </span>
          <span className="flex items-center gap-1.5 rounded-md border border-white/[0.07] bg-slate-950/20 px-2.5 py-1 text-zinc-400">
            progress
            <span className="rounded bg-white/[0.05] px-1 py-0.5 text-[0.58rem] leading-none text-zinc-500">
              {progressCurrent}/{progressTotal}
            </span>
          </span>
          <span className="flex items-center gap-1.5 rounded-md border border-white/[0.07] bg-slate-950/20 px-2.5 py-1 text-zinc-400">
            score
            <span className="rounded bg-white/[0.05] px-1 py-0.5 text-[0.58rem] leading-none text-zinc-500">
              {score}
            </span>
          </span>
        </div>
      </div>

      {/* Shortcut bar — header section label mantığıyla */}
      <div className="mt-2 flex items-center gap-2">
        <div className="h-px flex-1 bg-white/[0.06]" />
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.55rem] uppercase tracking-[0.18em] text-zinc-600">
          <span>. answer</span>
          <span className="text-white/[0.06]">·</span>
          <span>, hint</span>
          <span className="text-white/[0.06]">·</span>
          <span>tab topic</span>
          <span className="text-white/[0.06]">·</span>
          <span>enter submit</span>
        </div>
        <div className="h-px flex-1 bg-white/[0.06]" />
      </div>
      <p className="mt-1.5 text-center text-[0.55rem] uppercase tracking-[0.15em] text-zinc-600">
        skip sadece butondan · kısayollar input boşken aktif
      </p>
    </div>
  );
}