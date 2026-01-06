"use client";

import { useState } from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { QuizSetup, QuizConfig } from "@/components/quiz-setup";
import { QuizSession, QuizQuestion, QuizResult, QuizEntry, generateQuestion } from "@/components/quiz-session";
import { QuizResults } from "@/components/quiz-results";

type Phase = "setup" | "loading" | "active" | "results";

export default function PracticePage() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [config, setConfig] = useState<QuizConfig | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const startQuiz = async (quizConfig: QuizConfig) => {
    setConfig(quizConfig);
    setPhase("loading");
    setError(null);

    try {
      const params = new URLSearchParams({
        types: quizConfig.types.join(","),
        count: quizConfig.count.toString(),
      });

      const response = await fetch(`/api/quiz?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch quiz entries");

      const data = await response.json();
      const entries: QuizEntry[] = data.entries;

      if (entries.length === 0) {
        throw new Error("No entries found for the selected types");
      }

      // Generate questions from entries
      const generated = entries.map((entry) =>
        generateQuestion(entry, quizConfig.direction, entries)
      );

      setQuestions(generated);
      setPhase("active");
    } catch (err) {
      console.error("Quiz start error:", err);
      setError(err instanceof Error ? err.message : "Failed to start quiz");
      setPhase("setup");
    }
  };

  const handleComplete = (quizResults: QuizResult[]) => {
    setResults(quizResults);
    setPhase("results");
  };

  const handleNewQuiz = () => {
    setConfig(null);
    setQuestions([]);
    setResults([]);
    setPhase("setup");
  };

  const handleTryAgain = () => {
    // Restart with same config
    if (config) {
      startQuiz(config);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="border-b border-neutral-200 dark:border-neutral-800">
        <nav className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link
            href="/"
            className="text-lg font-semibold text-neutral-900 dark:text-neutral-100"
          >
            Commonplace
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
            >
              Dashboard
            </Link>
            <Link
              href="/upload"
              className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
            >
              Upload
            </Link>
            <UserButton />
          </div>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {phase !== "setup" && (
          <div className="mb-6">
            <button
              onClick={handleNewQuiz}
              className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Start Over
            </button>
          </div>
        )}

        {phase === "setup" && (
          <div className="py-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                Practice Quiz
              </h1>
              <p className="text-neutral-500">
                Test yourself on your commonplace entries
              </p>
            </div>

            {error && (
              <div className="max-w-lg mx-auto mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-center">
                {error}
              </div>
            )}

            <QuizSetup onStart={startQuiz} />
          </div>
        )}

        {phase === "loading" && (
          <div className="py-20 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-neutral-300 border-t-neutral-900 dark:border-neutral-700 dark:border-t-neutral-100 mb-4" />
            <p className="text-neutral-500">Preparing your quiz...</p>
          </div>
        )}

        {phase === "active" && config && (
          <QuizSession
            questions={questions}
            mode={config.mode}
            direction={config.direction}
            onComplete={handleComplete}
          />
        )}

        {phase === "results" && (
          <QuizResults
            results={results}
            onNewQuiz={handleNewQuiz}
            onTryAgain={handleTryAgain}
          />
        )}
      </main>
    </div>
  );
}
