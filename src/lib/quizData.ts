import {
  LEVELS,
  TOPICS,
  type QuizDataset,
  type QuizLevel,
  type QuizQuestion,
  type QuizQuestionFile,
  type QuizTopic,
} from "../types/quiz";

function createEmptyQuestionFile(level: QuizLevel, topic: QuizTopic): QuizQuestionFile {
  return {
    level,
    topic,
    questions: [],
  };
}

export function createEmptyQuizDataset(): QuizDataset {
  return LEVELS.reduce<QuizDataset>((levelAccumulator, level) => {
    levelAccumulator[level] = TOPICS.reduce<Record<QuizTopic, QuizQuestionFile>>((topicAccumulator, topic) => {
      topicAccumulator[topic] = createEmptyQuestionFile(level, topic);
      return topicAccumulator;
    }, {} as Record<QuizTopic, QuizQuestionFile>);

    return levelAccumulator;
  }, {} as QuizDataset);
}

export function mergeQuizFiles(files: QuizQuestionFile[]): QuizDataset {
  const dataset = createEmptyQuizDataset();
  const indexes = LEVELS.reduce<Record<QuizLevel, Record<QuizTopic, Map<string, QuizQuestion>>>>(
    (levelAccumulator, level) => {
      levelAccumulator[level] = TOPICS.reduce<Record<QuizTopic, Map<string, QuizQuestion>>>(
        (topicAccumulator, topic) => {
          topicAccumulator[topic] = new Map<string, QuizQuestion>();
          return topicAccumulator;
        },
        {} as Record<QuizTopic, Map<string, QuizQuestion>>,
      );

      return levelAccumulator;
    },
    {} as Record<QuizLevel, Record<QuizTopic, Map<string, QuizQuestion>>>,
  );

  for (const file of files) {
    const questions = indexes[file.level][file.topic];

    for (const question of file.questions) {
      questions.set(question.id, question);
    }
  }

  for (const level of LEVELS) {
    for (const topic of TOPICS) {
      dataset[level][topic].questions = Array.from(indexes[level][topic].values()).sort((left, right) =>
        left.id.localeCompare(right.id),
      );
    }
  }

  return dataset;
}
