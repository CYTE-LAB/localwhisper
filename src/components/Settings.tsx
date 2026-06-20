import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

interface SettingsProps {
  onBack: () => void;
}

interface AppSettings {
  shortcut: string;
  enable_polish: boolean;
  language: string;
  onboarding_complete: boolean;
}

export default function Settings({ onBack }: SettingsProps) {
  const [settings, setSettings] = useState<AppSettings>({
    shortcut: "CmdOrCtrl+Shift+Space",
    enable_polish: true,
    language: "auto",
    onboarding_complete: true,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    invoke<AppSettings>("get_settings").then(setSettings).catch(console.error);
  }, []);

  const handleSave = async () => {
    try {
      await invoke("update_settings", { settings });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error("Failed to save settings:", e);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-white/5">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-sm font-medium">Settings</h1>
      </div>

      {/* Settings Content */}
      <div className="flex-1 p-4 space-y-6">
        {/* Shortcut */}
        <div>
          <label className="text-xs text-gray-400 font-medium mb-2 block">Global Shortcut</label>
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="inline-flex items-center gap-1">
              <kbd className="px-2 py-1 bg-white/10 rounded text-xs font-mono">⌘</kbd>
              <span className="text-gray-500 text-xs">+</span>
              <kbd className="px-2 py-1 bg-white/10 rounded text-xs font-mono">⇧</kbd>
              <span className="text-gray-500 text-xs">+</span>
              <kbd className="px-2 py-1 bg-white/10 rounded text-xs font-mono">Space</kbd>
            </div>
          </div>
          <p className="text-[10px] text-gray-600 mt-1">Press and hold to record, release to transcribe</p>
        </div>

        {/* Language */}
        <div>
          <label className="text-xs text-gray-400 font-medium mb-2 block">Language</label>
          <select
            value={settings.language}
            onChange={(e) => setSettings({ ...settings, language: e.target.value })}
            className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-sm appearance-none cursor-pointer"
          >
            <option value="auto">Auto Detect</option>
            <option value="en">English</option>
            <option value="zh">Chinese (中文)</option>
            <option value="ja">Japanese (日本語)</option>
            <option value="ko">Korean (한국어)</option>
            <option value="es">Spanish (Español)</option>
            <option value="fr">French (Français)</option>
            <option value="de">German (Deutsch)</option>
          </select>
        </div>

        {/* Polish Toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
          <div>
            <p className="text-sm font-medium">AI Text Polishing</p>
            <p className="text-[10px] text-gray-500 mt-0.5">Fix grammar and remove filler words</p>
          </div>
          <button
            onClick={() => setSettings({ ...settings, enable_polish: !settings.enable_polish })}
            className={`w-10 h-6 rounded-full transition-colors relative ${
              settings.enable_polish ? "bg-green-500" : "bg-gray-600"
            }`}
          >
            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
              settings.enable_polish ? "translate-x-5" : "translate-x-1"
            }`} />
          </button>
        </div>

        {/* Model Info */}
        <div>
          <label className="text-xs text-gray-400 font-medium mb-2 block">Models</label>
          <div className="space-y-2">
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium">Whisper Large V3 Turbo</p>
                  <p className="text-[10px] text-gray-500">Speech-to-Text engine</p>
                </div>
                <span className="text-[10px] text-gray-500">~1.0 GB</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium">Gemma 3 1B (Q4_K_M)</p>
                  <p className="text-[10px] text-gray-500">Text polishing engine</p>
                </div>
                <span className="text-[10px] text-gray-500">~650 MB</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="p-4 border-t border-white/5">
        <button
          onClick={handleSave}
          className={`w-full py-3 rounded-lg font-medium text-sm transition-colors ${
            saved
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : "bg-white text-black hover:bg-gray-200"
          }`}
        >
          {saved ? "Saved!" : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
