import { useCallback, useState } from "react";
import WhatsAppChat, { type Message } from "./WhatsAppChat";
import GoogleCalendar, { type GoogleCalendarProps } from "./GoogleCalendar";

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
  /** Google-Calendar side (animateIn/scale are controlled by the studio). */
  calendar: Omit<GoogleCalendarProps, "animateIn" | "scale">;
  /** Delay after the chat finishes before flipping to the calendar. */
  autoFlipDelayMs?: number;
  scale?: number;
  /** Hide the off-frame Restart/Flip controls (for clean recording). */
  showControls?: boolean;
};

export default function RecordingStudio({
  header,
  messages,
  direction = "rtl",
  statusBarTime,
  showStatusBar = true,
  showInputBar = true,
  syncStatusBarFromMessages = true,
  calendar,
  autoFlipDelayMs = 1400,
  scale = 0.82,
  showControls = true,
}: RecordingStudioProps) {
  const [phase, setPhase] = useState<"chat" | "calendar">("chat");
  const [runKey, setRunKey] = useState(0);

  const handleComplete = useCallback(() => {
    setTimeout(() => setPhase("calendar"), autoFlipDelayMs);
  }, [autoFlipDelayMs]);

  const restart = useCallback(() => {
    setPhase("chat");
    setRunKey((k) => k + 1);
  }, []);

  const flip = useCallback(() => {
    setPhase((p) => (p === "chat" ? "calendar" : "chat"));
  }, []);

  const boxW = PHONE_W * scale;
  const boxH = PHONE_H * scale;
  const showCalendar = phase === "calendar";

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-5 bg-gray-200 py-8 overflow-x-hidden overflow-y-auto scrollbar-hidden"
      data-testid="recording-studio"
    >
      {/* 3D flip stage */}
      <div style={{ width: boxW, height: boxH, perspective: 1800 }}>
        <div
          style={{
            position: "relative",
            width: boxW,
            height: boxH,
            transformStyle: "preserve-3d",
            transition: "transform 0.7s cubic-bezier(0.4,0,0.2,1)",
            transform: showCalendar ? "rotateY(180deg)" : "rotateY(0deg)",
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
            <WhatsAppChat
              key={runKey}
              header={header}
              messages={messages}
              direction={direction}
              statusBarTime={statusBarTime}
              showStatusBar={showStatusBar}
              showInputBar={showInputBar}
              syncStatusBarFromMessages={syncStatusBarFromMessages}
              autoplay
              showControls={false}
              scale={scale}
              onComplete={handleComplete}
            />
          </div>

          {/* Back: Google Calendar */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <GoogleCalendar
              {...calendar}
              direction={calendar.direction ?? direction}
              animateIn={showCalendar}
              scale={scale}
            />
          </div>
        </div>
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
