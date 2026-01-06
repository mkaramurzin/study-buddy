import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="border-b border-neutral-200 dark:border-neutral-800">
        <nav className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Studybase
          </h1>
          <div className="flex items-center gap-4">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100">
                  Sign in
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link
                href="/dashboard"
                className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
              >
                Dashboard
              </Link>
              <UserButton />
            </SignedIn>
          </div>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-20">
        <div className="text-center space-y-6">
          <h2 className="text-4xl font-bold text-neutral-900 dark:text-neutral-100">
            Study Your Knowledge Base
          </h2>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
            Upload your PDF documents and let AI help you practice
            and internalize concepts, principles, quotes, and more from any field of study.
          </p>

          <div className="flex justify-center gap-4 pt-4">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="px-6 py-3 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 transition-colors">
                  Get Started
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link
                href="/upload"
                className="px-6 py-3 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 transition-colors"
              >
                Upload Document
              </Link>
              <Link
                href="/practice"
                className="px-6 py-3 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
              >
                Practice
              </Link>
            </SignedIn>
          </div>
        </div>

        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <div className="p-6 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
            <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-5 h-5 text-neutral-600 dark:text-neutral-400"
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
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              Upload PDFs
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Import your documents and automatically extract concepts, principles,
              quotes, examples, procedures, and more.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
            <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-5 h-5 text-neutral-600 dark:text-neutral-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              AI Classification
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Entries are automatically classified and structured by type for
              effective studying.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
            <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-5 h-5 text-neutral-600 dark:text-neutral-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              Practice Chat
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Quiz yourself with an AI tutor that uses only your own collected
              material.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
