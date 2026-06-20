import { invoke } from "@tauri-apps/api/core";
import { PipelineStatus } from "../App";

interface MainViewProps {
  status: PipelineStatus;
  modelsReady: boolean;
  onOpenSettings: () => void;
}

export default function MainView({ status, modelsReady, onOpenSettings }: MainViewProps) {
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
    try {
      await invoke("init_models");
    } catch (e) {
      console.error("Failed to load models:", e);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <img src="/assets/logo.png" alt="LocalWhisper" className="w-6 h-6" />
          <span className="text-sm font-medium">LocalWhisper</span>
        </div>
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
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
        {status === "idle" && (
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
            <button
              onClick={handleLoadModels}
              className="text-xs px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-md text-yellow-400 hover:bg-yellow-500/20 transition-colors"
            >
              Load Models
            </button>
          </div>
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
