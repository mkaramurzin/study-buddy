"use client";

import { useState } from "react";
import { QuizMode, RecallDirection } from "./quiz-setup";

export interface QuizEntry {
  id: string;
  type: string;
  title: string | null;
  content: string | null;
  metadata: Record<string, unknown> | null;
}

export interface QuizQuestion {
  entry: QuizEntry;
  prompt: string;
  answer: string;
  options?: string[]; // For multiple choice
}

export interface QuizResult {
  question: QuizQuestion;
  userAnswer: string;
  isCorrect: boolean;
}

interface QuizSessionProps {
  questions: QuizQuestion[];
  mode: QuizMode;
  direction: RecallDirection;
  onComplete: (results: QuizResult[]) => void;
}

const str = (val: unknown): string => {
  if (typeof val === "string" && val.trim()) return val.trim();
  return "";
};

// Extract prompt/answer from entry based on type and direction
export function generateQuestion(
  entry: QuizEntry,
  direction: RecallDirection,
  allEntries: QuizEntry[]
): QuizQuestion {
  let prompt = "";
  let answer = "";
  const m = entry.metadata || {};

  if (entry.type === "concept") {
    // Concept entries have term and definition in metadata
    const term = str(m.term) || entry.title || "";
    const definition = str(m.definition) || entry.content || "";

    if (direction === "term_to_def") {
      prompt = term;
      answer = definition;
    } else {
      prompt = definition;
      answer = term;
    }
  } else if (entry.type === "principle") {
    const name = str(m.name) || entry.title || "";
    const statement = str(m.statement) || entry.content || "";

    if (direction === "term_to_def") {
      prompt = name;
      answer = statement;
    } else {
      prompt = statement;
      answer = name;
    }
  } else if (entry.type === "quote") {
    const quote = str(m.text) || entry.content || "";
    const author = str(m.author) || "Unknown";

    if (direction === "term_to_def") {
      prompt = `"${quote}"`;
      answer = author;
    } else {
      prompt = `Who said this?`;
      answer = quote;
    }
  } else {
    // Fallback for other types
    const title = entry.title || "";
    const content = entry.content || "";

    if (direction === "term_to_def") {
      prompt = title || content.slice(0, 50);
      answer = content || title;
    } else {
      prompt = content || title;
      answer = title || content.slice(0, 50);
    }
  }

  // Generate multiple choice options from other entries
  const options = generateOptions(answer, entry.type, allEntries, direction);

  return { entry, prompt, answer, options };
}

function generateOptions(
  correctAnswer: string,
  entryType: string,
  allEntries: QuizEntry[],
  direction: RecallDirection
): string[] {
  const distractors: string[] = [];

  // Get potential distractors from same-type entries
  const sameTypeEntries = allEntries.filter((e) => e.type === entryType);

  for (const entry of sameTypeEntries) {
    let distractor = "";
    const m = entry.metadata || {};

    if (entry.type === "concept") {
      distractor = direction === "term_to_def"
        ? str(m.definition)
        : str(m.term);
    } else if (entry.type === "principle") {
      distractor = direction === "term_to_def"
        ? str(m.statement)
        : str(m.name);
    } else if (entry.type === "quote") {
      distractor = direction === "term_to_def"
        ? str(m.author)
        : str(m.text);
    } else {
      distractor = direction === "term_to_def"
        ? entry.content || ""
        : entry.title || "";
    }

    if (distractor && distractor !== correctAnswer && !distractors.includes(distractor)) {
      distractors.push(distractor);
    }

    if (distractors.length >= 3) break;
  }

  // Shuffle options
  const options = [correctAnswer, ...distractors.slice(0, 3)];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  return options;
}

export function QuizSession({ questions, mode, onComplete }: QuizSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [results, setResults] = useState<QuizResult[]>([]);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const checkAnswer = () => {
    const answer = mode === "written" ? userAnswer : selectedOption || "";
    
    // For written mode, do a fuzzy match (case-insensitive, trimmed)
    let isCorrect = false;
    if (mode === "written") {
      const normalizedUser = answer.toLowerCase().trim();
      const normalizedCorrect = currentQuestion.answer.toLowerCase().trim();
      // Consider correct if >70% similar or exact match
      isCorrect = normalizedUser === normalizedCorrect ||
        normalizedCorrect.includes(normalizedUser) ||
        normalizedUser.includes(normalizedCorrect);
    } else {
      isCorrect = answer === currentQuestion.answer;
    }

    const result: QuizResult = {
      question: currentQuestion,
      userAnswer: answer,
      isCorrect,
    };

    setResults((prev) => [...prev, result]);
    setShowFeedback(true);
  };

  const nextQuestion = () => {
    if (currentIndex + 1 >= questions.length) {
      onComplete([...results]);
    } else {
      setCurrentIndex((prev) => prev + 1);
      setUserAnswer("");
      setSelectedOption(null);
      setShowFeedback(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showFeedback) {
      checkAnswer();
    } else {
      nextQuestion();
    }
  };

  const currentResult = results[currentIndex];
  const isCorrect = currentResult?.isCorrect;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-neutral-500 mb-2">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-neutral-900 dark:bg-neutral-100 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 mb-6">
        <div className="mb-2">
          <span className="text-xs font-medium px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
            {currentQuestion.entry.type}
          </span>
        </div>

        <div className="py-6">
          <p className="text-xl font-medium text-neutral-900 dark:text-neutral-100 text-center">
            {currentQuestion.prompt}
          </p>
        </div>

        {/* Feedback display */}
        {showFeedback && (
          <div
            className={`mt-4 p-4 rounded-xl ${
              isCorrect
                ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {isCorrect ? (
                <>
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-semibold text-green-700 dark:text-green-400">Correct!</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="font-semibold text-red-700 dark:text-red-400">Not quite</span>
                </>
              )}
            </div>
            <p className="text-sm text-neutral-700 dark:text-neutral-300">
              <span className="font-medium">Correct answer:</span> {currentQuestion.answer}
            </p>
          </div>
        )}
      </div>

      {/* Answer input */}
      <form onSubmit={handleSubmit}>
        {mode === "written" ? (
          <div className="mb-4">
            <textarea
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Type your answer..."
              disabled={showFeedback}
              rows={3}
              className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-400 disabled:opacity-50 resize-none"
            />
          </div>
        ) : (
          <div className="space-y-3 mb-4">
            {currentQuestion.options?.map((option, i) => (
              <button
                key={i}
                type="button"
                onClick={() => !showFeedback && setSelectedOption(option)}
                disabled={showFeedback}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                  showFeedback
                    ? option === currentQuestion.answer
                      ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700"
                      : selectedOption === option
                        ? "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700"
                        : "bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 opacity-50"
                    : selectedOption === option
                      ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 border-transparent"
                      : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500"
                }`}
              >
                <span className="font-medium mr-3 opacity-50">{String.fromCharCode(65 + i)}.</span>
                {option}
              </button>
            ))}
          </div>
        )}

        <button
          type="submit"
          disabled={mode === "written" ? !userAnswer.trim() && !showFeedback : !selectedOption && !showFeedback}
          className="w-full py-3 rounded-xl font-medium bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {showFeedback
            ? currentIndex + 1 >= questions.length
              ? "See Results"
              : "Next Question"
            : "Check Answer"}
        </button>
      </form>
    </div>
  );
}
