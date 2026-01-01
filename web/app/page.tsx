"use client";

import { useState, useEffect, useRef } from "react";
import FileUploader from "../components/FileUploader";
import ModelLoading from "../components/ModelLoading";
import SearchResults from "../components/SearchResults";
import UploadProgress from "../components/UploadProgress";
import ChatFilter from "../components/ChatFilter";
import { useWorker } from "../hooks/useWorker";

export default function Home() {
  const {
    ready,
    initProgress,
    searchResults,
    isSearching,
    uploads,
    search,
    addDocument,
    documents,
  } = useWorker();

  const [query, setQuery] = useState("");
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const knownDocsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const newDocs = documents.filter((d) => !knownDocsRef.current.has(d));
    if (newDocs.length > 0) {
      setSelectedDocs((prev) => {
        const next = new Set(prev);
        newDocs.forEach((d) => next.add(d));
        return next;
      });
      newDocs.forEach((d) => knownDocsRef.current.add(d));
    }
  }, [documents]);

  const handleSearch = () => {
    search(query, Array.from(selectedDocs));
  };

  const toggleDoc = (id: string) => {
    setSelectedDocs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = (select: boolean) => {
    if (select) {
      setSelectedDocs(new Set(documents));
    } else {
      setSelectedDocs(new Set());
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center py-24 px-6 bg-zinc-950 text-zinc-100 selection:bg-indigo-500/30">
      <div className="w-full max-w-3xl flex flex-col gap-8">
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
            Local Mind
          </h1>
          <p className="text-zinc-500 text-sm">
            Your private second brain, running entirely in your browser.
          </p>
        </div>

        <ModelLoading ready={ready} initProgress={initProgress} />

        <div className="space-y-6">
          <FileUploader onUpload={addDocument} ready={ready} />

          <UploadProgress uploads={uploads} />

          <div className="space-y-4">
            <ChatFilter
              documents={documents}
              selected={selectedDocs}
              onToggle={toggleDoc}
              onToggleAll={toggleAll}
            />

            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative flex gap-3 bg-zinc-900/50 p-2 rounded-xl border border-zinc-800/50 shadow-lg backdrop-blur-sm focus-within:border-zinc-700 transition-colors">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask something about your documents..."
                  className="flex-1 bg-transparent px-4 py-3 outline-none text-zinc-100 placeholder:text-zinc-600"
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <button
                  onClick={handleSearch}
                  disabled={!ready || isSearching}
                  className="bg-zinc-100 text-zinc-900 px-6 py-2 rounded-lg font-medium hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  {isSearching ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 border-2 border-zinc-900/30 border-t-zinc-900 rounded-full animate-spin" />
                      Thinking
                    </span>
                  ) : (
                    "Search"
                  )}
                </button>
              </div>
            </div>

            <SearchResults results={searchResults} />
          </div>
        </div>
      </div>
    </main>
  );
}
