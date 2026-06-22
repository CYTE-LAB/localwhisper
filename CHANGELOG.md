# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- System tray support — app minimizes to tray on close, click tray icon to restore
- Dictation history panel — view recent transcriptions from the main window
- Live model status indicators in Settings (green = loaded, yellow = not loaded)
- Model directory path display in Settings
- About section in Settings (version, license, GitHub link)
- `tray-icon` and `image-png` Tauri features for tray functionality

### Fixed
- App now refreshes model status after onboarding completes
- Frontend now listens for `dictation-result` events from backend
- Window label added to `tauri.conf.json` for proper tray-to-window communication

### Changed
- Window close button now hides to tray instead of quitting the app
- MainView accepts and displays dictation history entries

## [0.1.0] - 2026-06-22

### Added
- Initial MVP release
- Full dictation pipeline: audio capture → Whisper STT → Gemma 3 LLM polish → keyboard output
- Global shortcut (⌘+⇧+Space) press-and-hold recording
- 6-step onboarding flow (welcome, permissions, shortcut, models, test, done)
- Settings persistence (language, polish toggle, shortcut)
- Model download helper script (`scripts/download-models.sh`)
- App icons for macOS, Windows, Linux
