import init, { VectorDatabase } from "../pkg/local_mind_core";
import { get, set } from "idb-keyval";

// Define the types of messages we can receive from the main thread
type WorkerMessage =
  | { type: "INIT" }
  | { type: "ADD_DOCUMENT"; payload: { id: string; content: string } }
  | { type: "SEARCH"; payload: { query: string } };

// Global state for the worker
let db: VectorDatabase | null = null;

/**
 * Fetches a file from the network, but checks the IndexedDB cache first.
 * This significantly speeds up subsequent loads by avoiding re-downloading large model files.
 *
 * @param url - The URL of the file to fetch.
 * @returns A Promise that resolves to the file content as an ArrayBuffer.
 */
async function fetchWithCache(url: string): Promise<ArrayBuffer> {
  // Extract the filename from the URL to use as the cache key.
  // e.g., "https://.../model.safetensors" -> "model.safetensors"
  const filename = url.split("/").pop() || "unknown";

  try {
    // 1. Try to get the file from IndexedDB
    // 'get' is a helper from idb-keyval that retrieves a value by key.
    const cachedFile = await get(filename);

    if (cachedFile) {
      console.log(`Worker: Loaded ${filename} from cache (IndexedDB).`);
      // If found, return it immediately.
      return cachedFile;
    }
  } catch (err) {
    // If IndexedDB fails (e.g., storage quota exceeded or privacy settings),
    // we just log a warning and proceed to fetch from the network.
    console.warn(`Worker: Failed to read from cache for ${filename}`, err);
  }

  // 2. If not in cache, fetch from the network
  console.log(`Worker: Fetching ${filename} from network...`);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }

  // Get the file content as an ArrayBuffer (raw binary data)
  const buffer = await response.arrayBuffer();

  // 3. Save the fetched file to IndexedDB for next time
  // We don't await this because we don't want to block the application start
  // just to save to cache. It happens in the background.
  set(filename, buffer)
    .then(() => console.log(`Worker: Cached ${filename} to IndexedDB.`))
    .catch((err) => console.error(`Worker: Failed to cache ${filename}`, err));

  return buffer;
}

// Initialize the WASM module and the Vector Database
async function initialize() {
  try {
    // Initialize the WASM module
    // We use the default export from the pkg which is the init function
    await init();

    // Create the database instance
    db = new VectorDatabase();

    console.log("Worker: WASM initialized, loading model...");

    // Fetch model files using our new caching strategy
    // We load all three required files in parallel using Promise.all
    const [weights, tokenizer, config] = await Promise.all([
      fetchWithCache(
        "https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2/resolve/main/model.safetensors"
      ),
      fetchWithCache(
        "https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2/resolve/main/tokenizer.json"
      ),
      fetchWithCache(
        "https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2/resolve/main/config.json"
      ),
    ]);

    // Load the model into the database
    // We pass the binary data (Uint8Array) to the Rust WASM module
    db.load_model(
      new Uint8Array(weights),
      new Uint8Array(tokenizer),
      new Uint8Array(config)
    );

    console.log("Worker: Model loaded!");

    // Notify the main thread that we are ready
    self.postMessage({ type: "READY" });
  } catch (e) {
    console.error("Worker: Failed to initialize", e);
    self.postMessage({ type: "ERROR", payload: String(e) });
  }
}

// Handle messages from the main thread
self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const msg = e.data;

  switch (msg.type) {
    case "INIT":
      await initialize();
      break;

    case "ADD_DOCUMENT":
      if (!db) return;
      const { id, content } = msg.payload;
      try {
        console.log(`Worker: Adding document ${id}...`);
        db.add_document(id, content);
        const count = db.get_count();
        self.postMessage({ type: "DOCUMENT_ADDED", payload: count });
      } catch (err) {
        self.postMessage({ type: "ERROR", payload: String(err) });
      }
      break;

    case "SEARCH":
      if (!db) return;
      const { query } = msg.payload;
      try {
        // Perform the search
        // This is the heavy lifting that would freeze the UI if done on the main thread
        const results = db.search(query, 5, 0.5);
        self.postMessage({ type: "SEARCH_RESULTS", payload: results });
      } catch (err) {
        self.postMessage({ type: "ERROR", payload: String(err) });
      }
      break;
  }
};
