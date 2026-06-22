import type { CalendarEvent } from "./GoogleCalendar";
import type { StaffShift } from "./StaffRoster";

export type MessageStatus = "sent" | "delivered" | "read";
export type Direction = "ltr" | "rtl";

/**
 * Optional branded opening title card. When present (with a `calendar`), the
 * studio shows it first — logo + name + a Hebrew leading line — then fades into
 * the chat.
 */
export type ScenarioIntro = {
  /** Logo asset. Defaults to the bundled handinhand mark. */
  logoUrl?: string;
  /** Wordmark, e.g. "handinhand". */
  brandName?: string;
  /** The Hebrew leading sentence (headline). */
  tagline: string;
  /** Optional smaller line under the tagline. */
  subline?: string;
  statusBarTime?: string;
};

/**
 * Optional staff-roster block. When present (alongside a `calendar`), the studio
 * flips to a shift board after the reminder and assigns each worker in turn.
 */
export type ScenarioStaff = {
  /** App-bar title. Defaults to "סידור עבודה". */
  title?: string;
  /** Day strip label, e.g. "יום רביעי, 18 ביוני". */
  dayLabel: string;
  /** Shifts to fill, top to bottom. */
  shifts: StaffShift[];
  /** Delay between each name popping into its shift (ms). */
  staggerMs?: number;
  statusBarTime?: string;
};

/**
 * Optional calendar block. When present on a scenario, the playground renders
 * the RecordingStudio (chat plays, then the screen flips to this calendar and
 * `newEvent` pops in).
 */
export type ScenarioCalendar = {
  monthLabel: string;
  dayLabel: string;
  nowTime?: string;
  dayStartHour?: number;
  dayEndHour?: number;
  newBadge?: string;
  events: CalendarEvent[];
  newEvent: CalendarEvent;
};

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
  /**
   * Optional date-separator chip rendered ABOVE this message (WhatsApp-style),
   * e.g. "היום" / "אתמול" / "יום שלישי". Use it to make a later message read as
   * a different day — e.g. a next-morning reminder.
   */
  daySeparator?: string;
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
  /**
   * Optional custom chat wallpaper. `image` is a scenario-relative asset (or an
   * absolute/`/`-rooted URL); the overlay dims it so text stays high-contrast.
   */
  chatBackground?: {
    image: string;
    overlayColor?: string;
    overlayOpacity?: number;
  };
  direction?: Direction;
  statusBarTime?: string;
  showStatusBar?: boolean;
  showInputBar?: boolean;
  autoplay?: boolean;
  showControls?: boolean;
  syncStatusBarFromMessages?: boolean;
  /** Branded opening title card shown before the chat. */
  intro?: ScenarioIntro;
  /** How long the intro holds before fading into the chat (ms). */
  introDurationMs?: number;
  /** Branded chapter caption (Hebrew) shown before each scene, keyed by scene. */
  captions?: Partial<Record<"chat" | "calendar" | "reminder" | "staff", string>>;
  /** How long each caption holds before revealing its scene (ms). */
  captionDurationMs?: number;
  calendar?: ScenarioCalendar;
  /**
   * Optional follow-up message(s) shown AFTER the calendar flip. When present
   * (with a `calendar`), the studio holds the calendar for `reminderDelayMs`,
   * flips back to the chat, and plays these — e.g. a same-day appointment
   * reminder with a payment link.
   */
  reminder?: ScenarioMessage[];
  /** How long the calendar stays before flipping back to the reminder (ms). */
  reminderDelayMs?: number;
  /** Staff-roster screen shown after the reminder (owner schedules his team). */
  staff?: ScenarioStaff;
  /** How long the reminder stays before flipping to the staff roster (ms). */
  staffDelayMs?: number;
  /** Closing call-to-action card (same design as the intro) shown last. */
  outro?: ScenarioIntro;
};

export type LoadedScenario = Omit<ScenarioFile, "chatBackground"> & {
  header: ScenarioFile["header"] & { profileImageUrl?: string };
  /** `chatBackground.image` resolved to a usable URL (renamed `imageUrl`). */
  chatBackground?: {
    imageUrl: string;
    overlayColor?: string;
    overlayOpacity?: number;
  };
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
  const resolveImages = (list: ScenarioMessage[]): ScenarioMessage[] =>
    list.map((m) =>
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
  const messages = resolveImages(data.messages);
  const reminder = data.reminder ? resolveImages(data.reminder) : undefined;
  const chatBackground = data.chatBackground
    ? {
        imageUrl: resolveScenarioAssetUrl(id, data.chatBackground.image),
        overlayColor: data.chatBackground.overlayColor,
        overlayOpacity: data.chatBackground.overlayOpacity,
      }
    : undefined;
  return {
    ...data,
    header: { ...data.header, profileImageUrl },
    messages,
    reminder,
    chatBackground,
  };
}
