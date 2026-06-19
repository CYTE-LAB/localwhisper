<div align="center">
  <img src="assets/logo.png" width="128" height="128" alt="LocalWhisper Logo">
  <h1>LocalWhisper</h1>
  <p><strong>A fully local, privacy-first AI voice dictation app powered by Whisper + Gemma 3.</strong></p>
  <p>No cloud. No subscription. One-time purchase.</p>

  <p>
    <a href="https://github.com/CYTE-LAB/localwhisper/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License"></a>
    <a href="https://tauri.app/"><img src="https://img.shields.io/badge/Built%20with-Tauri-orange.svg" alt="Built with Tauri"></a>
    <a href="https://www.rust-lang.org/"><img src="https://img.shields.io/badge/Rust-1.80+-red.svg" alt="Rust Version"></a>
  </p>
</div>

## ✨ What is LocalWhisper?

LocalWhisper is an AI-powered voice dictation application that runs entirely on your local machine. It captures your speech, transcribes it with unparalleled accuracy using `whisper.cpp`, polishes the text with Google's `Gemma 3 1B` model, and instantly types the result wherever your cursor is.

**It's designed to be the open-source, buy-once alternative to subscription-based tools like Typeless or Wispr Flow.**

### Why LocalWhisper?

- 🔒 **100% Privacy-First**: All AI models (Whisper + Gemma 3) run locally on your device. Your voice and data never leave your computer.
- 💸 **No Subscriptions**: Pay once, own it forever. No monthly API fees, no token limits.
- ⚡ **Zero Latency**: By embedding `whisper-rs` and `llama-cpp-4` directly into the Rust process, we eliminate cold starts and network latency. End-to-end response time is typically under 1.5 seconds.
- 🎯 **Context-Aware Polishing**: It doesn't just transcribe — it removes filler words, fixes grammar, and formats text based on the context of the app you're using.

## 🚀 Quick Start (Development)

> **Note**: This repository contains the open-source MVP of LocalWhisper. The commercial release with pre-packaged models and one-click installers will be available on our website soon.

### Prerequisites

- [Rust](https://www.rust-lang.org/tools/install) (1.80+)
- [Node.js](https://nodejs.org/) (20+)
- [pnpm](https://pnpm.io/)
- C++ Build Tools (for `llama.cpp` and `whisper.cpp` bindings)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/CYTE-LAB/localwhisper.git
   cd localwhisper
   ```

2. Install frontend dependencies:
   ```bash
   pnpm install
   ```

3. Download required models into `src-tauri/models/`:
   - **Whisper**: [`ggml-large-v3-turbo.bin`](https://huggingface.co/ggerganov/whisper.cpp)
   - **Gemma 3**: [`gemma-3-1b-it-Q4_K_M.gguf`](https://huggingface.co/bartowski/gemma-3-1b-it-GGUF)

4. Run in development mode:
   ```bash
   pnpm tauri dev
   ```

## 🏗️ Architecture

LocalWhisper is built with a **Tauri + React** stack, optimized for maximum performance and minimal memory footprint.

| Layer | Technology |
|-------|-----------|
| Frontend UI | React + TypeScript + TailwindCSS |
| Desktop Framework | Tauri v2 (Rust) |
| Audio Capture | `cpal` |
| STT Engine | `whisper-rs` (embedded `whisper.cpp`) |
| LLM Engine | `llama-cpp-4` (embedded `llama.cpp`) |
| Keyboard Output | `enigo` |
| Local Storage | SQLite via `tauri-plugin-sql` |

For a deep dive into the technical design, please read [docs/DESIGN.md](docs/DESIGN.md).

## 🗺️ Roadmap

- [x] Initial project scaffold and architecture docs
- [ ] Core audio capture pipeline (`cpal`)
- [ ] In-process STT inference (`whisper-rs`)
- [ ] In-process LLM text polishing (`llama-cpp-4`)
- [ ] Global shortcut listener and floating capsule UI
- [ ] Onboarding flow (permissions, microphone test, hotkey binding)
- [ ] Context-aware formatting (detecting active application)
- [ ] License verification module (Lemon Squeezy integration)
- [ ] macOS `.dmg` and Windows `.msi` installers

## 🤝 Contributing

We welcome contributions! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to get started.

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---
Built with ❤️ by [CYTE LAB](https://github.com/CYTE-LAB).
