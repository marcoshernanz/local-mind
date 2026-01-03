Demo gif
Demo image
How to use instructions
Record video
Security vulnerability

# ChatVault 🔒

**Your WhatsApp history, indexed locally with AI.**

ChatVault is a **local-first** semantic search engine for WhatsApp exports. It uses **Rust** and **WebAssembly** to run a BERT neural network directly in your browser.

**No servers. No data egress. 100% Private.**

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Rust](https://img.shields.io/badge/Built%20with-Rust-orange)
![WebAssembly](https://img.shields.io/badge/Component-WebAssembly-purple)

[Demo video]([/demo/demo_video.mp4](https://github.com/user-attachments/assets/98133bce-f5f8-49ad-adda-04d310bbddc0))

## 🚀 The Problem
WhatsApp's native search is strictly keyword-based. If you search for *"recommendations for sushi"*, it won't find the message where your friend said *"we should go to that japanese place on 5th"*.

**ChatVault** solves this by generating **vector embeddings** for your chats locally. It understands *meaning*, not just keywords.

## 🛠️ Tech Stack (The "How")

This project pushes the browser to its limits, combining high-performance systems programming with modern React patterns.

### Core (Systems Layer)
*   **Rust:** Memory-safe business logic and vector storage.
*   **Candle (Hugging Face):** Runs a quantized **BERT model (all-MiniLM-L6-v2)** inside Wasm for generating embeddings.
*   **WebAssembly (Wasm):** Compiles Rust to binary for near-native performance in the browser.
*   **Hybrid Search Algorithm:** Implements a custom scoring system combining **Cosine Similarity** (Vector) + **Keyword Matching** (BM25-style) for maximum accuracy.

### Frontend (Application Layer)
*   **Next.js 16 (App Router):** Modern React framework.
*   **Web Workers:** Offloads heavy AI inference and indexing to a background thread to keep the UI at **60fps**.
*   **IndexedDB:** Caches the model weights and vector index for instant subsequent loads.
*   **Tailwind CSS v4:** Fluid, responsive UI.

## ⚡ Performance & Engineering

### 1. Hybrid Search Implementation
Pure vector search can sometimes miss exact names or specific dates. ChatVault implements a weighted hybrid approach in Rust:

```rust
// Simplified logic from core/src/lib.rs
// We combine semantic meaning with exact keyword matches
let hybrid_score = (vector_score * 0.5) + (keyword_score * 0.5);

// Heuristics for noise reduction:
if content_len < 30 && keyword_score < 0.01 {
    // Penalize short messages that don't match keywords 
    // (Reduces noise like "ok", "cool", "lol")
    hybrid_score *= 0.4; 
}
```

### 2. Zero-Blocking Architecture
Running a Neural Network in JS usually freezes the browser. ChatVault uses a **Worker-first architecture**:
1.  **Main Thread:** Handles Drag & Drop and UI rendering.
2.  **Worker Thread:** Loads the 90MB Model, tokenizes text, runs inference, and performs the vector search.
3.  **Communication:** Uses generic message passing for non-blocking UI updates.

### 3. Smart Parsing
Includes custom Regex parsers for both **iOS** and **Android** WhatsApp export formats, handling multi-line messages and system notifications automatically.

## 📦 Installation

To run this locally:

1.  **Clone the repo**
    ```bash
    git clone https://github.com/marcoshernanz/chat-vault.git
    cd chat-vault
    ```

2.  **Install dependencies**
    ```bash
    npm install
    # Ensure you have Rust installed (rustup)
    cargo install wasm-pack
    ```

3.  **Run Development Server**
    This command compiles the Rust core to Wasm and starts the Next.js server concurrently.
    ```bash
    npm run dev:all
    ```

4.  Open `http://localhost:3000`

## 🔒 Privacy Note
**This application is 100% offline-capable.**
When you drop your WhatsApp text file, it is processed entirely within your device's RAM/WebAssembly memory. No data is ever sent to a server. You can disconnect your internet after the model loads and it will still work.

## 👤 Author

**Marcos Hernanz**
*   [GitHub](https://github.com/marcoshernanz)
*   [LinkedIn](https://linkedin.com/in/marcoshernanz)
*   [X (Twitter)](https://x.com/marcoshernanz)

---

*Built with ❤️ in Madrid. Looking for Summer 2026 roles in SF.*
