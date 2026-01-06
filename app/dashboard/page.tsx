"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { EntryCard } from "@/components/entry-card";

const ENTRY_TYPES = [
  { value: "all", label: "All" },
  { value: "vocab", label: "Vocabulary" },
  { value: "quote", label: "Quotes" },
  { value: "phrase", label: "Phrases" },
  { value: "thought_wrapper", label: "Thought Wrappers" },
  { value: "reflection", label: "Reflections" },
];

interface Entry {
  id: string;
  type: string;
  title: string | null;
  content: string | null;
  tags: string[];
  vocabData: Record<string, unknown> | null;
  quoteData: Record<string, unknown> | null;
  phraseData: Record<string, unknown> | null;
  confidence: number;
  createdAt: string;
}

export default function DashboardPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedType !== "all") params.set("type", selectedType);
      if (searchQuery) params.set("search", searchQuery);

      const response = await fetch(`/api/entries?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setEntries(data.entries);
      }
    } catch (error) {
      console.error("Failed to fetch entries:", error);
    }
    setLoading(false);
  }, [selectedType, searchQuery]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;

    try {
      const response = await fetch("/api/entries", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        setEntries((prev) => prev.filter((e) => e.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete entry:", error);
    }
  };

  // Count entries by type
  const typeCounts = entries.reduce(
    (acc, entry) => {
      acc[entry.type] = (acc[entry.type] || 0) + 1;
      acc.all = (acc.all || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="border-b border-neutral-200 dark:border-neutral-800">
        <nav className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link
            href="/"
            className="text-lg font-semibold text-neutral-900 dark:text-neutral-100"
          >
            Commonplace
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/upload"
              className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
            >
              Upload
            </Link>
            <Link
              href="/practice"
              className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
            >
              Practice
            </Link>
            <UserButton />
          </div>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Your Entries
          </h1>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-400"
            />
            <Link
              href="/upload"
              className="px-4 py-2 bg-neutral-900 text-white text-sm rounded-lg hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 transition-colors"
            >
              Upload PDF
            </Link>
          </div>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {ENTRY_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => setSelectedType(type.value)}
              className={`px-4 py-2 text-sm rounded-lg whitespace-nowrap transition-colors ${
                selectedType === type.value
                  ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                  : "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
            >
              {type.label}
              {typeCounts[type.value] !== undefined && (
                <span className="ml-2 opacity-60">
                  ({typeCounts[type.value] || 0})
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-neutral-300 border-t-neutral-900 dark:border-neutral-700 dark:border-t-neutral-100" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
            <p className="text-neutral-500 mb-4">No entries found</p>
            <Link
              href="/upload"
              className="text-neutral-900 dark:text-neutral-100 hover:underline"
            >
              Upload a document to get started
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {entries.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
