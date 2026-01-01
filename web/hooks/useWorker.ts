import { useEffect, useRef, useState, useCallback } from "react";
import { SearchResult, UploadStatus, InitProgress } from "../types";

export function useWorker() {
  const workerRef = useRef<Worker | null>(null);
  const [ready, setReady] = useState(false);
  const [initProgress, setInitProgress] = useState<InitProgress | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [uploads, setUploads] = useState<Record<string, UploadStatus>>({});
  const [docCount, setDocCount] = useState(0);
  const [documents, setDocuments] = useState<string[]>([]);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL("../app/worker.ts", import.meta.url)
    );

    workerRef.current.onmessage = (e) => {
      const { type, payload } = e.data;

      switch (type) {
        case "INIT_PROGRESS":
          setInitProgress(payload);
          break;
        case "READY":
          setReady(true);
          setInitProgress(null);
          break;
        case "RESTORED_DOCS":
          const restoredIds = payload as string[];
          setDocuments(restoredIds);
          setUploads((prev) => {
            const next = { ...prev };
            restoredIds.forEach((id) => {
              next[id] = {
                filename: id,
                status: "completed",
                progress: {
                  current: 0,
                  total: 0,
                  percent: 100,
                  etr: "Restored",
                  startTime: 0,
                },
              };
            });
            return next;
          });
          break;
        case "INDEX_PROGRESS":
          setUploads((prev) => {
            const fileStatus = prev[payload.filename];
            const currentStatus = fileStatus || {
              filename: payload.filename,
              status: "processing",
            };

            const now = Date.now();
            const startTime = currentStatus.progress?.startTime || now;

            let etr = "Calculating...";
            const elapsed = now - startTime;
            if (elapsed >= 1000 && payload.current > 0) {
              const rate = payload.current / elapsed;
              const remaining = (payload.total - payload.current) / rate;
              const seconds = Math.ceil(remaining / 1000);
              if (seconds < 60) {
                etr = `${seconds}s`;
              } else {
                etr = `${Math.ceil(seconds / 60)}m`;
              }
            }

            return {
              ...prev,
              [payload.filename]: {
                ...currentStatus,
                status: "processing",
                progress: {
                  current: payload.current,
                  total: payload.total,
                  percent: payload.percent,
                  startTime,
                  etr,
                },
              },
            };
          });
          break;
        case "SEARCH_RESULTS":
          setSearchResults(payload);
          setIsSearching(false);
          break;
        case "DOCUMENT_ADDED":
          setDocCount(payload.count);
          setDocuments((prev) => {
            if (prev.includes(payload.id)) return prev;
            return [...prev, payload.id];
          });
          setUploads((prev) => ({
            ...prev,
            [payload.id]: {
              ...prev[payload.id],
              status: "completed",
              progress: {
                current: 0,
                total: 0,
                startTime: 0,
                ...(prev[payload.id]?.progress || {}),
                percent: 100,
                etr: "Done",
              },
            },
          }));

          setTimeout(() => {
            setUploads((prev) => {
              if (prev[payload.id]?.status === "completed") {
                // Optional: remove from list or keep as completed
              }
              return prev;
            });
          }, 3000);
          break;
        case "ERROR":
          console.error("Worker error:", payload);
          setIsSearching(false);
          alert("An error occurred in the worker. Check console.");
          break;
      }
    };

    workerRef.current.postMessage({ type: "INIT" });

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const search = useCallback((query: string, allowedIds?: string[]) => {
    if (!workerRef.current || !query) return;
    setIsSearching(true);
    workerRef.current.postMessage({
      type: "SEARCH",
      payload: { query, allowedIds },
    });
  }, []);

  const addDocument = useCallback((file: File, content: string) => {
    if (!workerRef.current) return;

    setUploads((prev) => ({
      ...prev,
      [file.name]: {
        filename: file.name,
        status: "pending",
      },
    }));

    workerRef.current.postMessage({
      type: "ADD_DOCUMENT",
      payload: { id: file.name, content },
    });
  }, []);

  const cancelUpload = useCallback((filename: string) => {
    setUploads((prev) => {
      const next = { ...prev };
      delete next[filename];
      return next;
    });
    workerRef.current?.postMessage({
      type: "CANCEL_DOCUMENT",
      payload: { id: filename },
    });
  }, []);

  return {
    ready,
    initProgress,
    searchResults,
    isSearching,
    uploads,
    docCount,
    documents,
    search,
    addDocument,
    cancelUpload,
  };
}
