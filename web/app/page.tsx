"use client";

import FileUploader from "@/components/FileUploader";
import { useEffect, useRef, useState } from "react";

interface SearchResult {
  doc_id: string;
  content: string;
  sender?: string;
  date?: string;
  score: number;
}

export default function Home() {
  // We use a ref to store the worker instance so it persists across renders
  // without triggering re-renders itself.
  const workerRef = useRef<Worker | null>(null);

  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [docCount, setDocCount] = useState(0);

  // Queue state for multiple file uploads
  const [queueSize, setQueueSize] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);

  // Progress states
  const [initProgress, setInitProgress] = useState<{
    percent: number;
    status: string;
  } | null>(null);
  const [indexProgress, setIndexProgress] = useState<{
    filename: string;
    percent: number;
  } | null>(null);

  useEffect(() => {
    // Initialize the Web Worker
    // Web Workers allow us to run scripts in background threads.
    // This keeps the main thread (UI) responsive while performing heavy computations.
    workerRef.current = new Worker(new URL("./worker.ts", import.meta.url));

    // Set up the message handler to receive messages from the worker
    workerRef.current.onmessage = (e) => {
      const { type, payload } = e.data;
      // console.log("Main: Received message", type);

      switch (type) {
        case "INIT_PROGRESS":
          setInitProgress(payload);
          break;
        case "READY":
          setReady(true);
          setInitProgress(null);
          break;
        case "INDEX_PROGRESS":
          setIndexProgress(payload);
          break;
        case "SEARCH_RESULTS":
          setResults(payload);
          setSearching(false);
          break;
        case "DOCUMENT_ADDED":
          setDocCount(payload);
          setIndexProgress(null);
          // Increment processed count for the queue UI
          setProcessedCount((prev) => prev + 1);
          break;
        case "ERROR":
          console.error("Worker error:", payload);
          setSearching(false);
          setIndexProgress(null);
          alert("An error occurred in the worker. Check console.");
          break;
      }
    };

    // Send the initialization message to the worker
    workerRef.current.postMessage({ type: "INIT" });

    // Cleanup function to terminate the worker when the component unmounts
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const handleSearch = () => {
    if (!workerRef.current || !query) return;
    setSearching(true);
    // Send the search query to the worker
    workerRef.current.postMessage({
      type: "SEARCH",
      payload: { query },
    });
  };

  const handleUpload = (file: File, content: string) => {
    if (!workerRef.current) return;

    // Increment queue size when a file is added
    setQueueSize((prev) => prev + 1);

    // Send the document content to the worker for processing
    workerRef.current.postMessage({
      type: "ADD_DOCUMENT",
      payload: { id: file.name, content },
    });
  };

  // Reset queue when done
  useEffect(() => {
    if (queueSize > 0 && processedCount === queueSize) {
      const timer = setTimeout(() => {
        setQueueSize(0);
        setProcessedCount(0);
      }, 2000); // Hide after 2 seconds
      return () => clearTimeout(timer);
    }
  }, [processedCount, queueSize]);

  return (
    <main className="flex min-h-screen flex-col items-center p-24 bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-8">
        Local Mind 🧠 (Worker Edition)
      </h1>

      {/* Model Loading Progress Bar */}
      {!ready && (
        <div className="w-full max-w-2xl mb-8">
          <div className="flex justify-between text-sm text-gray-400 mb-1">
            <span>{initProgress?.status || "Initializing..."}</span>
            <span>{Math.round(initProgress?.percent || 0)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-blue-500 h-2.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${initProgress?.percent || 0}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            First load may take a while (90MB). Subsequent loads will be
            instant.
          </p>
        </div>
      )}

      <FileUploader onUpload={handleUpload} ready={ready} />

      {/* Queue Progress Indicator (Replaces the single file toast for bulk uploads) */}
      {queueSize > 0 && (
        <div className="fixed bottom-8 right-8 bg-gray-800 p-4 rounded-lg shadow-xl border border-gray-700 w-80 animate-fade-in">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-sm">Processing Queue</span>
            <span className="text-xs text-gray-400">
              {processedCount} / {queueSize}
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${(processedCount / queueSize) * 100}%` }}
            ></div>
          </div>
          {/* Show current file details if available */}
          {indexProgress && (
            <p className="text-xs text-gray-500 mt-2 truncate">
              Current: {indexProgress.filename} (
              {Math.round(indexProgress.percent)}%)
            </p>
          )}
        </div>
      )}

      {/* Indexing Progress Toast - Only show if queue is empty (single file upload) */}
      {indexProgress && queueSize === 0 && (
        <div className="fixed bottom-8 right-8 bg-gray-800 p-4 rounded-lg shadow-xl border border-gray-700 w-80 animate-fade-in">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-sm">Indexing Document</span>
            <span className="text-xs text-gray-400">
              {Math.round(indexProgress.percent)}%
            </span>
          </div>
          <p className="text-xs text-gray-400 mb-2 truncate">
            {indexProgress.filename}
          </p>
          <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-green-500 h-1.5 rounded-full transition-all duration-100"
              style={{ width: `${indexProgress.percent}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className="w-full max-w-2xl mt-8">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask something about your documents..."
            className="flex-1 p-2 rounded bg-gray-800 border border-gray-700 text-white"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={!ready || searching}
            className="bg-blue-600 px-4 py-2 rounded disabled:opacity-50"
          >
            {searching ? "..." : "Search"}
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {results.map((r, i) => (
            <div
              key={i}
              className="p-4 bg-gray-800 rounded border border-gray-700"
            >
              <p className="text-sm text-gray-400 mb-1">
                Source: {r.doc_id} (Score: {r.score.toFixed(4)})
                {r.sender && (
                  <span className="ml-2 text-blue-400">From: {r.sender}</span>
                )}
                {r.date && (
                  <span className="ml-2 text-green-400">Date: {r.date}</span>
                )}
              </p>
              <p>{r.content}</p>
            </div>
          ))}
        </div>
      </div>

      {ready && (
        <div className="mt-8 p-4 bg-gray-800 rounded w-full max-w-2xl">
          <h2 className="text-xl mb-2">Debug View</h2>
          <p>Documentos (Chunks) en RAM de Rust (Worker): {docCount}</p>
        </div>
      )}
    </main>
  );
}
