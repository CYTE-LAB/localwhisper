// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod pipeline;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_global_shortcut::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            pipeline::start_recording,
            pipeline::stop_recording,
            pipeline::get_status,
        ])
        .run(tauri::generate_context!())
        .expect("error while running LocalWhisper");
}
