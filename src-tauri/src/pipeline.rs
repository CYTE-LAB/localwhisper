use crate::audio::AudioRecorder;
use crate::inference::whisper::WhisperEngine;
use crate::inference::llm::LlmEngine;
use crate::inference::models_dir;
use crate::ModelStatus;
use enigo::{Enigo, Keyboard, Settings};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};

/// Pipeline states
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum PipelineStatus {
    Idle,
    Recording,
    Transcribing,
    Polishing,
    Outputting,
    Error(String),
}

/// Manages the full dictation pipeline (synchronous — runs in Mutex)
pub struct PipelineManager {
    app_handle: AppHandle,
    recorder: Option<AudioRecorder>,
    whisper: Option<WhisperEngine>,
    llm: Option<LlmEngine>,
    status: PipelineStatus,
}

impl PipelineManager {
    pub fn new(app_handle: AppHandle) -> Self {
        Self {
            app_handle,
            recorder: None,
            whisper: None,
            llm: None,
            status: PipelineStatus::Idle,
        }
    }

    /// Load AI models into memory
    pub fn load_models(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        let models_path = models_dir();

        // Load Whisper model
        let whisper_path = models_path.join("ggml-large-v3-turbo.bin");
        if whisper_path.exists() {
            self.whisper = Some(WhisperEngine::new(&whisper_path)?);
            log::info!("Whisper model loaded");
        } else {
            log::warn!("Whisper model not found at {:?}", whisper_path);
            return Err(format!(
                "Whisper model not found. Please download it to: {:?}",
                whisper_path
            ).into());
        }

        // Load LLM model
        let llm_path = models_path.join("gemma-3-1b-it-Q4_K_M.gguf");
        if llm_path.exists() {
            self.llm = Some(LlmEngine::new(&llm_path)?);
            log::info!("LLM model loaded");
        } else {
            log::warn!("LLM model not found at {:?}. Text polishing will be disabled.", llm_path);
            // LLM is optional — don't fail if missing
        }

        Ok(())
    }

    /// Start recording audio
    pub fn start_recording(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        if self.status != PipelineStatus::Idle {
            return Err("Pipeline is not idle".into());
        }

        // Initialize recorder if needed
        if self.recorder.is_none() {
            self.recorder = Some(AudioRecorder::new()?);
        }

        if let Some(ref mut recorder) = self.recorder {
            recorder.start()?;
        }

        self.set_status(PipelineStatus::Recording);
        Ok(())
    }

    /// Stop recording and run the full pipeline synchronously
    /// (transcribe → polish → keyboard output)
    pub fn stop_and_process(&mut self) -> Result<String, Box<dyn std::error::Error>> {
        if self.status != PipelineStatus::Recording {
            return Err("Not currently recording".into());
        }

        // 1. Stop recording and get audio
        let audio = if let Some(ref mut recorder) = self.recorder {
            recorder.stop()?
        } else {
            return Err("No recorder available".into());
        };

        // 2. Transcribe with Whisper
        self.set_status(PipelineStatus::Transcribing);
        let raw_text = if let Some(ref whisper) = self.whisper {
            whisper.transcribe(&audio)?
        } else {
            self.set_status(PipelineStatus::Error("Whisper model not loaded".into()));
            return Err("Whisper model not loaded. Call init_models first.".into());
        };

        if raw_text.is_empty() {
            self.set_status(PipelineStatus::Idle);
            return Ok(String::new());
        }

        // 3. Polish with LLM (optional)
        self.set_status(PipelineStatus::Polishing);
        let polished_text = if let Some(ref llm) = self.llm {
            match llm.polish(&raw_text) {
                Ok(text) if !text.is_empty() => text,
                Ok(_) => raw_text.clone(),
                Err(e) => {
                    log::warn!("LLM polishing failed, using raw text: {}", e);
                    raw_text.clone()
                }
            }
        } else {
            log::info!("No LLM model loaded, using raw transcription");
            raw_text.clone()
        };

        // 4. Type the text into the active window
        self.set_status(PipelineStatus::Outputting);
        if let Err(e) = self.type_text(&polished_text) {
            log::error!("Failed to type text: {}", e);
            self.set_status(PipelineStatus::Error(format!("Typing failed: {}", e)));
            return Err(e);
        }

        // 5. Done
        self.set_status(PipelineStatus::Idle);

        // Emit the result to the frontend for display
        let _ = self.app_handle.emit("dictation-result", &polished_text);

        Ok(polished_text)
    }

    /// Simulate keyboard typing to output text
    fn type_text(&self, text: &str) -> Result<(), Box<dyn std::error::Error>> {
        log::info!("Typing text: \"{}\"", text);

        let mut enigo = Enigo::new(&Settings::default())
            .map_err(|e| format!("Failed to create Enigo: {:?}", e))?;

        // Small delay to ensure the target window is focused
        std::thread::sleep(std::time::Duration::from_millis(50));

        enigo.text(text)
            .map_err(|e| format!("Failed to type text: {:?}", e))?;

        Ok(())
    }

    /// Get current pipeline status
    pub fn status(&self) -> PipelineStatus {
        self.status.clone()
    }

    /// Get model loading status
    pub fn model_status(&self) -> ModelStatus {
        let models_path = models_dir();
        ModelStatus {
            whisper_loaded: self.whisper.is_some(),
            llm_loaded: self.llm.is_some(),
            whisper_model_path: Some(
                models_path.join("ggml-large-v3-turbo.bin").to_string_lossy().to_string(),
            ),
            llm_model_path: Some(
                models_path.join("gemma-3-1b-it-Q4_K_M.gguf").to_string_lossy().to_string(),
            ),
        }
    }

    /// Update status and emit event to frontend
    fn set_status(&mut self, status: PipelineStatus) {
        self.status = status.clone();
        let _ = self.app_handle.emit("pipeline-status", &status);
    }
}
