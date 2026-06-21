use llama_cpp_4::{
    llama_backend::LlamaBackend,
    llama_batch::LlamaBatch,
    model::{params::LlamaModelParams, AddBos, LlamaModel, Special},
    context::params::LlamaContextParams,
    sampling::LlamaSampler,
};
use std::num::NonZeroU32;
use std::path::Path;

/// System prompt for text polishing
const SYSTEM_PROMPT: &str = r#"You are a text polishing assistant. Your job is to clean up speech-to-text output.

Rules:
- Fix grammar and punctuation errors
- Remove filler words (um, uh, like, you know)
- Keep the original meaning and tone
- Do NOT add new information
- Do NOT explain your changes
- Output ONLY the corrected text, nothing else
- If the input is in Chinese, output in Chinese
- If the input is in English, output in English"#;

/// LLM engine for text polishing using Gemma 3 1B
pub struct LlmEngine {
    backend: LlamaBackend,
    model: LlamaModel,
}

impl LlmEngine {
    /// Load a GGUF model file
    pub fn new(model_path: &Path) -> Result<Self, LlmError> {
        log::info!("Loading LLM model from: {:?}", model_path);

        if !model_path.exists() {
            return Err(LlmError::ModelNotFound(
                model_path.to_string_lossy().to_string(),
            ));
        }

        let backend = LlamaBackend::init()
            .map_err(|e| LlmError::LoadError(e.to_string()))?;

        let model_params = LlamaModelParams::default();

        let model = LlamaModel::load_from_file(&backend, model_path.to_str().unwrap(), &model_params)
            .map_err(|e| LlmError::LoadError(e.to_string()))?;

        log::info!("LLM model loaded successfully");
        Ok(Self { backend, model })
    }

    /// Polish/clean up raw transcription text
    pub fn polish(&self, raw_text: &str) -> Result<String, LlmError> {
        log::info!("Polishing text: \"{}\"", raw_text);

        if raw_text.trim().is_empty() {
            return Ok(String::new());
        }

        // Build the prompt
        let prompt = format!(
            "<start_of_turn>user\n{}\n\nText to polish:\n{}<end_of_turn>\n<start_of_turn>model\n",
            SYSTEM_PROMPT, raw_text
        );

        // Create context
        let ctx_params = LlamaContextParams::default()
            .with_n_ctx(NonZeroU32::new(2048));

        let mut ctx = self.model.new_context(&self.backend, ctx_params)
            .map_err(|e| LlmError::InferenceError(e.to_string()))?;

        // Tokenize the prompt
        let tokens = self.model.str_to_token(&prompt, AddBos::Always)
            .map_err(|e| LlmError::InferenceError(e.to_string()))?;

        // Create batch and fill with prompt tokens
        let mut batch = LlamaBatch::new(2048, 1);
        for (i, &tok) in tokens.iter().enumerate() {
            let is_last = i == tokens.len() - 1;
            batch.add(tok, i as i32, &[0], is_last)
                .map_err(|e| LlmError::InferenceError(e.to_string()))?;
        }

        // Decode the prompt
        ctx.decode(&mut batch)
            .map_err(|e| LlmError::InferenceError(e.to_string()))?;

        // Generate tokens
        let mut output_tokens = Vec::new();
        let max_tokens = 256;
        let mut n_cur = tokens.len() as i32;

        let sampler = LlamaSampler::chain_simple([
            LlamaSampler::temp(0.1),
            LlamaSampler::greedy(),
        ]);

        for _ in 0..max_tokens {
            let new_token = sampler.sample(&ctx, batch.n_tokens() - 1);

            // Check for EOS
            if self.model.is_eog_token(new_token) {
                break;
            }

            output_tokens.push(new_token);

            // Prepare next batch
            batch.clear();
            batch.add(new_token, n_cur, &[0], true)
                .map_err(|e| LlmError::InferenceError(e.to_string()))?;
            n_cur += 1;

            ctx.decode(&mut batch)
                .map_err(|e| LlmError::InferenceError(e.to_string()))?;
        }

        // Detokenize
        let result: String = output_tokens
            .iter()
            .map(|&tok| self.model.token_to_str(tok, Special::Tokenize).unwrap_or_default())
            .collect();

        let polished = result.trim().to_string();
        log::info!("Polished result: \"{}\"", polished);
        Ok(polished)
    }
}

#[derive(Debug)]
pub enum LlmError {
    ModelNotFound(String),
    LoadError(String),
    InferenceError(String),
}

impl std::fmt::Display for LlmError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::ModelNotFound(p) => write!(f, "LLM model not found: {}", p),
            Self::LoadError(e) => write!(f, "Failed to load LLM model: {}", e),
            Self::InferenceError(e) => write!(f, "LLM inference error: {}", e),
        }
    }
}

impl std::error::Error for LlmError {}
