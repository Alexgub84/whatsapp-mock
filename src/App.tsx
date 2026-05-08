import { useState, useEffect } from "react";
import WhatsAppChat, { WhatsAppDemo } from "./WhatsAppChat";
import {
  loadScenario,
  loadScenarioRouteIds,
  type LoadedScenario,
} from "./scenario";

function routeButtonLabel(id: string): string {
  return id
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("-");
}

export default function App() {
  const [scenarioId, setScenarioId] = useState(
    () => import.meta.env.VITE_SCENARIO ?? "default",
  );
  const [routes, setRoutes] = useState<string[]>([]);
  const [data, setData] = useState<LoadedScenario | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    loadScenarioRouteIds(controller.signal)
      .then(setRoutes)
      .catch(() => setRoutes([]));
    return () => controller.abort();
  }, []);

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
  }, [scenarioId]);

  const nav =
    routes.length > 0 ? (
      <nav
        className="flex flex-wrap items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 shadow-sm"
        aria-label="Scenarios"
      >
        <label
          htmlFor="scenario-select"
          className="text-sm font-medium text-gray-700"
        >
          Scenario
        </label>
        <select
          id="scenario-select"
          data-testid="scenario-select"
          value={scenarioId}
          onChange={(e) => setScenarioId(e.target.value)}
          className="min-w-40 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-100 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
        >
          {routes.map((id) => (
            <option key={id} value={id}>
              {routeButtonLabel(id)}
            </option>
          ))}
        </select>
      </nav>
    ) : null;

  if (error) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-200">
        {nav}
        <div className="flex flex-1 items-center justify-center p-4">
          <div className="max-w-sm rounded-2xl bg-white px-8 py-6 text-center shadow">
            <p className="mb-1 font-semibold text-red-500">
              Failed to load scenario
            </p>
            <p className="text-sm text-gray-500">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-200">
        {nav}
        <div className="flex flex-1 items-center justify-center p-4 text-sm text-gray-500">
          Loading…
        </div>
      </div>
    );
  }

  return (
    <>
      {nav}
      <WhatsAppDemo>
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
      </WhatsAppDemo>
    </>
  );
}
