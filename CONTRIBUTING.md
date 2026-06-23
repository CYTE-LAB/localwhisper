# Contributing to LocalWhisper

Thank you for your interest in contributing to LocalWhisper! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

- Rust 1.80+ (`rustup update stable`)
- Node.js 20+ and pnpm (`npm install -g pnpm`)
- C++ Build Tools (for compiling `whisper.cpp` and `llama.cpp`):
  - macOS: `xcode-select --install`
  - Windows: Visual Studio Build Tools (C++ workload)
  - Linux: `sudo apt install build-essential cmake`

### Getting Started

```bash
# Fork and clone the repository
git clone https://github.com/<your-username>/localwhisper.git
cd localwhisper

# Install frontend dependencies
pnpm install

# Download AI models (~2.1 GB)
./scripts/download-models.sh

# Run in development mode
pnpm tauri dev
```

The first build will take several minutes as it compiles `whisper.cpp` and `llama.cpp` from source. Subsequent builds are incremental and much faster.

## Code Style

### Rust

- Follow standard Rust conventions (`rustfmt` defaults).
- Run `cargo fmt` before committing.
- Run `cargo clippy` and address all warnings.

### TypeScript / React

- Use TypeScript strict mode.
- Follow the existing component patterns in `src/components/`.
- Use TailwindCSS utility classes for styling (no custom CSS unless necessary).

## Pull Request Process

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. Make your changes with clear, descriptive commits.

3. Ensure the following pass locally:
   ```bash
   cargo fmt --check
   cargo clippy -- -D warnings
   pnpm tauri build  # Full build test
   ```

4. Push your branch and open a Pull Request against `main`.

5. Fill in the PR template with a clear description of your changes.

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Purpose |
|--------|---------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `chore:` | Maintenance, tooling, CI |
| `docs:` | Documentation only |
| `refactor:` | Code change that neither fixes a bug nor adds a feature |

## Architecture Notes

Before making significant changes, please read [docs/DESIGN.md](docs/DESIGN.md) to understand the overall architecture.

Key principles:

- **In-Process Inference**: Models run inside the Tauri process via FFI. Do not introduce HTTP-based model serving.
- **Privacy First**: No telemetry, no network calls during normal operation. The app must work fully offline after model download.
- **Minimal Dependencies**: Avoid adding large runtime dependencies. Prefer Rust-native solutions.

## Reporting Issues

Use the GitHub Issue templates:

- **Bug Report**: For crashes, incorrect behavior, or regressions.
- **Feature Request**: For new functionality suggestions.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
