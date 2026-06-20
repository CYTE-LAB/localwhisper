import { useState } from "react";

function App() {
  const [status, setStatus] = useState<"idle" | "recording" | "processing">("idle");

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
      <img src="/assets/logo.png" alt="LocalWhisper" className="w-16 h-16 mb-4" />
      <h1 className="text-2xl font-bold mb-2">LocalWhisper</h1>
      <p className="text-gray-400 text-sm mb-8">Speak, don't type.</p>

      <div className="w-full max-w-sm space-y-4">
        {status === "idle" && (
          <div className="text-center">
            <p className="text-gray-500 text-xs mb-4">
              Press <kbd className="px-2 py-1 bg-gray-800 rounded text-xs">⌘ + Shift + Space</kbd> to start dictating
            </p>
            <div className="w-12 h-12 mx-auto rounded-full bg-gray-800 flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" />
              </svg>
            </div>
          </div>
        )}

        {status === "recording" && (
          <div className="text-center">
            <p className="text-green-400 text-sm mb-4 animate-pulse">Listening...</p>
            <div className="w-12 h-12 mx-auto rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center animate-pulse">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
