import { useState, useMemo } from "react";
import { TOPIC_LABELS, TOPIC_SECTIONS, type QuizTopic } from "../types/quiz";

interface HeaderProps {
  topic: QuizTopic;
  onTopicChange: (topic: QuizTopic) => void;
}

export function Header({ topic, onTopicChange }: HeaderProps) {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSections = useMemo(() => {
    return TOPIC_SECTIONS.map((section) => {
      if (activeTab !== "all" && section.id !== activeTab) {
        return null;
      }
      const matchingTopics = section.topics.filter((t) => {
        const label = TOPIC_LABELS[t].toLowerCase();
        const id = t.toLowerCase();
        const query = searchQuery.toLowerCase().trim();
        return label.includes(query) || id.includes(query);
      });

      if (matchingTopics.length === 0) return null;

      return {
        ...section,
        topics: matchingTopics,
      };
    }).filter(Boolean);
  }, [activeTab, searchQuery]);

  const totalTopicsCount = useMemo(() => {
    return TOPIC_SECTIONS.reduce((acc, sec) => acc + sec.topics.length, 0);
  }, []);

  return (
    <header className="rounded-[1.25rem] border border-emerald-500/20 bg-slate-950/80 p-3 shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-md sm:p-4">
      {/* Brand & Status Bar */}
      <div className="mb-3 flex flex-col gap-2 border-b border-white/5 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 font-mono text-base font-bold text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            &gt;_
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-mono text-base font-bold tracking-tight text-zinc-100 sm:text-lg">
                Term<span className="text-emerald-400">Lab</span>
              </h1>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[0.6rem] font-medium text-emerald-400">
                v2.0
              </span>
            </div>
            <p className="text-[0.7rem] text-zinc-400">
              Linux, DevOps &amp; Shell Command Practice
            </p>
          </div>
        </div>

        {/* Live Session Status & Active Topic Badge */}
        <div className="flex items-center gap-2 font-mono text-[0.7rem]">
          <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1 text-emerald-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <span>LIVE SESSION</span>
          </div>

          <div className="hidden items-center gap-1.5 rounded-lg border border-white/10 bg-slate-900/60 px-2.5 py-1 text-zinc-300 sm:flex">
            <span className="text-zinc-500">topic:</span>
            <span className="font-semibold text-emerald-400">
              {TOPIC_LABELS[topic]}
            </span>
          </div>
        </div>
      </div>

      {/* Category Tabs & Search */}
      <div className="mb-2.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-1 font-mono text-[0.68rem]">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`rounded-md border px-2.5 py-1 transition-all ${
              activeTab === "all"
                ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300 font-medium"
                : "border-white/5 bg-slate-900/40 text-zinc-400 hover:border-white/10 hover:text-zinc-200"
            }`}
          >
            All <span className="text-zinc-500">({totalTopicsCount})</span>
          </button>
          {TOPIC_SECTIONS.map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => setActiveTab(sec.id)}
              className={`rounded-md border px-2.5 py-1 transition-all ${
                activeTab === sec.id
                  ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300 font-medium"
                  : "border-white/5 bg-slate-900/40 text-zinc-400 hover:border-white/10 hover:text-zinc-200"
              }`}
            >
              {sec.name}{" "}
              <span className="text-zinc-500">({sec.topics.length})</span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative flex items-center">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search topic... (e.g. docker, git)"
            className="w-full rounded-md border border-white/10 bg-slate-900/80 px-2.5 py-1 text-[0.68rem] text-zinc-200 placeholder-zinc-500 outline-none transition-all focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/30 sm:w-56"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 text-zinc-500 hover:text-zinc-300 font-mono text-xs"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Topics Grid */}
      <div className="grid gap-2 md:grid-cols-2">
        {filteredSections.length === 0 ? (
          <div className="col-span-2 py-4 text-center font-mono text-[0.75rem] text-zinc-500">
            No topics match &quot;{searchQuery}&quot;
          </div>
        ) : (
          filteredSections.map((section) => {
            if (!section) return null;
            return (
              <div
                key={section.id}
                className="rounded-lg border border-white/5 bg-slate-900/50 p-2 sm:p-2.5"
              >
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="font-mono text-[0.55rem] font-semibold uppercase tracking-wider text-zinc-500">
                    {section.name}
                  </span>
                  <div className="h-px flex-1 bg-white/5" />
                </div>

                <div className="flex flex-wrap gap-1 font-mono text-[0.65rem]">
                  {section.topics.map((currentTopic) => {
                    const active = currentTopic === topic;
                    return (
                      <button
                        key={currentTopic}
                        type="button"
                        onClick={() => onTopicChange(currentTopic)}
                        className={`flex items-center gap-1 rounded-md border px-2 py-0.5 transition-all duration-150 ${
                          active
                            ? "border-emerald-400/50 bg-emerald-400/20 text-emerald-100 font-medium shadow-[0_0_12px_rgba(52,211,153,0.15)] scale-[1.02]"
                            : "border-white/5 bg-slate-950/40 text-zinc-400 hover:border-emerald-500/20 hover:bg-slate-900/60 hover:text-zinc-200"
                        }`}
                      >
                        <span className={active ? "text-emerald-400" : "text-zinc-600"}>
                          #
                        </span>
                        <span>{TOPIC_LABELS[currentTopic]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </header>
  );
}