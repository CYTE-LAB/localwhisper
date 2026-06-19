---
title: Vocalink Architecture Design
author: CYTE LAB
date: 2026-06-15
version: 1.0.0
---

# Vocalink Architecture Design

## 1. Overview

Vocalink is a desktop application designed to provide seamless, privacy-first AI voice dictation. The core value proposition is performing both Speech-to-Text (STT) and Large Language Model (LLM) text polishing entirely on the user's local machine, without relying on external APIs or background daemon processes like Ollama.

## 2. Core Technologies

- **Application Framework**: Tauri v2 (Rust + React)
- **Audio Capture**: `cpal` (Rust)
- **STT Inference**: `whisper-rs` (Rust binding for `whisper.cpp`)
- **LLM Inference**: `llama-cpp-4` (Rust binding for `llama.cpp`)
- **Keyboard/Mouse Simulation**: `enigo` (Rust)
- **Database**: SQLite (via `tauri-plugin-sql`)

## 3. The "In-Process" Inference Model

Unlike typical local AI wrappers that act as clients to an Ollama or LM Studio server, Vocalink embeds the inference engines directly into the Rust backend process.

### Benefits:
1. **Zero Cold Start**: Models are loaded into memory when the app launches.
2. **Ultra-Low Latency**: No HTTP loopback overhead. Audio buffers and text prompts are passed directly via FFI memory pointers.
3. **No External Dependencies**: Users don't need to install Python, Docker, or Ollama. The app is a single self-contained executable.

### Model Selection:
- **STT**: `whisper-large-v3-turbo` (Fastest, highly accurate multilingual transcription).
- **LLM**: `Gemma 3 1B (Q4_K_M)` (Highest instruction-following quality in the sub-1GB RAM category).

*Total memory footprint (App + STT + LLM) is kept strictly under 2.5 GB.*

## 4. Data Flow Pipeline

The dictation process is managed by a strict State Machine in Rust (`pipeline.rs`):

1. **IDLE**: Waiting for the global shortcut (`Cmd/Ctrl + Shift + Space`).
2. **RECORDING**: 
   - Shortcut pressed and held.
   - `cpal` starts capturing 16kHz mono PCM audio.
   - Tauri emits an event to React to show the recording capsule.
3. **TRANSCRIBING**: 
   - Shortcut released.
   - Audio buffer is passed to `whisper-rs`.
4. **POLISHING**: 
   - Raw text from Whisper is wrapped in a strict system prompt.
   - Prompt is passed to `llama-cpp-4` (Gemma 3 1B) for grammar correction and formatting.
5. **OUTPUTTING**: 
   - Final text is injected into the active window using `enigo`.
6. **DONE**: State resets to IDLE.

## 5. Security & Licensing

Vocalink will be distributed as a commercial product with a one-time purchase model. 

- **Payment Gateway**: Lemon Squeezy.
- **Verification**: The Rust backend handles license key validation.
- **Device Binding**: Uses `machine-uid` to generate a hardware fingerprint. The license key and fingerprint are cryptographically signed (Ed25519) and stored locally, allowing full offline use after the initial activation.
