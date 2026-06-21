#!/bin/bash
# Download required model files for LocalWhisper
# Usage: ./scripts/download-models.sh

set -e

MODELS_DIR="src-tauri/models"
mkdir -p "$MODELS_DIR"

echo "╔══════════════════════════════════════════╗"
echo "║     LocalWhisper Model Downloader        ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Whisper Large V3 Turbo (~1.5 GB)
WHISPER_FILE="$MODELS_DIR/ggml-large-v3-turbo.bin"
WHISPER_URL="https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin"

if [ -f "$WHISPER_FILE" ]; then
    echo "✓ Whisper model already exists: $WHISPER_FILE"
else
    echo "↓ Downloading Whisper Large V3 Turbo (~1.5 GB)..."
    curl -L --progress-bar -o "$WHISPER_FILE" "$WHISPER_URL"
    echo "✓ Whisper model downloaded"
fi

echo ""

# Gemma 3 1B IT Q4_K_M (~650 MB)
LLM_FILE="$MODELS_DIR/gemma-3-1b-it-Q4_K_M.gguf"
LLM_URL="https://huggingface.co/bartowski/gemma-3-1b-it-GGUF/resolve/main/gemma-3-1b-it-Q4_K_M.gguf"

if [ -f "$LLM_FILE" ]; then
    echo "✓ Gemma 3 model already exists: $LLM_FILE"
else
    echo "↓ Downloading Gemma 3 1B IT Q4_K_M (~650 MB)..."
    curl -L --progress-bar -o "$LLM_FILE" "$LLM_URL"
    echo "✓ Gemma 3 model downloaded"
fi

echo ""
echo "══════════════════════════════════════════"
echo "All models ready! You can now run:"
echo "  pnpm tauri dev"
echo "══════════════════════════════════════════"
