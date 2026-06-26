import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { PipelineStatus, DictationEntry } from "../App";

interface MainViewProps {
  status: PipelineStatus;
  modelsReady: boolean;
  history: DictationEntry[];
  onOpenSettings: () => void;
  onModelsLoaded: () => void;
}

export default function MainView({ status, modelsReady, history, onOpenSettings, onModelsLoaded }: MainViewProps) {
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  // Show error messages briefly then auto-dismiss
  useEffect(() => {
    if (typeof status === "object" && "error" in status) {
      setLastError(status.error);
      const timer = setTimeout(() => setLastError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const statusText = () => {
    if (typeof status === "object" && "error" in status) return status.error;
    switch (status) {
      case "idle": return "Ready";
      case "recording": return "Listening...";
      case "transcribing": return "Transcribing...";
      case "polishing": return "Polishing...";
      case "outputting": return "Typing...";
      default: return "Ready";
    }
  };

  const statusColor = () => {
    if (typeof status === "object") return "text-red-400";
    switch (status) {
      case "idle": return "text-gray-400";
      case "recording": return "text-green-400";
      case "transcribing": return "text-yellow-400";
      case "polishing": return "text-blue-400";
      case "outputting": return "text-purple-400";
      default: return "text-gray-400";
    }
  };

  const isActive = status === "recording" || status === "transcribing" || status === "polishing" || status === "outputting";

  const handleLoadModels = async () => {
    setLoadingModels(true);
    setLoadError(null);
    try {
      await invoke("init_models");
      onModelsLoaded();
    } catch (e: any) {
      setLoadError(typeof e === "string" ? e : e.message || "Failed to load models");
    } finally {
      setLoadingModels(false);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
            </svg>
          </div>
          <span className="text-sm font-medium">LocalWhisper</span>
        </div>
        <div className="flex items-center gap-1">
          {/* History toggle */}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`p-2 rounded-lg transition-colors ${showHistory ? "bg-white/10" : "hover:bg-white/5"}`}
            title="Dictation History"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            title="Settings"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Error Toast */}
      {lastError && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 animate-fade-in-toast">
          <div className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 backdrop-blur-sm">
            <p className="text-xs text-red-400">{lastError}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {showHistory ? (
          /* History Panel */
          <div className="w-full max-w-sm">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Recent Dictations</h3>
            {history.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xs text-gray-500">No dictations yet.</p>
                <p className="text-xs text-gray-600 mt-1">Use ⌘+⇧+Space to start.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {history.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors group"
                  >
                    <p className="text-xs text-gray-300 leading-relaxed">{entry.text}</p>
                    <p className="text-[10px] text-gray-600 mt-1.5">{formatTime(entry.timestamp)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Status View */
          <>
            {/* Status Indicator */}
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 transition-all duration-300 ${
              isActive
                ? "bg-green-500/10 border-2 border-green-500/50 animate-pulse"
                : "bg-white/5 border border-white/10"
            }`}>
              {status === "recording" ? (
                <div className="flex items-center gap-1">
                  <div className="w-1 h-4 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-1 h-6 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-1 h-5 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  <div className="w-1 h-3 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "450ms" }} />
                </div>
              ) : (
                <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" />
                </svg>
              )}
            </div>

            {/* Status Text */}
            <p className={`text-sm font-medium mb-2 ${statusColor()}`}>
              {statusText()}
            </p>

            {/* Shortcut Hint */}
            {status === "idle" && modelsReady && (
              <p className="text-xs text-gray-500">
                Press <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] font-mono">⌘+⇧+Space</kbd> to dictate
              </p>
            )}

            {/* Model Status Warning */}
            {!modelsReady && (
              <div className="mt-8 p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20 max-w-sm">
                <p className="text-xs text-yellow-400 mb-2 font-medium">Models not loaded</p>
                <p className="text-xs text-gray-500 mb-3">
                  Download the required model files and place them in the models directory, then click below to load.
                </p>
                {loadError && (
                  <p className="text-xs text-red-400 mb-3 p-2 bg-red-500/5 rounded">{loadError}</p>
                )}
                <button
                  onClick={handleLoadModels}
                  disabled={loadingModels}
                  className={`text-xs px-3 py-1.5 border rounded-md transition-colors ${
                    loadingModels
                      ? "bg-white/5 border-white/10 text-gray-500 cursor-wait"
                      : "bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20"
                  }`}
                >
                  {loadingModels ? "Loading..." : "Load Models"}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>v0.1.0</span>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${modelsReady ? "bg-green-500" : "bg-yellow-500"}`} />
            <span>{modelsReady ? "Models loaded" : "Models not loaded"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
