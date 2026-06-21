use std::path::Path;
use whisper_rs::{FullParams, SamplingStrategy, WhisperContext, WhisperContextParameters};

/// Whisper STT engine wrapper
pub struct WhisperEngine {
    ctx: WhisperContext,
}

impl WhisperEngine {
    /// Load a Whisper model from a .bin file
    pub fn new(model_path: &Path) -> Result<Self, WhisperError> {
        log::info!("Loading Whisper model from: {:?}", model_path);

        if !model_path.exists() {
            return Err(WhisperError::ModelNotFound(
                model_path.to_string_lossy().to_string(),
            ));
        }

        let ctx = WhisperContext::new_with_params(
            model_path.to_str().unwrap(),
            WhisperContextParameters::default(),
        )
        .map_err(|e| WhisperError::LoadError(e.to_string()))?;

        log::info!("Whisper model loaded successfully");
        Ok(Self { ctx })
    }

    /// Transcribe audio samples (16kHz mono f32) to text
    pub fn transcribe(&self, audio: &[f32]) -> Result<String, WhisperError> {
        log::info!("Transcribing {:.1}s of audio...", audio.len() as f32 / 16000.0);

        let mut state = self.ctx.create_state()
            .map_err(|e| WhisperError::InferenceError(e.to_string()))?;

        let mut params = FullParams::new(SamplingStrategy::Greedy { best_of: 1 });

        // Configure for real-time dictation
        params.set_n_threads(4);
        params.set_language(Some("auto"));
        params.set_translate(false);
        params.set_no_timestamps(true);
        params.set_print_special(false);
        params.set_print_progress(false);
        params.set_print_realtime(false);
        params.set_suppress_blank(true);
        params.set_suppress_non_speech_tokens(true);

        // Run inference
        state.full(params, audio)
            .map_err(|e| WhisperError::InferenceError(e.to_string()))?;

        // Collect all segments into a single string
        let num_segments = state.full_n_segments()
            .map_err(|e| WhisperError::InferenceError(e.to_string()))?;

        let mut text = String::new();
        for i in 0..num_segments {
            if let Ok(segment) = state.full_get_segment_text(i) {
                text.push_str(&segment);
            }
        }

        let result = text.trim().to_string();
        log::info!("Transcription result: \"{}\"", result);
        Ok(result)
    }
}

#[derive(Debug)]
pub enum WhisperError {
    ModelNotFound(String),
    LoadError(String),
    InferenceError(String),
}

impl std::fmt::Display for WhisperError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::ModelNotFound(p) => write!(f, "Whisper model not found: {}", p),
            Self::LoadError(e) => write!(f, "Failed to load Whisper model: {}", e),
            Self::InferenceError(e) => write!(f, "Whisper inference error: {}", e),
        }
    }
}

impl std::error::Error for WhisperError {}
