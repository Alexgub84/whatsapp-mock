import { useState, useEffect } from "react";
import WhatsAppChat, { WhatsAppDemo } from "./WhatsAppChat";
import {
  loadScenario,
  loadScenarioRouteIds,
  type LoadedScenario,
} from "./scenario";

function getScenarioId(): string {
  return (
    new URLSearchParams(window.location.search).get("scenario") ??
    import.meta.env.VITE_SCENARIO ??
    "default"
  );
}

function scenarioHref(id: string): string {
  const path = window.location.pathname;
  const params = new URLSearchParams(window.location.search);
  params.set("scenario", id);
  const qs = params.toString();
  return `${path}${qs ? `?${qs}` : ""}`;
}

function routeButtonLabel(id: string): string {
  return id
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("-");
}

export default function App() {
  const scenarioId = getScenarioId();
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
        className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-white px-4 py-3 shadow-sm"
        aria-label="Scenarios"
      >
        {routes.map((id) => {
          const active = id === scenarioId;
          return (
            <a
              key={id}
              href={scenarioHref(id)}
              aria-current={active ? "page" : undefined}
              className={[
                "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-gray-200 bg-gray-50 text-gray-800 hover:bg-gray-100",
              ].join(" ")}
            >
              {routeButtonLabel(id)}
            </a>
          );
        })}
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
