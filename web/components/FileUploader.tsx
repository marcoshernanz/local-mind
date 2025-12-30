"use client";
import { useState } from "react";

interface RustDatabase {
  add_document: (id: string, content: string) => void;
  get_count: () => number;
}

export default function FileUploader({ db }: { db: RustDatabase | null }) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !db) return;

    setUploading(true);
    const file = e.target.files[0];

    try {
      const text = await file.text();

      console.log(`Leídos ${text.length} caracteres de JS.`);

      const startTime = performance.now();

      db.add_document(file.name, text);

      const endTime = performance.now();
      console.log(`Rust tardó ${endTime - startTime}ms en procesar e indexar.`);

      alert(`Guardado! Total documentos en Rust: ${db.get_count()}`);
    } catch (err) {
      console.error("Error leyendo fichero:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 border-2 border-dashed border-gray-600 rounded-lg">
      <input
        type="file"
        accept=".txt,.md,.json"
        onChange={handleFileChange}
        disabled={!db || uploading}
        className="text-white"
      />
      {uploading && <p className="text-yellow-400">Procesando en Rust...</p>}
    </div>
  );
}
