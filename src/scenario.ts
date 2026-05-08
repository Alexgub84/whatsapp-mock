export type MessageStatus = "sent" | "delivered" | "read";
export type Direction = "ltr" | "rtl";

export type ScenarioMessageImage = {
  url: string;
  width?: number;
  height?: number;
  caption?: string;
};

export type ScenarioMessage = {
  id: string;
  sender: "incoming" | "outgoing";
  text: string;
  timestamp: string;
  status?: MessageStatus;
  replyTo?: {
    senderName: string;
    senderColor?: string;
    text: string;
  };
  reactions?: string[];
  typingDurationMs?: number;
  delayBeforeMs?: number;
  image?: ScenarioMessageImage;
};

export type ScenarioFile = {
  description?: string;
  header: {
    name: string;
    subtitle?: string;
    unreadCount?: number;
    profile_image?: string;
  };
  messages: ScenarioMessage[];
  direction?: Direction;
  statusBarTime?: string;
  showStatusBar?: boolean;
  showInputBar?: boolean;
  autoplay?: boolean;
  showControls?: boolean;
  syncStatusBarFromMessages?: boolean;
};

export type LoadedScenario = ScenarioFile & {
  header: ScenarioFile["header"] & { profileImageUrl?: string };
};

function resolveScenarioAssetUrl(scenarioId: string, url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return url;
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("/"))
    return trimmed;
  return `/scenarios/${scenarioId}/${trimmed}`;
}

export async function loadScenarioRouteIds(
  signal?: AbortSignal
): Promise<string[]> {
  const res = await fetch("/scenarios/registry.json", { signal });
  if (!res.ok) {
    throw new Error(`Scenario registry missing (HTTP ${res.status})`);
  }
  const data: unknown = await res.json();
  if (
    data &&
    typeof data === "object" &&
    "routes" in data &&
    Array.isArray((data as { routes: unknown }).routes) &&
    (data as { routes: unknown[] }).routes.every((x) => typeof x === "string")
  ) {
    return (data as { routes: string[] }).routes;
  }
  if (Array.isArray(data) && data.every((x) => typeof x === "string")) {
    return data;
  }
  throw new Error("Invalid scenario registry shape");
}

export async function loadScenario(
  id: string,
  signal?: AbortSignal
): Promise<LoadedScenario> {
  const res = await fetch(`/scenarios/${id}/scenario.json`, { signal });
  if (!res.ok) {
    throw new Error(`Scenario "${id}" not found (HTTP ${res.status})`);
  }
  const data: ScenarioFile = await res.json();
  const profileImageUrl = data.header.profile_image
    ? resolveScenarioAssetUrl(id, data.header.profile_image)
    : undefined;
  const messages = data.messages.map((m) =>
    m.image?.url
      ? {
          ...m,
          image: {
            ...m.image,
            url: resolveScenarioAssetUrl(id, m.image.url),
          },
        }
      : m,
  );
  return {
    ...data,
    header: { ...data.header, profileImageUrl },
    messages,
  };
}
