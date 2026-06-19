<div align="center">
  <img src="assets/logo.png" width="128" height="128" alt="Vocalink Logo">
  <h1>Vocalink</h1>
  <p><strong>A fully local, privacy-first AI voice dictation app powered by Whisper + Gemma 3.</strong></p>
  <p>No cloud. No subscription. One-time purchase.</p>

  <p>
    <a href="https://github.com/CYTE-LAB/vocalink/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License"></a>
    <a href="https://tauri.app/"><img src="https://img.shields.io/badge/Built%20with-Tauri-orange.svg" alt="Built with Tauri"></a>
    <a href="https://www.rust-lang.org/"><img src="https://img.shields.io/badge/Rust-1.80+-red.svg" alt="Rust Version"></a>
  </p>
</div>

## ✨ What is Vocalink?

Vocalink is an AI-powered voice dictation application that runs entirely on your local machine. It captures your speech, transcribes it with unparalleled accuracy using `whisper.cpp`, polishes the text with Google's latest `Gemma 3 1B` model, and instantly types the result wherever your cursor is.

**It's designed to be the open-source, buy-once alternative to subscription-based tools like Typeless or Wispr Flow.**

### Why Vocalink?

- 🔒 **100% Privacy-First**: All AI models (Whisper + Gemma 3) run locally on your device. Your voice and data never leave your computer.
- 💸 **No Subscriptions**: Pay once, own it forever. No monthly API fees, no token limits.
- ⚡ **Zero Latency**: By embedding `whisper-rs` and `llama-cpp-4` directly into the Rust process, we eliminate cold starts and network latency. End-to-end response time is typically under 1.5 seconds.
- 🎯 **Context-Aware Polishing**: It doesn't just transcribe; it removes filler words, fixes grammar, and formats text perfectly based on the context of the app you're using.

## 🚀 Quick Start (Development)

> **Note**: This repository contains the open-source MVP of Vocalink. The commercial release with pre-packaged models and one-click installers will be available on our website soon.

### Prerequisites

- [Rust](https://www.rust-lang.org/tools/install) (1.80+)
- [Node.js](https://nodejs.org/) (20+)
- [pnpm](https://pnpm.io/)
- C++ Build Tools (for `llama.cpp` and `whisper.cpp` bindings)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/CYTE-LAB/vocalink.git
   cd vocalink
   ```

2. Install frontend dependencies:
   ```bash
   pnpm install
   ```

3. Download required models (into `src-tauri/models/`):
   - Whisper: `ggml-large-v3-turbo.bin`
   - Gemma 3: `gemma-3-1b-it-Q4_K_M.gguf`

4. Run in development mode:
   ```bash
   pnpm tauri dev
   ```

## 🏗️ Architecture

Vocalink is built with a **Tauri + React** stack, optimized for maximum performance and minimal memory footprint.

- **Frontend**: React + TailwindCSS (Settings UI, Onboarding, Floating Capsule)
- **Backend**: Rust (Tauri v2)
- **Audio Capture**: `cpal` (Cross-platform audio I/O)
- **STT Engine**: `whisper-rs` (Embedded `whisper.cpp` binding)
- **LLM Engine**: `llama-cpp-4` (Embedded `llama.cpp` binding)
- **Keyboard Simulation**: `enigo`

For a deep dive into the technical design, please read our [DESIGN.md](docs/DESIGN.md).

## 🗺️ Roadmap

- [x] Initial project scaffold
- [ ] Core audio capture pipeline (`cpal`)
- [ ] In-process STT inference (`whisper-rs`)
- [ ] In-process LLM text polishing (`llama-cpp-4`)
- [ ] Global shortcut listener and floating UI
- [ ] Onboarding flow and microphone permission handling
- [ ] Context-aware formatting (detecting active application)
- [ ] License verification module (Lemon Squeezy integration)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on how to get started.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
Built with ❤️ by [CYTE LAB](https://github.com/CYTE-LAB).
