import { TOPIC_LABELS, TOPIC_SECTIONS, type QuizTopic } from "../types/quiz";

interface HeaderProps {
  topic: QuizTopic;
  onTopicChange: (topic: QuizTopic) => void;
}

export function Header({ topic, onTopicChange }: HeaderProps) {
  return (
    <header className="rounded-[1.25rem] border border-emerald-400/10 bg-[linear-gradient(180deg,rgba(13,17,20,0.96),rgba(10,13,16,0.95))] px-3 py-2.5 shadow-[0_18px_50px_rgba(0,0,0,0.2)] sm:px-4 sm:py-3">
      <div className="grid gap-1.5 md:grid-cols-2">
        {TOPIC_SECTIONS.map((section) => (
          <div
            key={section.id}
            className="rounded-[0.85rem] border border-white/[0.05] bg-[linear-gradient(180deg,rgba(10,13,16,0.7),rgba(7,10,12,0.65))] px-3 py-2 sm:px-3.5"
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="font-mono text-[0.55rem] uppercase tracking-[0.22em] text-zinc-500">
                {section.name}
              </span>
              <div className="h-px flex-1 bg-white/[0.06]" />
            </div>

            <div className="flex flex-wrap gap-1 font-mono text-[0.64rem] sm:text-[0.67rem]">
              {section.topics.map((currentTopic) => {
                const active = currentTopic === topic;

                return (
                  <button
                    key={currentTopic}
                    type="button"
                    onClick={() => onTopicChange(currentTopic)}
                    className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 leading-none transition-all duration-150 ${
                      active
                        ? "border-emerald-400/35 bg-emerald-400/12 text-emerald-100 shadow-[0_0_10px_rgba(52,211,153,0.08)]"
                        : "border-white/[0.07] bg-slate-950/20 text-zinc-400 hover:border-sky-300/10 hover:text-zinc-200 hover:bg-slate-900/30"
                    }`}
                  >
                    <span>[{TOPIC_LABELS[currentTopic]}]</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </header>
  );
}