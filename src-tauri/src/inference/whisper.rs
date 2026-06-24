use std::path::Path;
use whisper_rs::{FullParams, SamplingStrategy, WhisperContext, WhisperContextParameters};

pub struct WhisperEngine {
    ctx: WhisperContext,
}

impl WhisperEngine {
    /// Create a new Whisper engine from a model file
    pub fn new(model_path: &Path) -> Result<Self, WhisperError> {
        let ctx = WhisperContext::new_with_params(
            model_path
                .to_str()
                .ok_or(WhisperError::ModelLoadError("Invalid path".into()))?,
            WhisperContextParameters::default(),
        )
        .map_err(|e| WhisperError::ModelLoadError(e.to_string()))?;

        Ok(Self { ctx })
    }

    /// Transcribe audio samples (16kHz f32 mono) to text.
    /// `language` should be "auto" for auto-detection, or a language code like "en", "zh", "ja", etc.
    pub fn transcribe(&self, audio: &[f32], language: &str) -> Result<String, WhisperError> {
        log::info!(
            "Transcribing {:.1}s of audio (language: {})...",
            audio.len() as f32 / 16000.0,
            language
        );

        let mut state = self
            .ctx
            .create_state()
            .map_err(|e| WhisperError::InferenceError(e.to_string()))?;

        let mut params = FullParams::new(SamplingStrategy::Greedy { best_of: 1 });

        // Configure for real-time dictation
        let num_threads = std::thread::available_parallelism()
            .map(|n| n.get().min(8) as i32)
            .unwrap_or(4);
        params.set_n_threads(num_threads);

        // Use language from user settings
        let lang = if language == "auto" {
            None
        } else {
            Some(language)
        };
        params.set_language(lang);
        params.set_translate(false);
        params.set_no_timestamps(true);
        params.set_print_special(false);
        params.set_print_progress(false);
        params.set_print_realtime(false);
        params.set_suppress_blank(true);
        params.set_suppress_non_speech_tokens(true);

        // Run inference
        state
            .full(params, audio)
            .map_err(|e| WhisperError::InferenceError(e.to_string()))?;

        // Collect all segments into a single string
        let num_segments = state
            .full_n_segments()
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
    ModelLoadError(String),
    InferenceError(String),
}

impl std::fmt::Display for WhisperError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::ModelLoadError(e) => write!(f, "Whisper model load error: {}", e),
            Self::InferenceError(e) => write!(f, "Whisper inference error: {}", e),
        }
    }
}

impl std::error::Error for WhisperError {}
