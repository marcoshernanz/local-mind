"use client";

import FileUploader from "@/components/FileUploader";
import { useEffect, useState } from "react";
// import init, { add } from "../pkg/local_mind_core";

export default function Home() {
  const [db, setDb] = useState<any>(null); // Tipar como 'any' temporalmente para evitar líos de TS hoy

  useEffect(() => {
    async function init() {
      const wasm = await import("../pkg/local_mind_core");

      await wasm.default();

      const database = new wasm.VectorDatabase();
      setDb(database);

      console.log("Base de datos Rust inicializada en memoria.");
    }
    init();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center p-24 bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-8">Local Mind 🧠</h1>

      <FileUploader db={db} />

      {db && (
        <div className="mt-8 p-4 bg-gray-800 rounded">
          <h2 className="text-xl mb-2">Debug View</h2>
          <p>Documentos (Chunks) en RAM de Rust: {db.get_count()}</p>
          <button
            onClick={() => alert(db.debug_print_chunk(0))}
            className="mt-2 text-xs bg-blue-600 px-2 py-1 rounded"
          >
            Ver primer Chunk
          </button>
        </div>
      )}
    </main>
  );
}
