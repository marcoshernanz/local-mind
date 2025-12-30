use wasm_bindgen::prelude::*;

struct TextChunk {
    doc_id: String,
    content: String,
}

#[wasm_bindgen]
pub struct VectorDatabase {
    chunks: Vec<TextChunk>,
}

#[wasm_bindgen]
impl VectorDatabase {
    #[wasm_bindgen(constructor)]
    pub fn new() -> VectorDatabase {
        VectorDatabase { chunks: Vec::new() }
    }

    pub fn add_document(&mut self, id: String, content: String) {
        let paragraphs = content.split("\n\n");

        for p in paragraphs {
            let clean_text = p.trim();
            if !clean_text.is_empty() {
                let chunk = TextChunk {
                    doc_id: id.clone(),
                    content: clean_text.to_string(),
                };
                self.chunks.push(chunk);
            }
        }
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
