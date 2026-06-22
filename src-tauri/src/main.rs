// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod audio;
mod inference;
mod pipeline;
mod settings;

use parking_lot::Mutex;
use pipeline::PipelineManager;
use std::sync::Arc;
use tauri::{
    image::Image,
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, WindowEvent,
};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

/// Shared application state accessible from Tauri commands
pub struct AppState {
    pub pipeline: Arc<Mutex<PipelineManager>>,
}

/// Model status returned to the frontend
#[derive(serde::Serialize, Clone)]
pub struct ModelStatus {
    pub whisper_loaded: bool,
    pub llm_loaded: bool,
    pub whisper_model_path: Option<String>,
    pub llm_model_path: Option<String>,
}

fn main() {
    env_logger::init();

    tauri::Builder::default()
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, _shortcut, event| {
                    let state = app.state::<AppState>();
                    match event.state() {
                        ShortcutState::Pressed => {
                            let mut pipeline = state.pipeline.lock();
                            if let Err(e) = pipeline.start_recording() {
                                log::error!("Failed to start recording: {}", e);
                            }
                        }
                        ShortcutState::Released => {
                            let mut pipeline = state.pipeline.lock();
                            if let Err(e) = pipeline.stop_and_process() {
                                log::error!("Failed to process recording: {}", e);
                            }
                        }
                    }
                })
                .build(),
        )
        .setup(|app| {
            let app_handle = app.handle().clone();

            // Initialize the pipeline manager
            let pipeline = Arc::new(Mutex::new(PipelineManager::new(app_handle.clone())));

            // Store state
            app.manage(AppState {
                pipeline: pipeline.clone(),
            });

            // Register global shortcut (Cmd+Shift+Space)
            let shortcut: Shortcut = "CmdOrCtrl+Shift+Space".parse().unwrap();
            app.global_shortcut().register(shortcut).unwrap_or_else(|e| {
                log::error!("Failed to register global shortcut: {}", e);
            });

            // --- System Tray ---
            let quit = MenuItem::with_id(app, "quit", "Quit LocalWhisper", true, None::<&str>)?;
            let show = MenuItem::with_id(app, "show", "Show Window", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &quit])?;

            let tray_icon = Image::from_path("icons/icon.png")
                .unwrap_or_else(|_| Image::from_bytes(include_bytes!("../icons/32x32.png")).unwrap());

            let _tray = TrayIconBuilder::new()
                .icon(tray_icon)
                .menu(&menu)
                .tooltip("LocalWhisper — Ready")
                .on_menu_event(move |app, event| match event.id.as_ref() {
                    "quit" => {
                        app.exit(0);
                    }
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            // --- Window close behavior: hide instead of quit ---
            let main_window = app.get_webview_window("main").unwrap();
            main_window.on_window_event(move |event| {
                if let WindowEvent::CloseRequested { api, .. } = event {
                    // Prevent the window from actually closing
                    api.prevent_close();
                    // Hide it instead (minimize to tray)
                    if let Some(window) = app_handle.get_webview_window("main") {
                        let _ = window.hide();
                    }
                }
            });

            log::info!("LocalWhisper initialized successfully with system tray");
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
    use super::{AppState, ModelStatus};
    use crate::pipeline::PipelineStatus;
    use crate::settings::AppSettings;
    use tauri::State;

    #[tauri::command]
    pub fn start_recording(state: State<'_, AppState>) -> Result<(), String> {
        let mut pipeline = state.pipeline.lock();
        pipeline.start_recording().map_err(|e| e.to_string())
    }

    #[tauri::command]
    pub fn stop_recording(state: State<'_, AppState>) -> Result<String, String> {
        let mut pipeline = state.pipeline.lock();
        pipeline.stop_and_process().map_err(|e| e.to_string())
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
    pub fn init_models(state: State<'_, AppState>) -> Result<(), String> {
        let mut pipeline = state.pipeline.lock();
        pipeline.load_models().map_err(|e| e.to_string())
    }

    #[tauri::command]
    pub fn get_model_status(state: State<'_, AppState>) -> ModelStatus {
        let pipeline = state.pipeline.lock();
        pipeline.model_status()
    }
}
