import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import WhatsAppChat, {
  type Message,
  type ChatBackground,
} from "./WhatsAppChat";
import GoogleCalendar, { type GoogleCalendarProps } from "./GoogleCalendar";
import StaffRoster, { type StaffRosterProps } from "./StaffRoster";
import IntroCard, { type IntroCardProps } from "./IntroCard";

/**
 * The montage is an ordered list of scenes. Each scene plays its own content
 * and signals when it is finished (chat/reminder via `onComplete`, calendar/
 * staff via `onSettled`). The studio then holds a beat and advances to the next
 * scene — flips are driven by scene completion, never by a blind global timer.
 * The optional branded `intro` title card always comes first.
 */
type Scene =
  | "intro"
  | "chat"
  | "calendar"
  | "reminder"
  | "staff"
  | "outro";

const PHONE_W = 390;
const PHONE_H = 844;

export type RecordingStudioProps = {
  /** WhatsApp chat side. */
  header: {
    profileImageUrl?: string;
    name: string;
    subtitle?: string;
    unreadCount?: number;
  };
  messages: Message[];
  direction?: "ltr" | "rtl";
  statusBarTime?: string;
  showStatusBar?: boolean;
  showInputBar?: boolean;
  syncStatusBarFromMessages?: boolean;
  /**
   * Optional branded opening title card (logo + name + Hebrew leading line).
   * When set it plays first, then fades into the chat. animateIn/scale/direction
   * are controlled by the studio.
   */
  intro?: Omit<IntroCardProps, "animateIn" | "scale">;
  /** How long the intro title card holds before fading into the chat (ms). */
  introDurationMs?: number;
  /**
   * Optional branded caption card shown right before each scene — a chapter
   * label (Hebrew) on the same design as the intro. Keyed by scene name.
   */
  captions?: Partial<Record<"chat" | "calendar" | "reminder" | "staff", string>>;
  /** How long each caption card holds before revealing its scene (ms). */
  captionDurationMs?: number;
  /** Google-Calendar side (animateIn/scale are controlled by the studio). */
  calendar: Omit<GoogleCalendarProps, "animateIn" | "scale">;
  /** Delay after the chat finishes before flipping to the calendar. */
  autoFlipDelayMs?: number;
  /**
   * Optional follow-up message(s). When set, the studio holds the calendar for
   * `reminderDelayMs`, flips back to the chat, and animates these on top of the
   * already-shown conversation (e.g. a same-day reminder + payment link).
   */
  reminder?: Message[];
  /** How long the calendar stays before flipping back to the reminder (ms). */
  reminderDelayMs?: number;
  /**
   * Optional staff-roster screen. When set, after the reminder the studio flips
   * to a shift board and assigns workers one by one (the owner scheduling his
   * team). animateIn/scale/direction are controlled by the studio.
   */
  staff?: Omit<StaffRosterProps, "animateIn" | "scale">;
  /** How long the reminder stays before flipping to the staff roster (ms). */
  staffDelayMs?: number;
  /**
   * Optional closing call-to-action card (same design as the intro) shown after
   * the last scene — e.g. "talk to us to build your own smart assistant". It is
   * terminal: it fades in and holds until the recording stops.
   */
  outro?: Omit<IntroCardProps, "animateIn" | "scale">;
  scale?: number;
  /** Hide the off-frame Restart/Flip controls (for clean recording). */
  showControls?: boolean;
  /** Optional custom chat wallpaper (image + dimming overlay) for the chat face. */
  chatBackground?: ChatBackground;
};

export default function RecordingStudio({
  header,
  messages,
  direction = "rtl",
  statusBarTime,
  showStatusBar = true,
  showInputBar = true,
  syncStatusBarFromMessages = true,
  intro,
  introDurationMs = 3200,
  captions,
  captionDurationMs = 2400,
  calendar,
  autoFlipDelayMs = 4400,
  reminder,
  reminderDelayMs = 3000,
  staff,
  staffDelayMs = 3000,
  outro,
  scale = 0.82,
  showControls = true,
  chatBackground,
}: RecordingStudioProps) {
  const hasIntro = !!intro;
  const hasReminder = !!reminder && reminder.length > 0;
  const hasStaff = !!staff && staff.shifts.length > 0;
  const hasOutro = !!outro;

  // Build the ordered scene list from whatever blocks the scenario provides.
  const scenes = useMemo<Scene[]>(() => {
    const s: Scene[] = [];
    if (hasIntro) s.push("intro");
    s.push("chat", "calendar");
    if (hasReminder) s.push("reminder");
    if (hasStaff) s.push("staff");
    if (hasOutro) s.push("outro");
    return s;
  }, [hasIntro, hasReminder, hasStaff, hasOutro]);

  const [sceneIdx, setSceneIdx] = useState(0);
  const [runKey, setRunKey] = useState(0);
  const [captionActive, setCaptionActive] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clampedIdx = Math.min(sceneIdx, scenes.length - 1);
  const scene = scenes[clampedIdx];

  // A scene's optional chapter caption (intro/outro have their own cards).
  const captionLabel =
    scene === "intro" || scene === "outro" ? undefined : captions?.[scene];

  // A scene finished: hold a beat so the viewer can read it, then advance.
  const holdAndAdvance = useCallback(
    (ms: number) => {
      if (holdTimer.current) clearTimeout(holdTimer.current);
      holdTimer.current = setTimeout(() => {
        setSceneIdx((i) => Math.min(i + 1, scenes.length - 1));
      }, ms);
    },
    [scenes.length],
  );

  const onChatDone = useCallback(
    () => holdAndAdvance(autoFlipDelayMs),
    [holdAndAdvance, autoFlipDelayMs],
  );
  const onCalendarSettled = useCallback(
    () => holdAndAdvance(reminderDelayMs),
    [holdAndAdvance, reminderDelayMs],
  );
  const onReminderDone = useCallback(
    () => holdAndAdvance(staffDelayMs),
    [holdAndAdvance, staffDelayMs],
  );
  // After the roster fills, hold the board a beat, then advance to the outro CTA
  // (only wired when an outro exists — otherwise the roster is the final scene).
  const onStaffDone = useCallback(
    () => holdAndAdvance(staffDelayMs),
    [holdAndAdvance, staffDelayMs],
  );

  useEffect(() => {
    return () => {
      if (holdTimer.current) clearTimeout(holdTimer.current);
    };
  }, []);

  // The intro is a title card with no content-completion event — it holds for a
  // fixed beat, then fades into the chat (which only mounts once we leave it).
  useEffect(() => {
    if (scene !== "intro") return;
    const t = setTimeout(
      () => setSceneIdx((i) => Math.min(i + 1, scenes.length - 1)),
      introDurationMs,
    );
    return () => clearTimeout(t);
  }, [scene, introDurationMs, scenes.length]);

  // Each scene may open with a branded chapter caption that covers it, holds a
  // beat, then reveals the scene (whose playback is gated until the caption is
  // gone). Re-runs whenever the active scene changes.
  useEffect(() => {
    if (scene === "intro" || !captionLabel) {
      setCaptionActive(false);
      return;
    }
    setCaptionActive(true);
    const t = setTimeout(() => setCaptionActive(false), captionDurationMs);
    return () => clearTimeout(t);
  }, [scene, captionLabel, captionDurationMs]);

  const restart = useCallback(() => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    setSceneIdx(0);
    setRunKey((k) => k + 1);
  }, []);

  const flip = useCallback(() => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    setSceneIdx((i) => (i + 1) % scenes.length);
  }, [scenes.length]);

  const boxW = PHONE_W * scale;
  const boxH = PHONE_H * scale;
  const showCalendar = scene === "calendar";
  const inStaff = scene === "staff";
  const showBack = scene === "calendar" || inStaff;

  // The front face holds the chat. Once we reach the reminder scene it re-mounts
  // with the reminder appended (earlier bubbles shown instantly) and stays put
  // through any later scenes, so flipping away and back never replays it.
  const reminderIdx = scenes.indexOf("reminder");
  const showReminderChat =
    hasReminder && reminderIdx !== -1 && clampedIdx >= reminderIdx;
  const frontMessages =
    showReminderChat && reminder ? [...messages, ...reminder] : messages;
  const frontKey = showReminderChat
    ? `reminder-${runKey}`
    : `chat-${runKey}`;
  const frontPlayFrom = showReminderChat ? messages.length : 0;
  const frontOnComplete =
    scene === "chat"
      ? onChatDone
      : scene === "reminder"
        ? onReminderDone
        : undefined;

  // While a caption covers the active front scene (chat/reminder), don't mount
  // it yet — so its playback starts only when the caption clears. Back-face
  // scenes (calendar/staff) keep the chat mounted (rotated away) and gate their
  // own pop-in animation on the caption instead.
  const frontSceneActive = scene === "chat" || scene === "reminder";
  const mountFront = scene !== "intro" && !(frontSceneActive && captionActive);
  const overlayActive = scene === "intro" || scene === "outro" || captionActive;

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-5 bg-gray-200 py-8 overflow-x-hidden overflow-y-auto scrollbar-hidden"
      data-testid="recording-studio"
      data-scene={scene}
    >
      {/* 3D flip stage */}
      <div
        style={{
          width: boxW,
          height: boxH,
          perspective: 1800,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "relative",
            width: boxW,
            height: boxH,
            transformStyle: "preserve-3d",
            transition: "transform 0.7s cubic-bezier(0.4,0,0.2,1)",
            transform: showBack ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Front: WhatsApp chat */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
          >
            {/* Mounts only once the intro/caption clears, so playback is on cue. */}
            {mountFront && (
              <WhatsAppChat
                key={frontKey}
                header={header}
                messages={frontMessages}
                playFromIndex={frontPlayFrom}
                direction={direction}
                statusBarTime={statusBarTime}
                showStatusBar={showStatusBar}
                showInputBar={showInputBar}
                syncStatusBarFromMessages={syncStatusBarFromMessages}
                chatBackground={chatBackground}
                autoplay
                showControls={false}
                scale={scale}
                onComplete={frontOnComplete}
              />
            )}
          </div>

          {/* Back: Google Calendar, or the staff roster once we reach it. */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            {inStaff && staff ? (
              <StaffRoster
                {...staff}
                direction={staff.direction ?? direction}
                animateIn={inStaff && !captionActive}
                onSettled={hasOutro ? onStaffDone : undefined}
                scale={scale}
              />
            ) : (
              <GoogleCalendar
                {...calendar}
                direction={calendar.direction ?? direction}
                animateIn={showCalendar && !captionActive}
                onSettled={onCalendarSettled}
                scale={scale}
              />
            )}
          </div>
        </div>

        {/* Branded overlay: the intro title card, a chapter caption before each
            scene, and the closing outro CTA. All share the same card design; it
            fades in to cover, then out to reveal the scene (the outro stays up). */}
        {(hasIntro || captions || hasOutro) && (
          <div
            data-testid="intro-overlay"
            style={{
              position: "absolute",
              inset: 0,
              opacity: overlayActive ? 1 : 0,
              transition: "opacity 0.6s ease",
              pointerEvents: "none",
            }}
          >
            {scene === "intro" && intro ? (
              <IntroCard
                {...intro}
                direction={intro.direction ?? direction}
                animateIn={scene === "intro"}
                scale={scale}
              />
            ) : scene === "outro" && outro ? (
              <IntroCard
                {...outro}
                direction={outro.direction ?? direction}
                animateIn={scene === "outro"}
                scale={scale}
              />
            ) : (
              <IntroCard
                logoUrl={intro?.logoUrl}
                brandName={intro?.brandName}
                statusBarTime={intro?.statusBarTime}
                tagline={captionLabel ?? ""}
                direction={intro?.direction ?? direction}
                animateIn={captionActive}
                scale={scale}
              />
            )}
          </div>
        )}
      </div>

      {showControls && (
        <div className="flex gap-3">
          <button
            data-testid="studio-restart"
            onClick={restart}
            className="rounded-full border border-[#25D366] bg-white px-6 py-2 font-semibold text-[#25D366] shadow transition-colors hover:bg-gray-50"
          >
            ↺ Restart
          </button>
          <button
            data-testid="studio-flip"
            onClick={flip}
            className="rounded-full bg-[#25D366] px-6 py-2 font-semibold text-white shadow transition-colors hover:bg-[#1ebe5d]"
          >
            ⇄ Flip
          </button>
        </div>
      )}
    </div>
  );
}
