"use client";

import { useState } from "react";

// Generic metadata type - structure varies by entry type
type Metadata = Record<string, unknown>;

// Helper to safely get string from unknown metadata field
const str = (val: unknown): string | null => {
  if (typeof val === "string" && val.trim()) return val;
  return null;
};

interface Entry {
  id: string;
  type: string;
  title: string | null;
  content: string | null;
  tags: string[];
  metadata: Metadata | null;
  confidence: number;
  createdAt: string;
}

interface EntryCardProps {
  entry: Entry;
  onDelete?: (id: string) => void;
}

const typeColors: Record<string, string> = {
  concept: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  principle: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  quote: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  example: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  procedure: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  question: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  connection: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  note: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200",
  reference: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  template: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
  unknown: "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200",
};

export function EntryCard({ entry, onDelete }: EntryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const m = entry.metadata || {};

  const renderConcept = () => (
    <div className="space-y-2">
      <div>
        <span className="font-semibold text-neutral-900 dark:text-neutral-100">
          {str(m.term) || entry.title || ""}
        </span>
        {str(m.field) && (
          <span className="ml-2 text-sm text-neutral-500">({str(m.field)})</span>
        )}
      </div>
      {str(m.definition) && (
        <p className="text-neutral-700 dark:text-neutral-300">{str(m.definition)}</p>
      )}
      {Array.isArray(m.examples) && m.examples.length > 0 && (
        <p className="text-sm text-neutral-600 dark:text-neutral-400 italic">
          Example: {m.examples.map(String).join("; ")}
        </p>
      )}
    </div>
  );

  const renderPrinciple = () => (
    <div className="space-y-2">
      <p className="font-semibold text-neutral-900 dark:text-neutral-100">
        {str(m.name) || entry.title || ""}
      </p>
      {str(m.statement) && (
        <p className="text-neutral-700 dark:text-neutral-300">{str(m.statement)}</p>
      )}
      {str(m.domain) && (
        <p className="text-sm text-neutral-500">Domain: {str(m.domain)}</p>
      )}
      {str(m.conditions) && (
        <p className="text-sm text-neutral-600 dark:text-neutral-400 italic">
          Conditions: {str(m.conditions)}
        </p>
      )}
    </div>
  );

  const renderQuote = () => (
    <div className="space-y-2">
      <blockquote className="text-neutral-700 dark:text-neutral-300 border-l-2 border-neutral-300 dark:border-neutral-600 pl-4 italic">
        &ldquo;{str(m.text) || entry.content || ""}&rdquo;
      </blockquote>
      {str(m.author) && <p className="text-sm text-neutral-500">— {str(m.author)}</p>}
      {str(m.source) && <p className="text-sm text-neutral-500">Source: {str(m.source)}</p>}
    </div>
  );

  const renderExample = () => (
    <div className="space-y-2">
      <p className="font-semibold text-neutral-900 dark:text-neutral-100">
        {str(m.title) || entry.title || ""}
      </p>
      {str(m.description) && (
        <p className="text-neutral-700 dark:text-neutral-300">{str(m.description)}</p>
      )}
      {str(m.demonstrates) && (
        <p className="text-sm text-neutral-500">Demonstrates: {str(m.demonstrates)}</p>
      )}
    </div>
  );

  const renderProcedure = () => (
    <div className="space-y-2">
      <p className="font-semibold text-neutral-900 dark:text-neutral-100">
        {str(m.name) || entry.title || ""}
      </p>
      {Array.isArray(m.steps) && m.steps.length > 0 && (
        <ol className="list-decimal list-inside space-y-1 text-neutral-700 dark:text-neutral-300">
          {m.steps.map((step, i) => (
            <li key={i}>{String(step)}</li>
          ))}
        </ol>
      )}
      {str(m.notes) && (
        <p className="text-sm text-neutral-500 italic">{str(m.notes)}</p>
      )}
    </div>
  );

  const renderQuestion = () => (
    <div className="space-y-2">
      <p className="font-semibold text-neutral-900 dark:text-neutral-100">
        {str(m.question) || entry.title || ""}
      </p>
      {str(m.context) && (
        <p className="text-neutral-700 dark:text-neutral-300">{str(m.context)}</p>
      )}
      {str(m.possible_answer) && (
        <p className="text-sm text-neutral-500 italic">
          Possible answer: {str(m.possible_answer)}
        </p>
      )}
    </div>
  );

  const renderConnection = () => (
    <div className="space-y-2">
      {str(m.idea_a) && str(m.idea_b) && (
        <p className="font-medium text-neutral-900 dark:text-neutral-100">
          {str(m.idea_a)} ↔ {str(m.idea_b)}
        </p>
      )}
      {str(m.relationship) && (
        <p className="text-neutral-700 dark:text-neutral-300">{str(m.relationship)}</p>
      )}
      {str(m.insight) && (
        <p className="text-sm text-neutral-500 italic">Insight: {str(m.insight)}</p>
      )}
    </div>
  );

  const renderContent = () => {
    if (!entry.metadata) {
      return (
        <div>
          {entry.title && (
            <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-1">
              {entry.title}
            </h4>
          )}
          {entry.content && (
            <p className="text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
              {expanded ? entry.content : entry.content.slice(0, 300)}
              {!expanded && entry.content.length > 300 && "..."}
            </p>
          )}
        </div>
      );
    }

    switch (entry.type) {
      case "concept": return renderConcept();
      case "principle": return renderPrinciple();
      case "quote": return renderQuote();
      case "example": return renderExample();
      case "procedure": return renderProcedure();
      case "question": return renderQuestion();
      case "connection": return renderConnection();
      default:
        return (
          <div>
            {entry.title && (
              <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                {entry.title}
              </h4>
            )}
            {entry.content && (
              <p className="text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
                {expanded ? entry.content : entry.content.slice(0, 300)}
                {!expanded && entry.content.length > 300 && "..."}
              </p>
            )}
          </div>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <span
          className={`text-xs font-medium px-2 py-1 rounded ${
            typeColors[entry.type] || typeColors.unknown
          }`}
        >
          {entry.type}
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
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {entry.content && entry.content.length > 300 && (
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
