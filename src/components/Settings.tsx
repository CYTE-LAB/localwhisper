import { useState, useEffect, useCallback } from "react";
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

interface ModelStatusResponse {
  whisper_loaded: boolean;
  llm_loaded: boolean;
  whisper_model_path: string | null;
  llm_model_path: string | null;
}

export default function Settings({ onBack }: SettingsProps) {
  const [settings, setSettings] = useState<AppSettings>({
    shortcut: "CmdOrCtrl+Shift+Space",
    enable_polish: true,
    language: "auto",
    onboarding_complete: true,
  });
  const [modelStatus, setModelStatus] = useState<ModelStatusResponse | null>(null);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    invoke<AppSettings>("get_settings").then(setSettings).catch(console.error);
    invoke<ModelStatusResponse>("get_model_status").then(setModelStatus).catch(console.error);
  }, []);

  const updateSetting = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }, []);

  const handleSave = async () => {
    try {
      await invoke("update_settings", { settings });
      setSaved(true);
      setDirty(false);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error("Failed to save settings:", e);
    }
  };

  // Auto-save on back if dirty
  const handleBack = async () => {
    if (dirty) {
      try {
        await invoke("update_settings", { settings });
      } catch (e) {
        console.error("Failed to auto-save settings:", e);
      }
    }
    onBack();
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-white/5">
        <button
          onClick={handleBack}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-sm font-medium">Settings</h1>
        {dirty && <span className="text-[10px] text-yellow-400 ml-auto">Unsaved changes</span>}
      </div>

      {/* Settings Content */}
      <div className="flex-1 p-4 space-y-6 overflow-y-auto">
        {/* Shortcut */}
        <div>
          <label className="text-xs text-gray-400 font-medium mb-2 block">Global Shortcut</label>
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1">
                <kbd className="px-2 py-1 bg-white/10 rounded text-xs font-mono">⌘</kbd>
                <span className="text-gray-500 text-xs">+</span>
                <kbd className="px-2 py-1 bg-white/10 rounded text-xs font-mono">⇧</kbd>
                <span className="text-gray-500 text-xs">+</span>
                <kbd className="px-2 py-1 bg-white/10 rounded text-xs font-mono">Space</kbd>
              </div>
              <span className="text-[10px] text-gray-600">Hold to record</span>
            </div>
          </div>
          <p className="text-[10px] text-gray-600 mt-1">Custom shortcut binding coming in a future update</p>
        </div>

        {/* Language */}
        <div>
          <label className="text-xs text-gray-400 font-medium mb-2 block">Recognition Language</label>
          <select
            value={settings.language}
            onChange={(e) => updateSetting("language", e.target.value)}
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
            <option value="pt">Portuguese (Português)</option>
            <option value="ru">Russian (Русский)</option>
            <option value="ar">Arabic (العربية)</option>
          </select>
          <p className="text-[10px] text-gray-600 mt-1">
            {settings.language === "auto"
              ? "Whisper will auto-detect the spoken language"
              : "Specifying a language improves accuracy and speed"}
          </p>
        </div>

        {/* Polish Toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
          <div>
            <p className="text-sm font-medium">AI Text Polishing</p>
            <p className="text-[10px] text-gray-500 mt-0.5">Fix grammar, punctuation, and remove filler words</p>
          </div>
          <button
            onClick={() => updateSetting("enable_polish", !settings.enable_polish)}
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
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${modelStatus?.whisper_loaded ? "bg-green-500" : "bg-yellow-500"}`} />
                  <span className="text-[10px] text-gray-500">~1.5 GB</span>
                </div>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium">Gemma 3 1B (Q4_K_M)</p>
                  <p className="text-[10px] text-gray-500">Text polishing engine</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${modelStatus?.llm_loaded ? "bg-green-500" : "bg-yellow-500"}`} />
                  <span className="text-[10px] text-gray-500">~650 MB</span>
                </div>
              </div>
            </div>
          </div>
          {modelStatus?.whisper_model_path && (
            <p className="text-[10px] text-gray-600 mt-2 break-all">
              Path: {modelStatus.whisper_model_path.replace(/\/[^/]+$/, "/")}
            </p>
          )}
        </div>

        {/* About */}
        <div>
          <label className="text-xs text-gray-400 font-medium mb-2 block">About</label>
          <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Version</span>
              <span className="text-xs text-gray-300">0.1.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">License</span>
              <span className="text-xs text-gray-300">MIT</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">GitHub</span>
              <span className="text-xs text-blue-400">CYTE-LAB/localwhisper</span>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="p-4 border-t border-white/5">
        <button
          onClick={handleSave}
          disabled={!dirty && !saved}
          className={`w-full py-3 rounded-lg font-medium text-sm transition-colors ${
            saved
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : dirty
                ? "bg-white text-black hover:bg-gray-200"
                : "bg-white/5 text-gray-500 border border-white/10 cursor-not-allowed"
          }`}
        >
          {saved ? "Saved!" : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
