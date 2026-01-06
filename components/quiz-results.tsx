"use client";

import { useState } from "react";
import { QuizResult } from "./quiz-session";

interface QuizResultsProps {
  results: QuizResult[];
  onNewQuiz: () => void;
  onTryAgain: () => void;
}

export function QuizResults({ results, onNewQuiz, onTryAgain }: QuizResultsProps) {
  const [showMissed, setShowMissed] = useState(true);

  const correctCount = results.filter((r) => r.isCorrect).length;
  const totalCount = results.length;
  const percentage = Math.round((correctCount / totalCount) * 100);

  const missedResults = results.filter((r) => !r.isCorrect);

  const getMessage = () => {
    if (percentage === 100) return "Perfect score! 🎯";
    if (percentage >= 80) return "Great job!";
    if (percentage >= 60) return "Good effort!";
    if (percentage >= 40) return "Keep practicing!";
    return "Room for improvement";
  };

  const getScoreColor = () => {
    if (percentage >= 80) return "text-green-600 dark:text-green-400";
    if (percentage >= 60) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Score card */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-8 text-center mb-6">
        <h2 className="text-lg font-medium text-neutral-500 mb-4">
          {getMessage()}
        </h2>

        <div className={`text-6xl font-bold mb-2 ${getScoreColor()}`}>
          {percentage}%
        </div>

        <p className="text-neutral-600 dark:text-neutral-400">
          {correctCount} out of {totalCount} correct
        </p>

        {/* Score breakdown bar */}
        <div className="mt-6 h-3 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 dark:bg-green-400 transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 mb-8">
        <button
          onClick={onTryAgain}
          className="flex-1 py-3 rounded-xl font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
        >
          Try Again
        </button>
        <button
          onClick={onNewQuiz}
          className="flex-1 py-3 rounded-xl font-medium bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
        >
          New Quiz
        </button>
      </div>

      {/* Missed items review */}
      {missedResults.length > 0 && (
        <div>
          <button
            onClick={() => setShowMissed(!showMissed)}
            className="flex items-center justify-between w-full px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl mb-4"
          >
            <span className="font-medium text-neutral-900 dark:text-neutral-100">
              Review missed items ({missedResults.length})
            </span>
            <svg
              className={`w-5 h-5 text-neutral-500 transition-transform ${showMissed ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showMissed && (
            <div className="space-y-3">
              {missedResults.map((result, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4"
                >
                  <div className="mb-2">
                    <span className="text-xs font-medium px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                      {result.question.entry.type}
                    </span>
                  </div>

                  <p className="font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                    {result.question.prompt}
                  </p>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <div>
                        <span className="text-neutral-500">Your answer:</span>
                        <span className="ml-2 text-neutral-700 dark:text-neutral-300">
                          {result.userAnswer || "(no answer)"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <div>
                        <span className="text-neutral-500">Correct answer:</span>
                        <span className="ml-2 text-neutral-700 dark:text-neutral-300">
                          {result.question.answer}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* All correct message */}
      {missedResults.length === 0 && (
        <div className="text-center py-8 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
          <svg className="w-12 h-12 mx-auto text-green-600 dark:text-green-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-medium text-green-700 dark:text-green-400">
            You got everything right!
          </p>
        </div>
      )}
    </div>
  );
}
