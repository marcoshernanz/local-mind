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
    <main className="flex min-h-screen flex-col items-center p-24 bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-8">
        Local Mind 🧠 (Worker Edition)
      </h1>

      <ModelLoading ready={ready} initProgress={initProgress} />

      <FileUploader onUpload={addDocument} ready={ready} />

      <UploadProgress uploads={uploads} />

      <div className="w-full max-w-2xl mt-8">
        <ChatFilter
          documents={documents}
          selected={selectedDocs}
          onToggle={toggleDoc}
          onToggleAll={toggleAll}
        />

        <div className="flex gap-2 mb-4">
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
            disabled={!ready || isSearching}
            className="bg-blue-600 px-4 py-2 rounded disabled:opacity-50"
          >
            {isSearching ? "..." : "Search"}
          </button>
        </div>

        <SearchResults results={searchResults} />
      </div>
    </main>
  );
}
