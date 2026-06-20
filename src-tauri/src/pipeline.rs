use serde::{Deserialize, Serialize};

/// The state machine that drives the dictation pipeline.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum PipelineState {
    Idle,
    Recording,
    Transcribing,
    Polishing,
    Outputting,
}

/// Starts audio recording via cpal.
/// Called when the user presses the global shortcut.
#[tauri::command]
pub fn start_recording() -> Result<String, String> {
    // TODO: Initialize cpal stream and begin capturing 16kHz mono PCM audio
    Ok("recording_started".to_string())
}

/// Stops recording and triggers the transcription + polishing pipeline.
/// Called when the user releases the global shortcut.
#[tauri::command]
pub fn stop_recording() -> Result<String, String> {
    // TODO:
    // 1. Stop cpal stream, collect audio buffer
    // 2. Pass audio buffer to whisper-rs for transcription
    // 3. Pass raw text to llama-cpp-4 (Gemma 3 1B) for polishing
    // 4. Simulate keyboard output via enigo
    Ok("pipeline_complete".to_string())
}

/// Returns the current state of the pipeline.
#[tauri::command]
pub fn get_status() -> PipelineState {
    // TODO: Return actual state from shared state
    PipelineState::Idle
}
