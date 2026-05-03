export type MessageStatus = "sent" | "delivered" | "read";
export type Direction = "ltr" | "rtl";

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
};

export type ScenarioFile = {
  header: {
    name: string;
    subtitle?: string;
    unreadCount?: number;
    avatar?: string;
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
  header: ScenarioFile["header"] & { avatarUrl?: string };
};

export async function loadScenario(
  id: string,
  signal?: AbortSignal
): Promise<LoadedScenario> {
  const res = await fetch(`/scenarios/${id}/scenario.json`, { signal });
  if (!res.ok) {
    throw new Error(`Scenario "${id}" not found (HTTP ${res.status})`);
  }
  const data: ScenarioFile = await res.json();
  const avatarUrl = data.header.avatar
    ? `/scenarios/${id}/${data.header.avatar}`
    : undefined;
  return {
    ...data,
    header: { ...data.header, avatarUrl },
  };
}
