---
title: LocalWhisper Architecture Design
author: CYTE LAB
date: 2026-06-22
version: 1.1.0
---

# LocalWhisper Architecture Design

## 1. Overview

LocalWhisper is a desktop application designed to provide seamless, privacy-first AI voice dictation. The core value proposition is performing both Speech-to-Text (STT) and Large Language Model (LLM) text polishing entirely on the user's local machine, without relying on external APIs or background daemon processes like Ollama.

## 2. Core Technologies

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Application Framework | Tauri v2 (Rust + React) | Desktop shell, IPC, system tray |
| Audio Capture | `cpal` | Microphone recording, mono resampling |
| STT Inference | `whisper-rs` (Rust FFI to `whisper.cpp`) | Speech-to-text |
| LLM Inference | `llama-cpp-4` (Rust FFI to `llama.cpp`) | Text polishing |
| Keyboard Simulation | `enigo` | Type text into active window |
| Settings Persistence | JSON file (`serde_json`) | User preferences |

## 3. The "In-Process" Inference Model

Unlike typical local AI wrappers that act as clients to an Ollama or LM Studio server, LocalWhisper embeds the inference engines directly into the Rust backend process.

### Benefits

1. **Zero Cold Start**: Models are loaded into memory when the app launches and remain resident.
2. **Ultra-Low Latency**: No HTTP loopback overhead. Audio buffers and text prompts are passed directly via FFI memory pointers.
3. **No External Dependencies**: Users don't need to install Python, Docker, or Ollama. The app is a single self-contained executable (plus model files).

### Model Selection

| Role | Model | Quantization | Disk Size | RAM Usage |
|------|-------|-------------|-----------|-----------|
| STT | Whisper Large V3 Turbo | FP16 | ~1.5 GB | ~1.0 GB |
| LLM | Gemma 3 1B IT | Q4_K_M | ~650 MB | ~800 MB |

Total memory footprint (App + STT + LLM) is kept strictly under **2.5 GB**.

## 4. Data Flow Pipeline

The dictation process is managed by a strict State Machine in Rust (`pipeline.rs`):

```
IDLE → RECORDING → TRANSCRIBING → POLISHING → OUTPUTTING → IDLE
                                      ↓ (if polish disabled)
                              TRANSCRIBING → OUTPUTTING → IDLE
```

1. **IDLE**: Waiting for the global shortcut (`Cmd/Ctrl + Shift + Space`).
2. **RECORDING**: Shortcut pressed and held. `cpal` captures 16kHz mono PCM audio. Tauri emits status event to React UI.
3. **TRANSCRIBING**: Shortcut released. Audio buffer passed to `whisper-rs`.
4. **POLISHING** (optional): Raw text wrapped in a strict system prompt and passed to `llama-cpp-4` (Gemma 3 1B). Can be disabled in settings.
5. **OUTPUTTING**: Final text injected into the active window using `enigo`.
6. State resets to **IDLE**.

## 5. System Tray Integration

LocalWhisper runs as a tray-resident application:

- Closing the window hides it to the system tray (does not quit).
- Clicking the tray icon restores the window.
- Right-click menu provides "Show" and "Quit" options.
- The app remains active in the background, ready for the global shortcut at all times.

## 6. Security & Licensing (Planned)

> **Status**: Not yet implemented. This section describes the intended commercial distribution model.

LocalWhisper will be distributed as a commercial product with a one-time purchase model.

- **Payment Gateway**: Lemon Squeezy (handles global payments, tax, and license key generation).
- **Verification**: The Rust backend will handle license key validation.
- **Device Binding**: Will use hardware fingerprinting to bind a license to a limited number of devices. The license key and fingerprint will be cryptographically signed and stored locally, allowing full offline use after initial activation.
