import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import Onboarding from "./components/Onboarding";
import MainView from "./components/MainView";
import Settings from "./components/Settings";

export type View = "onboarding" | "main" | "settings";
export type PipelineStatus = "idle" | "recording" | "transcribing" | "polishing" | "outputting" | { error: string };

export interface DictationEntry {
  id: number;
  raw_text: string;
  polished_text: string;
  success: boolean;
  error: string | null;
  timestamp: number;
}

interface ModelStatusResponse {
  whisper_loaded: boolean;
  llm_loaded: boolean;
  whisper_model_path: string | null;
  llm_model_path: string | null;
}

interface DictationResultPayload {
  raw_text: string;
  polished_text: string;
  success: boolean;
  error: string | null;
  timestamp: number;
}

const HISTORY_STORAGE_KEY = "localwhisper_history";
const MAX_HISTORY = 100;

function loadHistory(): DictationEntry[] {
  try {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load history from localStorage:", e);
  }
  return [];
}

function saveHistory(history: DictationEntry[]) {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch (e) {
    console.error("Failed to save history to localStorage:", e);
  }
}

function App() {
  const [view, setView] = useState<View>("main");
  const [status, setStatus] = useState<PipelineStatus>("idle");
  const [modelsReady, setModelsReady] = useState(false);
  const [history, setHistory] = useState<DictationEntry[]>(loadHistory);

  const checkModelStatus = async () => {
    try {
      const result = await invoke<ModelStatusResponse>("get_model_status");
      setModelsReady(result.whisper_loaded);
    } catch {
      setModelsReady(false);
    }
  };

  useEffect(() => {
    // Check if onboarding is needed
    invoke("get_settings").then((settings: any) => {
      if (!settings.onboarding_complete) {
        setView("onboarding");
      }
    }).catch(() => {
      setView("onboarding");
    });

    // Check model status
    checkModelStatus();

    // Listen for pipeline status events
    const unlistenStatus = listen<PipelineStatus>("pipeline-status", (event) => {
      setStatus(event.payload);
    });

    // Listen for dictation results (structured payload)
    const unlistenResult = listen<DictationResultPayload>("dictation-result", (event) => {
      const result = event.payload;
      // Only add to history if there's actual content or a meaningful error
      if (result.raw_text || result.polished_text || result.error) {
        const entry: DictationEntry = {
          id: Date.now(),
          raw_text: result.raw_text,
          polished_text: result.polished_text,
          success: result.success,
          error: result.error,
          timestamp: result.timestamp * 1000, // Convert from seconds to milliseconds
        };
        setHistory((prev) => {
          const updated = [entry, ...prev].slice(0, MAX_HISTORY);
          saveHistory(updated);
          return updated;
        });
      }
    });

    return () => {
      unlistenStatus.then((fn) => fn());
      unlistenResult.then((fn) => fn());
    };
  }, []);

  const handleOnboardingComplete = () => {
    setView("main");
    // Refresh model status after onboarding (user loaded models during onboarding)
    checkModelStatus();
  };

  const handleModelsLoaded = () => {
    checkModelStatus();
  };

  const handleClearHistory = () => {
    setHistory([]);
    saveHistory([]);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white select-none">
      {view === "onboarding" && (
        <Onboarding onComplete={handleOnboardingComplete} />
      )}
      {view === "main" && (
        <MainView
          status={status}
          modelsReady={modelsReady}
          history={history}
          onOpenSettings={() => setView("settings")}
          onModelsLoaded={handleModelsLoaded}
          onClearHistory={handleClearHistory}
        />
      )}
      {view === "settings" && (
        <Settings onBack={() => setView("main")} />
      )}
    </div>
  );
}

export default App;
