import { useState, useEffect } from "react";
import WhatsAppChat from "./WhatsAppChat";
import { loadScenario, type LoadedScenario } from "./scenario";

const scenarioId =
  new URLSearchParams(window.location.search).get("scenario") ??
  import.meta.env.VITE_SCENARIO ??
  "default";

export default function App() {
  const [data, setData] = useState<LoadedScenario | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setError(null);
    loadScenario(scenarioId, controller.signal)
      .then(setData)
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        console.error(err);
        setError(err instanceof Error ? err.message : String(err));
      });
    return () => controller.abort();
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-200">
        <div className="bg-white rounded-2xl shadow px-8 py-6 text-center max-w-sm">
          <p className="text-red-500 font-semibold mb-1">Failed to load scenario</p>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <WhatsAppChat
      header={data.header}
      messages={data.messages}
      direction={data.direction}
      statusBarTime={data.statusBarTime}
      showStatusBar={data.showStatusBar}
      showInputBar={data.showInputBar}
      autoplay={data.autoplay}
      showControls={data.showControls}
      syncStatusBarFromMessages={data.syncStatusBarFromMessages}
    />
  );
}
