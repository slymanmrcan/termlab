import type { QuizTopic } from "../types/quiz";

const TOPIC_LABELS: Record<QuizTopic, string> = {
  filesystem: "Filesystem",
  networking: "Networking",
  process: "Process",
  permissions: "Permissions",
  text: "Text",
  system: "System",
  shell: "Shell",
  storage: "Storage",
  security: "Security",
  scripting: "Scripting",
  ssh: "SSH",
  git: "Git",
  package: "Packages",
  monitoring: "Monitoring",
  "github-cli": "GitHub CLI",
  docker: "Docker",
  "docker-compose": "Docker Compose",
  "docker-swarm": "Docker Swarm",
  kubernetes: "Kubernetes",
  helm: "Helm",
  ansible: "Ansible",
  terraform: "Terraform",
};

const TOPIC_SECTIONS = [
  {
    id: "core",
    name: "Core",
    topics: [
      "filesystem",
      "networking",
      "process",
      "permissions",
      "text",
      "system",
      "shell",
      "storage",
      "security",
      "scripting",
    ],
  },
  {
    id: "infra",
    name: "Infra & Tools",
    topics: ["ssh", "git", "package", "monitoring", "github-cli"],
  },
  {
    id: "containers",
    name: "Containers",
    topics: ["docker", "docker-compose", "docker-swarm", "kubernetes", "helm"],
  },
  {
    id: "iac",
    name: "IaC / Automation",
    topics: ["ansible", "terraform"],
  },
] as const satisfies ReadonlyArray<{
  id: string;
  name: string;
  topics: ReadonlyArray<QuizTopic>;
}>;

interface HeaderProps {
  topic: QuizTopic;
  onTopicChange: (topic: QuizTopic) => void;
  topicCounts: Record<QuizTopic, number>;
}

export function Header({ topic, onTopicChange, topicCounts }: HeaderProps) {
  return (
    <header className="rounded-[2rem] border border-emerald-500/15 bg-[linear-gradient(180deg,rgba(5,18,8,0.88),rgba(4,4,4,0.96))] px-4 py-4 shadow-[0_0_60px_rgba(16,185,129,0.08)] sm:px-5 sm:py-5">
      <div className="flex flex-col gap-2.5">
        <div className="grid gap-2 md:grid-cols-2">
          {TOPIC_SECTIONS.map((section) => (
            <div
              key={section.id}
              className="rounded-[1rem] border border-zinc-800 bg-[linear-gradient(180deg,rgba(8,8,8,0.72),rgba(4,4,4,0.72))] px-3 py-2.5 sm:px-4"
            >
              <div className="mb-2 font-mono text-[0.62rem] uppercase tracking-[0.26em] text-zinc-500">
                {section.name}
              </div>

              <div className="flex flex-wrap gap-1 font-mono text-[0.65rem] sm:text-[0.72rem]">
                {section.topics.map((currentTopic) => {
                  const active = currentTopic === topic;

                  return (
                    <button
                      key={currentTopic}
                      type="button"
                      onClick={() => onTopicChange(currentTopic)}
                      className={`rounded-full border px-2 py-1 leading-none transition ${
                        active
                          ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-200"
                          : "border-zinc-800 bg-black/30 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                      }`}
                    >
                      [{TOPIC_LABELS[currentTopic]}] <span className="text-zinc-500">{topicCounts[currentTopic]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
