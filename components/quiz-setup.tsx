"use client";

import { useState, useEffect } from "react";

export type QuizMode = "written" | "multiple_choice";
export type RecallDirection = "term_to_def" | "def_to_term";

export interface QuizConfig {
  types: string[];
  mode: QuizMode;
  direction: RecallDirection;
  count: number;
}

interface QuizSetupProps {
  onStart: (config: QuizConfig) => void;
}

const ENTRY_TYPES = [
  { value: "concept", label: "Concepts" },
  { value: "principle", label: "Principles" },
  { value: "quote", label: "Quotes" },
  { value: "example", label: "Examples" },
  { value: "procedure", label: "Procedures" },
  { value: "question", label: "Questions" },
  { value: "note", label: "Notes" },
];

const COUNT_OPTIONS = [5, 10, 15, 20];

export function QuizSetup({ onStart }: QuizSetupProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [mode, setMode] = useState<QuizMode | null>(null);
  const [direction, setDirection] = useState<RecallDirection>("term_to_def");
  const [count, setCount] = useState(10);
  const [countsByType, setCountsByType] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCounts() {
      try {
        const res = await fetch("/api/quiz?types=concept,principle,quote,example,procedure,question,note&count=0");
        if (res.ok) {
          const data = await res.json();
          setCountsByType(data.countsByType || {});
        }
      } catch (error) {
        console.error("Failed to fetch counts:", error);
      }
      setLoading(false);
    }
    fetchCounts();
  }, []);

  const totalSelected = selectedTypes.reduce((sum, t) => sum + (countsByType[t] || 0), 0);

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleStart = () => {
    if (!mode) return;
    onStart({ types: selectedTypes, mode, direction, count });
  };

  const canProceedStep1 = selectedTypes.length > 0 && totalSelected > 0;
  const canProceedStep2 = mode !== null;
  const canProceedStep3 = true; // Direction always has a default

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-300 border-t-neutral-900 dark:border-neutral-700 dark:border-t-neutral-100" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              s === step
                ? "bg-neutral-900 dark:bg-neutral-100"
                : s < step
                  ? "bg-neutral-400 dark:bg-neutral-500"
                  : "bg-neutral-200 dark:bg-neutral-700"
            }`}
          />
        ))}
      </div>

      {/* Step 1: Entry Type Selection */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              What do you want to practice?
            </h2>
            <p className="text-neutral-500 text-sm">
              Select the entry types to include in your quiz
            </p>
          </div>

          <div className="space-y-3">
            {ENTRY_TYPES.map((type) => {
              const count = countsByType[type.value] || 0;
              const isSelected = selectedTypes.includes(type.value);
              const isDisabled = count === 0;

              return (
                <button
                  key={type.value}
                  onClick={() => !isDisabled && toggleType(type.value)}
                  disabled={isDisabled}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                    isDisabled
                      ? "opacity-40 cursor-not-allowed bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
                      : isSelected
                        ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 border-transparent"
                        : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500"
                  }`}
                >
                  <span className="font-medium">{type.label}</span>
                  <span className={`text-sm ${isSelected ? "opacity-70" : "text-neutral-500"}`}>
                    {count} entries
                  </span>
                </button>
              );
            })}
          </div>

          {totalSelected > 0 && (
            <p className="text-center text-sm text-neutral-500">
              {totalSelected} total entries selected
            </p>
          )}

          <button
            onClick={() => setStep(2)}
            disabled={!canProceedStep1}
            className="w-full py-3 rounded-xl font-medium bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </div>
      )}

      {/* Step 2: Mode Selection */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              Choose your quiz mode
            </h2>
            <p className="text-neutral-500 text-sm">
              How would you like to be tested?
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => setMode("written")}
              className={`w-full p-5 rounded-xl border text-left transition-all ${
                mode === "written"
                  ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 border-transparent"
                  : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500"
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span className="font-semibold text-lg">Written Recall</span>
              </div>
              <p className={`text-sm ${mode === "written" ? "opacity-70" : "text-neutral-500"}`}>
                Type your answer from memory. Best for deep learning.
              </p>
            </button>

            <button
              onClick={() => setMode("multiple_choice")}
              className={`w-full p-5 rounded-xl border text-left transition-all ${
                mode === "multiple_choice"
                  ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 border-transparent"
                  : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500"
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <span className="font-semibold text-lg">Multiple Choice</span>
              </div>
              <p className={`text-sm ${mode === "multiple_choice" ? "opacity-70" : "text-neutral-500"}`}>
                Pick from options. Great for recognition practice.
              </p>
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-3 rounded-xl font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setStep(mode === "written" ? 3 : 4)}
              disabled={!canProceedStep2}
              className="flex-1 py-3 rounded-xl font-medium bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Recall Direction (Written mode only) */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              Choose recall direction
            </h2>
            <p className="text-neutral-500 text-sm">
              What do you want to recall from memory?
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => setDirection("term_to_def")}
              className={`w-full p-5 rounded-xl border text-left transition-all ${
                direction === "term_to_def"
                  ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 border-transparent"
                  : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500"
              }`}
            >
              <span className="font-semibold">Term → Definition</span>
              <p className={`text-sm mt-1 ${direction === "term_to_def" ? "opacity-70" : "text-neutral-500"}`}>
                See the term, write what it means
              </p>
            </button>

            <button
              onClick={() => setDirection("def_to_term")}
              className={`w-full p-5 rounded-xl border text-left transition-all ${
                direction === "def_to_term"
                  ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 border-transparent"
                  : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500"
              }`}
            >
              <span className="font-semibold">Definition → Term</span>
              <p className={`text-sm mt-1 ${direction === "def_to_term" ? "opacity-70" : "text-neutral-500"}`}>
                See the definition, write the term
              </p>
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="flex-1 py-3 rounded-xl font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setStep(4)}
              disabled={!canProceedStep3}
              className="flex-1 py-3 rounded-xl font-medium bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Question Count */}
      {step === 4 && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              How many questions?
            </h2>
            <p className="text-neutral-500 text-sm">
              You have {totalSelected} entries available
            </p>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {COUNT_OPTIONS.map((c) => (
              <button
                key={c}
                onClick={() => setCount(c)}
                disabled={c > totalSelected}
                className={`py-4 rounded-xl font-semibold text-lg transition-all ${
                  c > totalSelected
                    ? "opacity-40 cursor-not-allowed bg-neutral-50 dark:bg-neutral-900 text-neutral-400"
                    : count === c
                      ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                      : "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(mode === "written" ? 3 : 2)}
              className="flex-1 py-3 rounded-xl font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleStart}
              className="flex-1 py-3 rounded-xl font-medium bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
            >
              Start Quiz
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
