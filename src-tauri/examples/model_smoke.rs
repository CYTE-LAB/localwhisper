//! Local, microphone-free model smoke test. Uses a generated 16 kHz PCM WAV.
//! Run from src-tauri: cargo run --release --example model_smoke -- /private/tmp/localwhisper-smoke.wav
#[path = "../src/inference/llm.rs"]
mod llm;
#[path = "../src/inference/whisper.rs"]
mod whisper;

use std::{error::Error, fs, path::Path, time::Instant};

fn pcm_wav(path: &Path) -> Result<Vec<f32>, Box<dyn Error>> {
    let bytes = fs::read(path)?;
    if bytes.len() < 12 || &bytes[..4] != b"RIFF" || &bytes[8..12] != b"WAVE" {
        return Err("Expected a RIFF/WAVE file".into());
    }
    let mut cursor = 12;
    let mut format_ok = false;
    let mut audio = None;
    while cursor + 8 <= bytes.len() {
        let kind = &bytes[cursor..cursor + 4];
        let length = u32::from_le_bytes(bytes[cursor + 4..cursor + 8].try_into()?) as usize;
        cursor += 8;
        let end = cursor.checked_add(length).ok_or("Invalid WAV chunk size")?;
        if end > bytes.len() {
            return Err("Truncated WAV chunk".into());
        }
        if kind == b"fmt " {
            if length < 16 {
                return Err("Invalid WAV format chunk".into());
            }
            let format = u16::from_le_bytes(bytes[cursor..cursor + 2].try_into()?);
            let channels = u16::from_le_bytes(bytes[cursor + 2..cursor + 4].try_into()?);
            let sample_rate = u32::from_le_bytes(bytes[cursor + 4..cursor + 8].try_into()?);
            let bits = u16::from_le_bytes(bytes[cursor + 14..cursor + 16].try_into()?);
            format_ok = format == 1 && channels == 1 && sample_rate == 16000 && bits == 16;
        } else if kind == b"data" {
            if length % 2 != 0 {
                return Err("Unaligned PCM samples".into());
            }
            audio = Some(bytes[cursor..end].chunks_exact(2)
                .map(|b| i16::from_le_bytes([b[0], b[1]]) as f32 / 32768.0)
                .collect::<Vec<_>>());
        }
        cursor = end + length % 2;
    }
    if !format_ok {
        return Err("Expected uncompressed 16-bit mono PCM at 16000 Hz".into());
    }
    let audio = audio.ok_or("No WAV audio data")?;
    if audio.is_empty() {
        return Err("Empty WAV audio data".into());
    }
    Ok(audio)
}

fn check_text(label: &str, output: &str, required: &[&str]) -> Result<(), Box<dyn Error>> {
    if output.trim().is_empty() || output.contains('\u{fffd}') {
        return Err(format!("{label}: empty output or replacement Unicode character").into());
    }
    let normalized = output.to_lowercase();
    for expected in required {
        if !normalized.contains(expected) {
            return Err(format!("{label}: missing expected content {expected:?}; got {output:?}").into());
        }
    }
    Ok(())
}

fn main() -> Result<(), Box<dyn Error>> {
    let started = Instant::now();
    let audio_path = std::env::args().nth(1)
        .unwrap_or_else(|| "/private/tmp/localwhisper-smoke.wav".to_owned());
    let audio = pcm_wav(Path::new(&audio_path))?;
    let model_dir = Path::new(env!("CARGO_MANIFEST_DIR")).join("models");
    println!("Loading Whisper; sample length: {:.1} seconds", audio.len() as f64 / 16000.0);
    let stt = whisper::WhisperEngine::new(&model_dir.join("ggml-large-v3-turbo.bin"))?;
    let transcript = stt.transcribe(&audio, "en")?;
    println!("STT: {transcript}");
    check_text("STT", &transcript, &["meeting", "tomorrow", "project", "notes"])?;

    // Keep Whisper alive while using Gemma to exercise the application's combined linkage.
    println!("Loading Gemma with Whisper still loaded");
    let editor = llm::LlmEngine::new(&model_dir.join("gemma-3-1b-it-Q4_K_M.gguf"))?;
    let english = editor.polish("um we have a meeting tomorrow at three in the afternoon uh please prepare the project notes")?;
    println!("EN POLISH: {english}");
    let english_check = check_text("English polish", &english, &["meeting", "tomorrow", "project", "notes"]);
    let chinese = editor.polish("嗯，那个，我们明天下午三点开会，请你提前准备一下项目资料。")?;
    println!("ZH POLISH: {chinese}");
    let chinese_check = check_text("Chinese polish", &chinese, &["明天", "下午", "开会", "项目", "资料"]);
    english_check?;
    chinese_check?;
    if !chinese.contains("三点") && !chinese.contains("3点") {
        return Err("Chinese polish lost meeting time".into());
    }
    assert!(editor.polish("   ")?.is_empty());
    drop(stt);
    println!("PASS: STT, English polish, Chinese UTF-8 content, empty input ({:.1}s)", started.elapsed().as_secs_f64());
    Ok(())
}
