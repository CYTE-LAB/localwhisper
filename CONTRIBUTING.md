# Contributing to Vocalink

First off, thank you for considering contributing to Vocalink! It's people like you that make open-source tools great.

## Development Setup

1. **Rust Toolchain**: Make sure you have the latest stable Rust installed via `rustup`.
2. **Node.js & pnpm**: We use `pnpm` for managing frontend dependencies.
3. **C++ Compiler**: You will need a working C++ toolchain (Clang/GCC on macOS/Linux, MSVC/Build Tools on Windows) to compile the `whisper.cpp` and `llama.cpp` bindings.

### Local Models

To run the application locally, you must download the necessary model weights and place them in the `src-tauri/models/` directory.

- Download `ggml-large-v3-turbo.bin` from Hugging Face.
- Download `gemma-3-1b-it-Q4_K_M.gguf` from Hugging Face.

## Pull Request Process

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. Ensure the test suite passes (`cargo test`).
4. Make sure your code lints (`cargo clippy` and `pnpm lint`).
5. Issue that pull request!

## Code Style

- **Rust**: We follow standard `rustfmt` guidelines.
- **Frontend**: We use Prettier and ESLint.

## Reporting Bugs

Please use the GitHub Issue Tracker to report bugs. Include:
- Your OS and version
- Vocalink version
- Steps to reproduce the bug
- Expected vs actual behavior
