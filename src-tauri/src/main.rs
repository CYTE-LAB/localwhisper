// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod audio;
mod inference;
mod pipeline;
mod settings;

use parking_lot::Mutex;
use pipeline::PipelineManager;
use std::sync::Arc;
use tauri::Manager;

/// Shared application state accessible from Tauri commands
pub struct AppState {
    pub pipeline: Arc<Mutex<PipelineManager>>,
}

fn main() {
    env_logger::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::default().build())
        .setup(|app| {
            let app_handle = app.handle().clone();

            // Initialize the pipeline manager
            let pipeline = Arc::new(Mutex::new(PipelineManager::new(app_handle.clone())));

            // Store state
            app.manage(AppState {
                pipeline: pipeline.clone(),
            });

            log::info!("LocalWhisper initialized successfully");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::start_recording,
            commands::stop_recording,
            commands::get_pipeline_status,
            commands::get_settings,
            commands::update_settings,
            commands::init_models,
            commands::get_model_status,
        ])
        .run(tauri::generate_context!())
        .expect("error while running LocalWhisper");
}

mod commands {
    use super::AppState;
    use crate::pipeline::PipelineStatus;
    use crate::settings::AppSettings;
    use tauri::State;

    #[tauri::command]
    pub async fn start_recording(state: State<'_, AppState>) -> Result<(), String> {
        let mut pipeline = state.pipeline.lock();
        pipeline.start_recording().map_err(|e| e.to_string())
    }

    #[tauri::command]
    pub async fn stop_recording(state: State<'_, AppState>) -> Result<String, String> {
        let mut pipeline = state.pipeline.lock();
        pipeline.stop_recording().await.map_err(|e| e.to_string())
    }

    #[tauri::command]
    pub fn get_pipeline_status(state: State<'_, AppState>) -> PipelineStatus {
        let pipeline = state.pipeline.lock();
        pipeline.status()
    }

    #[tauri::command]
    pub fn get_settings() -> Result<AppSettings, String> {
        AppSettings::load().map_err(|e| e.to_string())
    }

    #[tauri::command]
    pub fn update_settings(settings: AppSettings) -> Result<(), String> {
        settings.save().map_err(|e| e.to_string())
    }

    #[tauri::command]
    pub async fn init_models(state: State<'_, AppState>) -> Result<(), String> {
        let mut pipeline = state.pipeline.lock();
        pipeline.load_models().map_err(|e| e.to_string())
    }

    #[tauri::command]
    pub fn get_model_status(state: State<'_, AppState>) -> ModelStatus {
        let pipeline = state.pipeline.lock();
        pipeline.model_status()
    }

    #[derive(serde::Serialize)]
    pub struct ModelStatus {
        pub whisper_loaded: bool,
        pub llm_loaded: bool,
        pub whisper_model_path: Option<String>,
        pub llm_model_path: Option<String>,
    }
}
