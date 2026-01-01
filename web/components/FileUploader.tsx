"use client";
import { useState } from "react";

interface FileUploaderProps {
  onUpload: (file: File, content: string) => void;
  ready: boolean;
}

export default function FileUploader({ onUpload, ready }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Helper to read file content
  const readFileContent = (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        onUpload(file, text);
        resolve();
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const processFiles = async (files: File[]) => {
    setProcessing(true);
    let count = 0;
    for (const file of files) {
      // Filter for text/md files
      if (file.name.endsWith(".txt") || file.name.endsWith(".md")) {
        try {
          await readFileContent(file);
          count++;
        } catch (e) {
          console.error("Error reading file", file.name, e);
        }
      }
    }
    // console.log(`Processed ${count} files`);
    setProcessing(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!ready) return;

    const items = e.dataTransfer.items;
    const files: File[] = [];

    // Only process files, ignore directories
    for (let i = 0; i < items.length; i++) {
      const item = items[i].webkitGetAsEntry();
      if (item && item.isFile) {
        const file = items[i].getAsFile();
        if (file) {
          files.push(file);
        }
      }
    }

    await processFiles(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && ready) {
      await processFiles(Array.from(e.target.files));
      e.target.value = ""; // Reset input
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`
        group relative overflow-hidden rounded-xl border border-dashed transition-all duration-300
        ${
          !ready
            ? "border-zinc-800 bg-zinc-900/30 opacity-50 cursor-not-allowed"
            : isDragging
            ? "border-indigo-500/50 bg-indigo-500/10 scale-[1.02]"
            : "border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/50 bg-zinc-900/20"
        }
      `}
    >
      <div className="flex flex-col items-center justify-center gap-3 py-12 px-4 text-center">
        <div
          className={`
          p-3 rounded-full bg-zinc-900 border border-zinc-800 transition-transform duration-300
          ${
            isDragging
              ? "scale-110 border-indigo-500/30"
              : "group-hover:scale-105"
          }
        `}
        >
          <span className="text-2xl">📂</span>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium text-zinc-300">
            {processing
              ? "Processing files..."
              : "Drop your WhatsApp exports here"}
          </p>
          <p className="text-xs text-zinc-500">Supports .txt files</p>
        </div>

        <label className="relative mt-2 cursor-pointer">
          <span className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
            or browse files
          </span>
          <input
            type="file"
            multiple
            accept=".txt,.md"
            onChange={handleInputChange}
            disabled={!ready || processing}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
}
