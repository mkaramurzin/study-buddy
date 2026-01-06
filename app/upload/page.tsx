"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

type UploadStatus = "idle" | "uploading" | "processing" | "success" | "error";

interface UploadResult {
  totalChunks: number;
  processedEntries: number;
  byType: Record<string, number>;
}

export default function UploadPage() {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files?.[0]?.type === "application/pdf") {
      setFile(files[0]);
      setError(null);
    } else {
      setError("Please upload a PDF file");
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files?.[0]) {
      setFile(files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setStatus("uploading");
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      setStatus("processing");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await response.json();
      setResult(data);
      setStatus("success");
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setStatus("error");
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
              href="/practice"
              className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
            >
              Practice
            </Link>
            <UserButton />
          </div>
        </nav>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
          Upload Document
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 mb-8">
          Upload a PDF of your commonplace book to extract and classify entries.
        </p>

        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-xl p-12 text-center transition-colors
            ${
              dragActive
                ? "border-neutral-400 bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-900"
                : "border-neutral-300 dark:border-neutral-700"
            }
            ${status === "processing" ? "pointer-events-none opacity-50" : ""}
          `}
        >
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={status === "processing"}
          />

          <div className="space-y-4">
            <div className="w-12 h-12 mx-auto bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-neutral-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>

            {file ? (
              <div>
                <p className="font-medium text-neutral-900 dark:text-neutral-100">
                  {file.name}
                </p>
                <p className="text-sm text-neutral-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div>
                <p className="font-medium text-neutral-900 dark:text-neutral-100">
                  Drop your PDF here
                </p>
                <p className="text-sm text-neutral-500">or click to browse</p>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {file && status !== "success" && (
          <button
            onClick={handleUpload}
            disabled={status === "processing" || status === "uploading"}
            className="mt-6 w-full py-3 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === "uploading" && "Uploading..."}
            {status === "processing" && "Processing entries..."}
            {(status === "idle" || status === "error") && "Process Document"}
          </button>
        )}

        {status === "processing" && (
          <div className="mt-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-neutral-300 border-t-neutral-900 dark:border-neutral-700 dark:border-t-neutral-100" />
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              Extracting and classifying entries with AI...
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              This may take a few minutes for large documents.
            </p>
          </div>
        )}

        {result && status === "success" && (
          <div className="mt-6 p-6 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
            <h3 className="font-semibold text-green-800 dark:text-green-200 mb-3">
              Processing Complete!
            </h3>
            <div className="space-y-2 text-sm text-green-700 dark:text-green-300">
              <p>Total chunks processed: {result.totalChunks}</p>
              <p>Entries saved: {result.processedEntries}</p>
              {Object.keys(result.byType).length > 0 && (
                <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                  <p className="font-medium mb-2">By type:</p>
                  <div className="grid grid-cols-2 gap-1">
                    {Object.entries(result.byType).map(([type, count]) => (
                      <p key={type}>
                        {type}: {count}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="mt-4 flex gap-3">
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                View Entries
              </Link>
              <button
                onClick={() => {
                  setStatus("idle");
                  setResult(null);
                }}
                className="px-4 py-2 border border-green-300 dark:border-green-700 rounded-lg hover:bg-green-100 dark:hover:bg-green-900 transition-colors text-sm"
              >
                Upload Another
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
