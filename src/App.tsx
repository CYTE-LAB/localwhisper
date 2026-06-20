import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import Onboarding from "./components/Onboarding";
import MainView from "./components/MainView";
import Settings from "./components/Settings";

export type View = "onboarding" | "main" | "settings";
export type PipelineStatus = "idle" | "recording" | "transcribing" | "polishing" | "outputting" | { error: string };

function App() {
  const [view, setView] = useState<View>("main");
  const [status, setStatus] = useState<PipelineStatus>("idle");
  const [modelsReady, setModelsReady] = useState(false);

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
    invoke("get_model_status").then((status: any) => {
      setModelsReady(status.whisper_loaded && status.llm_loaded);
    }).catch(() => {});

    // Listen for pipeline status events
    const unlisten = listen<PipelineStatus>("pipeline-status", (event) => {
      setStatus(event.payload);
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const handleOnboardingComplete = () => {
    setView("main");
    // Try to load models
    invoke("init_models").then(() => {
      setModelsReady(true);
    }).catch((e) => {
      console.error("Failed to load models:", e);
    });
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
          onOpenSettings={() => setView("settings")}
        />
      )}
      {view === "settings" && (
        <Settings onBack={() => setView("main")} />
      )}
    </div>
  );
}

export default App;
