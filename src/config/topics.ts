const TOPIC_DEFINITIONS = [
  { id: "filesystem", label: "Filesystem", section: "core" },
  { id: "networking", label: "Networking", section: "core" },
  { id: "process", label: "Process", section: "core" },
  { id: "permissions", label: "Permissions", section: "core" },
  { id: "text", label: "Text", section: "core" },
  { id: "system", label: "System", section: "core" },
  { id: "shell", label: "Shell", section: "core" },
  { id: "storage", label: "Storage", section: "core" },
  { id: "security", label: "Security", section: "core" },
  { id: "scripting", label: "Scripting", section: "core" },
  { id: "ssh", label: "SSH", section: "infra" },
  { id: "git", label: "Git", section: "infra" },
  { id: "package", label: "Packages", section: "infra" },
  { id: "monitoring", label: "Monitoring", section: "infra" },
  { id: "github-cli", label: "GitHub CLI", section: "infra" },
  { id: "docker", label: "Docker", section: "containers" },
  { id: "docker-compose", label: "Docker Compose", section: "containers" },
  { id: "docker-swarm", label: "Docker Swarm", section: "containers" },
  { id: "kubernetes", label: "Kubernetes", section: "containers" },
  { id: "helm", label: "Helm", section: "containers" },
  { id: "ansible", label: "Ansible", section: "iac" },
  { id: "terraform", label: "Terraform", section: "iac" },
  { id: "user", label: "User", section: "core" },
  { id: "git-flow", label: "Gitflow", section: "infra" },
] as const;

const TOPIC_SECTION_DEFINITIONS = [
  { id: "core", name: "Core" },
  { id: "infra", name: "Infra & Tools" },
  { id: "containers", name: "Containers" },
  { id: "iac", name: "IaC / Automation" },
] as const;

export type QuizTopic = (typeof TOPIC_DEFINITIONS)[number]["id"];
type TopicSectionId = (typeof TOPIC_SECTION_DEFINITIONS)[number]["id"];

export const TOPICS = TOPIC_DEFINITIONS.map((topicDefinition) => topicDefinition.id) as QuizTopic[];

export const TOPIC_LABELS = Object.fromEntries(
  TOPIC_DEFINITIONS.map((topicDefinition) => [topicDefinition.id, topicDefinition.label]),
) as Record<QuizTopic, string>;

export const TOPIC_SECTIONS = TOPIC_SECTION_DEFINITIONS.map((sectionDefinition) => ({
  id: sectionDefinition.id,
  name: sectionDefinition.name,
  topics: TOPIC_DEFINITIONS.filter(
    (topicDefinition): topicDefinition is Extract<(typeof TOPIC_DEFINITIONS)[number], { section: TopicSectionId }> =>
      topicDefinition.section === sectionDefinition.id,
  ).map((topicDefinition) => topicDefinition.id) as QuizTopic[],
})) as ReadonlyArray<{
  id: TopicSectionId;
  name: string;
  topics: ReadonlyArray<QuizTopic>;
}>;
