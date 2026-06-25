pub mod whisper;
pub mod llm;

use std::path::PathBuf;

/// Get the models directory path
pub fn models_dir() -> PathBuf {
    // 1. Check for an environment variable override (useful for dev or specific setups)
    if let Ok(path) = std::env::var("LOCALWHISPER_MODELS_DIR") {
        return PathBuf::from(path);
    }

    // 2. In development, use the local models/ directory
    let dev_path = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("models");
    if dev_path.exists() {
        return dev_path;
    }

    // 3. Fallback to app data directory (OS-specific local data directory)
    // macOS: ~/Library/Application Support/localwhisper/models
    // Windows: ~\AppData\Local\localwhisper\models
    // Linux: ~/.local/share/localwhisper/models
    let data_dir = dirs::data_local_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("localwhisper")
        .join("models");

    // Ensure the directory exists
    let _ = std::fs::create_dir_all(&data_dir);
    
    data_dir
}
