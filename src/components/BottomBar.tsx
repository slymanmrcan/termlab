interface BottomBarProps {
  onHint: () => void;
  onSkip: () => void;
  onToggleAnswer: () => void;
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
  progressCurrent,
  progressTotal,
  score,
  hintStage,
  disabled,
  showAnswer,
}: BottomBarProps) {
  return (
    <div className="flex flex-col gap-4 rounded-[1.75rem] border border-zinc-800 bg-[linear-gradient(180deg,rgba(8,8,8,0.96),rgba(5,5,5,0.96))] px-5 py-4 font-mono text-sm shadow-[0_0_40px_rgba(16,185,129,0.05)] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onHint}
          disabled={disabled}
          className="rounded-full border border-zinc-800 px-4 py-2 text-zinc-300 transition enabled:hover:border-emerald-500/40 enabled:hover:text-emerald-200 disabled:cursor-not-allowed disabled:text-zinc-700"
        >
          [hint {Math.min(hintStage + 1, 2)}/2]
        </button>
        <button
          type="button"
          onClick={onSkip}
          disabled={disabled}
          className="rounded-full border border-zinc-800 px-4 py-2 text-zinc-300 transition enabled:hover:border-amber-500/40 enabled:hover:text-amber-200 disabled:cursor-not-allowed disabled:text-zinc-700"
        >
          [skip]
        </button>
        <button
          type="button"
          onClick={onToggleAnswer}
          disabled={disabled}
          className={`rounded-full border px-4 py-2 transition disabled:cursor-not-allowed disabled:text-zinc-700 ${
            showAnswer
              ? "border-emerald-500/40 text-emerald-300"
              : "border-zinc-800 text-zinc-300 enabled:hover:border-emerald-500/40 enabled:hover:text-emerald-200"
          }`}
        >
          [{showAnswer ? "hide answer" : "show answer"}]
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-zinc-400">
        <span>progress: {progressCurrent}/{progressTotal}</span>
        <span>score: {score}</span>
      </div>
    </div>
  );
}
