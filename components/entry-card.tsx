"use client";

import { useState } from "react";

interface VocabData {
  term?: string;
  part_of_speech?: string;
  definition?: string;
  example_sentence?: string;
  reciprocal_word?: string;
  synonyms?: string[];
}

interface QuoteData {
  quote?: string;
  author?: string;
  context?: string;
}

interface PhraseData {
  phrase?: string;
  phrase_type?: string;
  source_context?: string;
  why_it_stood_out?: string;
}

interface Entry {
  id: string;
  type: string;
  title: string | null;
  content: string | null;
  tags: string[];
  vocabData: VocabData | null;
  quoteData: QuoteData | null;
  phraseData: PhraseData | null;
  confidence: number;
  createdAt: string;
}

interface EntryCardProps {
  entry: Entry;
  onDelete?: (id: string) => void;
}

const typeColors: Record<string, string> = {
  vocab: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  quote: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  phrase: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  thought_wrapper: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  prompt: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  reflection: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  unknown: "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200",
};

export function EntryCard({ entry, onDelete }: EntryCardProps) {
  const [expanded, setExpanded] = useState(false);

  const renderVocab = (vocab: VocabData) => (
    <div className="space-y-2">
      <div>
        <span className="font-semibold text-neutral-900 dark:text-neutral-100">
          {vocab.term}
        </span>
        {vocab.part_of_speech && (
          <span className="ml-2 text-sm italic text-neutral-500">
            ({vocab.part_of_speech})
          </span>
        )}
      </div>
      {vocab.definition && (
        <p className="text-neutral-700 dark:text-neutral-300">
          {vocab.definition}
        </p>
      )}
      {vocab.example_sentence && (
        <p className="text-sm text-neutral-600 dark:text-neutral-400 italic">
          &ldquo;{vocab.example_sentence}&rdquo;
        </p>
      )}
      {vocab.reciprocal_word && (
        <p className="text-sm text-neutral-500">
          <span className="font-medium">Opposite:</span> {vocab.reciprocal_word}
        </p>
      )}
      {vocab.synonyms && vocab.synonyms.length > 0 && (
        <p className="text-sm text-neutral-500">
          <span className="font-medium">Synonyms:</span>{" "}
          {vocab.synonyms.join(", ")}
        </p>
      )}
    </div>
  );

  const renderQuote = (quote: QuoteData) => (
    <div className="space-y-2">
      <blockquote className="text-neutral-700 dark:text-neutral-300 border-l-2 border-neutral-300 dark:border-neutral-600 pl-4 italic">
        &ldquo;{quote.quote}&rdquo;
      </blockquote>
      {quote.author && (
        <p className="text-sm text-neutral-500">— {quote.author}</p>
      )}
      {quote.context && (
        <p className="text-sm text-neutral-500">{quote.context}</p>
      )}
    </div>
  );

  const renderPhrase = (phrase: PhraseData) => (
    <div className="space-y-2">
      <p className="font-medium text-neutral-900 dark:text-neutral-100">
        {phrase.phrase}
      </p>
      {phrase.phrase_type && (
        <p className="text-sm text-neutral-500">Type: {phrase.phrase_type}</p>
      )}
      {phrase.source_context && (
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {phrase.source_context}
        </p>
      )}
      {phrase.why_it_stood_out && (
        <p className="text-sm text-neutral-500 italic">
          {phrase.why_it_stood_out}
        </p>
      )}
    </div>
  );

  const renderContent = () => {
    if (entry.type === "vocab" && entry.vocabData) {
      return renderVocab(entry.vocabData);
    }
    if (entry.type === "quote" && entry.quoteData) {
      return renderQuote(entry.quoteData);
    }
    if (entry.type === "phrase" && entry.phraseData) {
      return renderPhrase(entry.phraseData);
    }
    // Default fallback
    return (
      <div>
        {entry.title && (
          <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-1">
            {entry.title}
          </h4>
        )}
        {entry.content && (
          <p className="text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
            {entry.content}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <span
          className={`text-xs font-medium px-2 py-1 rounded ${
            typeColors[entry.type] || typeColors.unknown
          }`}
        >
          {entry.type.replace("_", " ")}
        </span>
        <div className="flex items-center gap-2">
          {entry.confidence > 0 && (
            <span className="text-xs text-neutral-400">
              {Math.round(entry.confidence * 100)}%
            </span>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(entry.id)}
              className="text-neutral-400 hover:text-red-500 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {renderContent()}

      {entry.tags && entry.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {entry.tags.map((tag, i) => (
            <span
              key={i}
              className="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 px-2 py-0.5 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {entry.content && entry.content.length > 200 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}
