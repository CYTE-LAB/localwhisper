use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::{SampleFormat, Stream, StreamConfig};
use parking_lot::Mutex;
use std::sync::Arc;

/// Target sample rate for Whisper (16kHz mono f32)
const TARGET_SAMPLE_RATE: u32 = 16000;

/// Audio recorder that captures microphone input
pub struct AudioRecorder {
    device: cpal::Device,
    config: StreamConfig,
    sample_format: SampleFormat,
    stream: Option<Stream>,
    buffer: Arc<Mutex<Vec<f32>>>,
    is_recording: bool,
}

impl AudioRecorder {
    /// Create a new AudioRecorder using the default input device
    pub fn new() -> Result<Self, AudioError> {
        let host = cpal::default_host();
        let device = host
            .default_input_device()
            .ok_or(AudioError::NoInputDevice)?;

        let supported_config = device
            .default_input_config()
            .map_err(|e| AudioError::ConfigError(e.to_string()))?;

        let sample_format = supported_config.sample_format();

        log::info!(
            "Audio device: {} ({}Hz, {} channels, format: {:?})",
            device.name().unwrap_or_default(),
            supported_config.sample_rate().0,
            supported_config.channels(),
            sample_format
        );

        let config = StreamConfig {
            channels: supported_config.channels(),
            sample_rate: supported_config.sample_rate(),
            buffer_size: cpal::BufferSize::Default,
        };

        Ok(Self {
            device,
            config,
            sample_format,
            stream: None,
            buffer: Arc::new(Mutex::new(Vec::new())),
            is_recording: false,
        })
    }

    /// Start recording audio from the microphone
    pub fn start(&mut self) -> Result<(), AudioError> {
        if self.is_recording {
            return Ok(());
        }

        // Clear the buffer
        self.buffer.lock().clear();

        let buffer_clone = self.buffer.clone();
        let channels = self.config.channels as usize;

        let err_fn = move |err| {
            log::error!("Audio stream error: {}", err);
        };

        let stream = match self.sample_format {
            SampleFormat::F32 => self.device.build_input_stream(
                &self.config,
                move |data: &[f32], _: &cpal::InputCallbackInfo| {
                    write_to_buffer(data, channels, &buffer_clone);
                },
                err_fn,
                None,
            ),
            SampleFormat::I16 => self.device.build_input_stream(
                &self.config,
                move |data: &[i16], _: &cpal::InputCallbackInfo| {
                    let f32_data: Vec<f32> = data
                        .iter()
                        .map(|&s| s as f32 / i16::MAX as f32)
                        .collect();
                    write_to_buffer(&f32_data, channels, &buffer_clone);
                },
                err_fn,
                None,
            ),
            SampleFormat::U16 => self.device.build_input_stream(
                &self.config,
                move |data: &[u16], _: &cpal::InputCallbackInfo| {
                    let f32_data: Vec<f32> = data
                        .iter()
                        .map(|&s| (s as f32 - u16::MAX as f32 / 2.0) / (u16::MAX as f32 / 2.0))
                        .collect();
                    write_to_buffer(&f32_data, channels, &buffer_clone);
                },
                err_fn,
                None,
            ),
            _ => {
                return Err(AudioError::ConfigError(format!(
                    "Unsupported sample format: {:?}",
                    self.sample_format
                )))
            }
        }
        .map_err(|e| AudioError::StreamError(e.to_string()))?;

        stream
            .play()
            .map_err(|e| AudioError::StreamError(e.to_string()))?;
        self.stream = Some(stream);
        self.is_recording = true;

        log::info!("Recording started");
        Ok(())
    }

    /// Stop recording and return the captured audio as 16kHz mono f32 samples
    pub fn stop(&mut self) -> Result<Vec<f32>, AudioError> {
        if !self.is_recording {
            return Err(AudioError::NotRecording);
        }

        // Drop the stream to stop recording
        self.stream = None;
        self.is_recording = false;

        let raw_samples = self.buffer.lock().clone();
        log::info!(
            "Recording stopped: {} raw samples captured",
            raw_samples.len()
        );

        if raw_samples.is_empty() {
            return Err(AudioError::EmptyBuffer);
        }

        // Resample to 16kHz if needed
        let source_rate = self.config.sample_rate.0;
        let resampled = if source_rate != TARGET_SAMPLE_RATE {
            resample(&raw_samples, source_rate, TARGET_SAMPLE_RATE)
        } else {
            raw_samples
        };

        log::info!(
            "Resampled to {} samples at 16kHz ({:.1}s of audio)",
            resampled.len(),
            resampled.len() as f32 / TARGET_SAMPLE_RATE as f32
        );

        Ok(resampled)
    }

    pub fn is_recording(&self) -> bool {
        self.is_recording
    }
}

/// Helper to convert interleaved multi-channel data to mono f32 and write to buffer
fn write_to_buffer(data: &[f32], channels: usize, buffer: &Arc<Mutex<Vec<f32>>>) {
    let mono: Vec<f32> = data
        .chunks(channels)
        .map(|frame| frame.iter().sum::<f32>() / channels as f32)
        .collect();
    buffer.lock().extend_from_slice(&mono);
}

/// Simple linear interpolation resampler
fn resample(input: &[f32], from_rate: u32, to_rate: u32) -> Vec<f32> {
    let ratio = from_rate as f64 / to_rate as f64;
    let output_len = (input.len() as f64 / ratio) as usize;
    let mut output = Vec::with_capacity(output_len);

    for i in 0..output_len {
        let src_idx = i as f64 * ratio;
        let idx_floor = src_idx.floor() as usize;
        let idx_ceil = (idx_floor + 1).min(input.len() - 1);
        let frac = src_idx - idx_floor as f64;

        let sample = input[idx_floor] as f64 * (1.0 - frac) + input[idx_ceil] as f64 * frac;
        output.push(sample as f32);
    }

    output
}

#[derive(Debug, thiserror::Error)]
pub enum AudioError {
    #[error("No audio input device found")]
    NoInputDevice,
    #[error("Audio config error: {0}")]
    ConfigError(String),
    #[error("Audio stream error: {0}")]
    StreamError(String),
    #[error("Not currently recording")]
    NotRecording,
    #[error("Audio buffer is empty")]
    EmptyBuffer,
}
