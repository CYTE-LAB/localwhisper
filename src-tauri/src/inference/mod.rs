pub mod whisper;
pub mod llm;

use std::path::PathBuf;

/// Get the models directory path
pub fn models_dir() -> PathBuf {
    // In development, use the local models/ directory
    let dev_path = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("models");
    if dev_path.exists() {
        return dev_path;
    }

    // Fallback to app data directory
    dirs::data_local_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("localwhisper")
        .join("models")
}
