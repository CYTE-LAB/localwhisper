import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

interface OnboardingProps {
  onComplete: () => void;
}

type Step = "welcome" | "permissions" | "shortcut" | "test" | "done";

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState<Step>("welcome");
  const [shortcut, setShortcut] = useState("CmdOrCtrl+Shift+Space");
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const handleTestRecord = async () => {
    if (isRecording) {
      setIsRecording(false);
      try {
        const result = await invoke<string>("stop_recording");
        setTestResult(result || "(No speech detected)");
      } catch (e: any) {
        setTestResult(`Error: ${e}`);
      }
    } else {
      setIsRecording(true);
      setTestResult(null);
      try {
        await invoke("start_recording");
      } catch (e: any) {
        setTestResult(`Error: ${e}`);
        setIsRecording(false);
      }
    }
  };

  const handleComplete = async () => {
    try {
      await invoke("update_settings", {
        settings: {
          shortcut,
          enable_polish: true,
          language: "auto",
          onboarding_complete: true,
        },
      });
    } catch (e) {
      console.error("Failed to save settings:", e);
    }
    onComplete();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      {/* Welcome */}
      {step === "welcome" && (
        <div className="text-center max-w-md animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-3">Welcome to LocalWhisper</h1>
          <p className="text-gray-400 mb-8 leading-relaxed">
            Speak naturally, and your words will appear as polished text — entirely on your device, no cloud needed.
          </p>
          <button
            onClick={() => setStep("permissions")}
            className="px-8 py-3 bg-white text-black font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            Get Started
          </button>
        </div>
      )}

      {/* Permissions */}
      {step === "permissions" && (
        <div className="text-center max-w-md animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-3">Permissions</h2>
          <p className="text-gray-400 mb-6 leading-relaxed">
            LocalWhisper needs access to your microphone to capture speech, and accessibility permissions to type text into other apps.
          </p>
          <div className="space-y-3 mb-8 text-left">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium">Microphone</p>
                <p className="text-xs text-gray-500">To capture your speech</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium">Accessibility</p>
                <p className="text-xs text-gray-500">To type text into other applications</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setStep("shortcut")}
            className="px-8 py-3 bg-white text-black font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            Continue
          </button>
        </div>
      )}

      {/* Shortcut Configuration */}
      {step === "shortcut" && (
        <div className="text-center max-w-md animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-3">Set Your Shortcut</h2>
          <p className="text-gray-400 mb-6 leading-relaxed">
            Press and hold this shortcut to record, release to transcribe and type.
          </p>
          <div className="mb-8">
            <div className="inline-flex items-center gap-1 p-4 rounded-xl bg-white/5 border border-white/10">
              <kbd className="px-3 py-2 bg-white/10 rounded-md text-sm font-mono">⌘</kbd>
              <span className="text-gray-500">+</span>
              <kbd className="px-3 py-2 bg-white/10 rounded-md text-sm font-mono">⇧</kbd>
              <span className="text-gray-500">+</span>
              <kbd className="px-3 py-2 bg-white/10 rounded-md text-sm font-mono">Space</kbd>
            </div>
            <p className="text-xs text-gray-500 mt-3">You can change this later in Settings</p>
          </div>
          <button
            onClick={() => setStep("test")}
            className="px-8 py-3 bg-white text-black font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            Continue
          </button>
        </div>
      )}

      {/* Test Recording */}
      {step === "test" && (
        <div className="text-center max-w-md animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-3">Test Your Microphone</h2>
          <p className="text-gray-400 mb-6 leading-relaxed">
            Try saying something to make sure everything works. Click the button below to start recording.
          </p>

          <button
            onClick={handleTestRecord}
            className={`w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center transition-all ${
              isRecording
                ? "bg-red-500 animate-pulse scale-110"
                : "bg-white/10 hover:bg-white/20 border border-white/20"
            }`}
          >
            {isRecording ? (
              <div className="w-5 h-5 bg-white rounded-sm" />
            ) : (
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" />
              </svg>
            )}
          </button>

          <p className="text-xs text-gray-500 mb-4">
            {isRecording ? "Recording... Click to stop" : "Click to start recording"}
          </p>

          {testResult && (
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-6 text-left">
              <p className="text-xs text-gray-500 mb-1">Result:</p>
              <p className="text-sm">{testResult}</p>
            </div>
          )}

          <button
            onClick={() => setStep("done")}
            className="px-8 py-3 bg-white text-black font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            {testResult ? "Looks Good!" : "Skip for Now"}
          </button>
        </div>
      )}

      {/* Done */}
      {step === "done" && (
        <div className="text-center max-w-md animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
            <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-3">You're All Set!</h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            LocalWhisper is ready. Press <kbd className="px-2 py-0.5 bg-white/10 rounded text-xs">⌘+⇧+Space</kbd> anywhere to start dictating.
          </p>
          <button
            onClick={handleComplete}
            className="px-8 py-3 bg-white text-black font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            Start Using LocalWhisper
          </button>
        </div>
      )}
    </div>
  );
}
