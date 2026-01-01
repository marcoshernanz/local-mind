use js_sys::Function;
use wasm_bindgen::prelude::*;

use crate::embedder::Embedder;
use crate::models::{SearchResult, TextChunk};
use crate::parser::{is_whatsapp_export, parse_whatsapp};
use crate::utils::dot_product;

#[wasm_bindgen]
pub struct VectorDatabase {
    chunks: Vec<TextChunk>,
    embedder: Option<Embedder>,
}

#[wasm_bindgen]
impl VectorDatabase {
    #[wasm_bindgen(constructor)]
    pub fn new() -> VectorDatabase {
        console_error_panic_hook::set_once();
        VectorDatabase {
            chunks: Vec::new(),
            embedder: None,
        }
    }

    pub fn export_database(&self) -> Result<JsValue, JsError> {
        Ok(serde_wasm_bindgen::to_value(&self.chunks).map_err(|e| JsError::new(&e.to_string()))?)
    }

    pub fn import_database(&mut self, data: JsValue) -> Result<(), JsError> {
        let chunks: Vec<TextChunk> =
            serde_wasm_bindgen::from_value(data).map_err(|e| JsError::new(&e.to_string()))?;
        self.chunks = chunks;
        Ok(())
    }

    pub fn get_document_ids(&self) -> Vec<String> {
        let mut ids: Vec<String> = self.chunks.iter().map(|c| c.doc_id.clone()).collect();
        ids.sort();
        ids.dedup();
        ids
    }

    pub fn load_model(
        &mut self,
        weights: &[u8],
        tokenizer_data: &[u8],
        config_data: &[u8],
    ) -> Result<(), JsError> {
        self.embedder = Some(Embedder::load(weights, tokenizer_data, config_data)?);
        Ok(())
    }

    pub fn add_document(
        &mut self,
        id: String,
        content: String,
        on_progress: Option<Function>,
    ) -> Result<(), JsError> {
        if self.embedder.is_none() {
            return Err(JsError::new("Model not loaded"));
        }

        if !is_whatsapp_export(&content) {
            return Err(JsError::new(
                "Document does not appear to be a valid WhatsApp export.",
            ));
        }

        let chunks_data = parse_whatsapp(&content);

        // Filter empty chunks first
        let valid_chunks: Vec<_> = chunks_data
            .into_iter()
            .filter(|(t, _, _)| !t.trim().is_empty())
            .collect();

        let total_valid = valid_chunks.len();

        for (i, (chunk_text, sender, date)) in valid_chunks.into_iter().enumerate() {
            if let Some(callback) = &on_progress {
                let _ = callback.call2(
                    &JsValue::NULL,
                    &JsValue::from(i as u32),
                    &JsValue::from(total_valid as u32),
                );
            }

            let embedding = self
                .embedder
                .as_ref()
                .unwrap()
                .compute_embedding(&chunk_text)?;

            let chunk = TextChunk {
                doc_id: id.clone(),
                content: chunk_text,
                sender,
                date,
                embedding,
            };
            self.chunks.push(chunk);
        }

        Ok(())
    }

    pub fn search(
        &self,
        query: String,
        top_k: usize,
        threshold: f32,
        allowed_ids: Option<Vec<String>>,
    ) -> Result<JsValue, JsError> {
        if self.embedder.is_none() {
            return Err(JsError::new("Model not loaded"));
        }

        let query_embedding = self.embedder.as_ref().unwrap().compute_embedding(&query)?;

        // Hybrid Search: Prepare query tokens for keyword matching
        // We split by whitespace and remove non-alphanumeric characters
        let query_tokens: Vec<String> = query
            .to_lowercase()
            .split_whitespace()
            .map(|s| {
                s.chars()
                    .filter(|c| c.is_alphanumeric())
                    .collect::<String>()
            })
            .filter(|s| !s.is_empty())
            .collect();

        let mut scores: Vec<(usize, f32)> = self
            .chunks
            .iter()
            .enumerate()
            .filter(|(_, chunk)| {
                if let Some(allowed) = &allowed_ids {
                    allowed.contains(&chunk.doc_id)
                } else {
                    true
                }
            })
            .map(|(i, chunk)| {
                // 1. Vector Score (Semantic Meaning)
                // Dot product of normalized vectors = Cosine Similarity
                let vector_score = dot_product(&query_embedding, &chunk.embedding);

                // 2. Keyword Score (Exact Match)
                // Simple "Bag of Words" overlap
                let chunk_lower = chunk.content.to_lowercase();
                let mut matches = 0;
                for token in &query_tokens {
                    if chunk_lower.contains(token) {
                        matches += 1;
                    }
                }

                let keyword_score = if query_tokens.is_empty() {
                    0.0
                } else {
                    matches as f32 / query_tokens.len() as f32
                };

                // 3. Hybrid Score (Weighted Combination)
                // We give 70% weight to meaning (Vector) and 30% to exact matches (Keyword).
                // This ensures that if a user types a specific name or ID, it gets boosted.
                let hybrid_score = (vector_score * 0.7) + (keyword_score * 0.3);

                (i, hybrid_score)
            })
            .collect();

        scores.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));

        let results: Vec<SearchResult> = scores
            .into_iter()
            .filter(|(_, score)| *score >= threshold)
            .take(top_k)
            .map(|(i, score)| SearchResult {
                doc_id: self.chunks[i].doc_id.clone(),
                content: self.chunks[i].content.clone(),
                sender: self.chunks[i].sender.clone(),
                date: self.chunks[i].date.clone(),
                score,
            })
            .collect();

        Ok(serde_wasm_bindgen::to_value(&results)?)
    }

    pub fn get_count(&self) -> usize {
        self.chunks.len()
    }

    pub fn debug_print_chunk(&self, index: usize) -> String {
        if index < self.chunks.len() {
            format!(
                "[{}] {}",
                self.chunks[index].doc_id, self.chunks[index].content
            )
        } else {
            "Index out of bounds".to_string()
        }
    }
}
