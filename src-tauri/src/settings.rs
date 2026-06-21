use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

/// Application settings stored locally
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    /// Global shortcut for recording (e.g., "CmdOrCtrl+Shift+Space")
    pub shortcut: String,
    /// Whether to polish text with LLM after transcription
    pub enable_polish: bool,
    /// Language preference ("auto", "en", "zh", etc.)
    pub language: String,
    /// Whether onboarding has been completed
    pub onboarding_complete: bool,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            shortcut: "CmdOrCtrl+Shift+Space".to_string(),
            enable_polish: true,
            language: "auto".to_string(),
            onboarding_complete: false,
        }
    }
}

impl AppSettings {
    /// Get the settings file path
    fn file_path() -> PathBuf {
        dirs::config_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("localwhisper")
            .join("settings.json")
    }

    /// Load settings from disk, or return defaults
    pub fn load() -> Result<Self, Box<dyn std::error::Error>> {
        let path = Self::file_path();
        if path.exists() {
            let content = fs::read_to_string(&path)?;
            let settings: AppSettings = serde_json::from_str(&content)?;
            Ok(settings)
        } else {
            Ok(Self::default())
        }
    }

    /// Save settings to disk
    pub fn save(&self) -> Result<(), Box<dyn std::error::Error>> {
        let path = Self::file_path();
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }
        let content = serde_json::to_string_pretty(self)?;
        fs::write(&path, content)?;
        Ok(())
    }
}
