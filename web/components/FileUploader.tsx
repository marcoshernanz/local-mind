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

  // Recursive function to traverse directories
  // We use 'any' here because FileSystemEntry types are not standard in all TS configs
  const traverseFileTree = async (item: any, path = ""): Promise<File[]> => {
    if (item.isFile) {
      return new Promise((resolve) => {
        item.file((file: File) => {
          resolve([file]);
        });
      });
    } else if (item.isDirectory) {
      const dirReader = item.createReader();
      return new Promise((resolve) => {
        dirReader.readEntries(async (entries: any[]) => {
          const entriesPromises = entries.map((entry) =>
            traverseFileTree(entry, path + item.name + "/")
          );
          const files = await Promise.all(entriesPromises);
          resolve(files.flat());
        });
      });
    }
    return [];
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
    console.log(`Processed ${count} files`);
    setProcessing(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!ready) return;

    const items = e.dataTransfer.items;
    const promises: Promise<File[]>[] = [];

    // Use DataTransferItemList interface to access file system entries
    for (let i = 0; i < items.length; i++) {
      const item = items[i].webkitGetAsEntry();
      if (item) {
        promises.push(traverseFileTree(item));
      }
    }

    const results = await Promise.all(promises);
    const flatFiles = results.flat();

    await processFiles(flatFiles);
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
        p-8 border-2 border-dashed rounded-xl w-full max-w-2xl text-center transition-all duration-200
        ${
          !ready
            ? "border-gray-700 bg-gray-800 opacity-50 cursor-not-allowed"
            : isDragging
            ? "border-blue-500 bg-blue-500/10 scale-105"
            : "border-gray-600 hover:border-gray-500 hover:bg-gray-800"
        }
      `}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="text-4xl">📂</div>
        <div>
          <p className="text-lg font-medium mb-1">
            {processing
              ? "Processing files..."
              : "Drag & Drop files or folders"}
          </p>
          <p className="text-sm text-gray-400">Supports .txt and .md files</p>
        </div>

        <label className="relative cursor-pointer">
          <span className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Browse Files
          </span>
          <input
            type="file"
            multiple // Allow multiple selection
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
