import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { ChevronLeft, Phone, Plus, Camera, Mic } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Message = {
  id: string;
  sender: "incoming" | "outgoing";
  text: string;
  timestamp: string;
  status?: "sent" | "delivered" | "read";
  replyTo?: {
    senderName: string;
    senderColor?: string;
    text: string;
  };
  reactions?: string[];
  typingDurationMs?: number;
  delayBeforeMs?: number;
};

export type WhatsAppChatProps = {
  header: {
    avatarUrl?: string;
    name: string;
    subtitle?: string;
    unreadCount?: number;
  };
  messages: Message[];
  direction?: "ltr" | "rtl";
  showStatusBar?: boolean;
  statusBarTime?: string;
  showInputBar?: boolean;
  autoplay?: boolean;
  showControls?: boolean;
  /** When true, status bar clock follows message timestamps (idle = first message). When false, uses statusBarTime only. */
  syncStatusBarFromMessages?: boolean;
  className?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const delay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

function typingDuration(text: string, override?: number): number {
  if (override !== undefined) return override;
  return Math.min(3000, Math.max(800, text.length * 30));
}

// ─── Doodle background (inline SVG data URI) ─────────────────────────────────

const DOODLE_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' opacity='0.12'>
  <!-- Heart -->
  <text x='10' y='30' font-size='18'>♥</text>
  <text x='80' y='80' font-size='14'>♥</text>
  <text x='150' y='50' font-size='16'>♥</text>
  <!-- Star -->
  <text x='50' y='60' font-size='16'>★</text>
  <text x='120' y='30' font-size='14'>★</text>
  <text x='170' y='110' font-size='18'>★</text>
  <!-- Smiley -->
  <text x='30' y='110' font-size='18'>☺</text>
  <text x='140' y='160' font-size='16'>☺</text>
  <!-- Music note -->
  <text x='100' y='130' font-size='16'>♪</text>
  <text x='60' y='175' font-size='14'>♫</text>
  <!-- Flower -->
  <text x='170' y='75' font-size='14'>✿</text>
  <text x='20' y='165' font-size='18'>❀</text>
  <!-- Leaf -->
  <text x='110' y='170' font-size='16'>🌿</text>
</svg>`;

const DOODLE_URI = `url("data:image/svg+xml,${encodeURIComponent(DOODLE_SVG)}")`;

// ─── Read receipt icons ───────────────────────────────────────────────────────

function ReadReceipt({ status }: { status?: "sent" | "delivered" | "read" }) {
  if (!status) return null;
  const blue = "#34B7F1";
  const grey = "#8696A0";
  const color = status === "read" ? blue : grey;

  if (status === "sent") {
    return (
      <svg
        width="14"
        height="10"
        viewBox="0 0 14 10"
        fill="none"
        className="inline-block ml-1 mb-[1px]"
      >
        <path
          d="M1 5L4.5 8.5L12 1"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      width="18"
      height="10"
      viewBox="0 0 18 10"
      fill="none"
      className="inline-block ml-1 mb-[1px]"
    >
      <path
        d="M1 5L4.5 8.5L12 1"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 5L8.5 8.5L16 1"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Status bar ───────────────────────────────────────────────────────────────

function StatusBar({ time }: { time: string }) {
  return (
    <div
      className="flex items-center justify-between px-5 py-1 bg-white"
      style={{ height: 44 }}
      dir="ltr"
    >
      <span className="text-[15px] font-semibold tracking-tight text-black">
        {time}
      </span>
      <div className="flex items-center gap-1">
        {/* Signal bars */}
        <svg width="18" height="12" viewBox="0 0 18 12" fill="black">
          <rect x="0" y="8" width="3" height="4" rx="0.5" />
          <rect x="4.5" y="5.5" width="3" height="6.5" rx="0.5" />
          <rect x="9" y="3" width="3" height="9" rx="0.5" />
          <rect x="13.5" y="0" width="3" height="12" rx="0.5" />
        </svg>
        {/* 5G */}
        <span className="text-[13px] font-semibold text-black">5G</span>
        {/* Battery */}
        <svg width="27" height="13" viewBox="0 0 27 13" fill="none">
          <rect
            x="0.5"
            y="0.5"
            width="22"
            height="12"
            rx="3.5"
            stroke="black"
            strokeOpacity="0.35"
          />
          <rect x="1.5" y="1.5" width="19" height="10" rx="2.5" fill="black" />
          <path
            d="M23.5 4.5V8.5C24.3284 8.22 25 7.2 25 6.5C25 5.8 24.3284 4.78 23.5 4.5Z"
            fill="black"
            fillOpacity="0.4"
          />
        </svg>
      </div>
    </div>
  );
}

// ─── Chat header ──────────────────────────────────────────────────────────────

const HEADER_ACTION_ICON_SIZE = Math.round(22 * 1.1);

const HEADER_ACTION_PAIR_GAP_CLASS = "gap-[13px]";

function HeaderVideoCallIcon({
  size = HEADER_ACTION_ICON_SIZE,
}: {
  size?: number;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#000000"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
      <rect x="2" y="6" width="14" height="12" rx="2" fill="none" />
    </svg>
  );
}

function ChatHeader({
  avatarUrl,
  name,
  subtitle,
  unreadCount,
  rtl,
}: {
  avatarUrl?: string;
  name: string;
  subtitle: string;
  unreadCount?: number;
  rtl: boolean;
}) {
  const backBlock = (
    <div className="flex items-center gap-0.5 min-w-10 justify-center shrink-0">
      {unreadCount != null && unreadCount > 0 && (
        <span className="text-black text-[17px] font-semibold tabular-nums shrink-0 leading-none flex items-center">
          {unreadCount}
        </span>
      )}
      <ChevronLeft
        size={28}
        className="text-black"
        style={{ transform: rtl ? "scaleX(-1)" : undefined }}
        aria-hidden
      />
    </div>
  );

  const avatarBlock = (
    <div className="w-10 h-10 rounded-full overflow-hidden bg-[#DFE5E7] shrink-0 flex items-center justify-center">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className="w-full h-full object-cover"
        />
      ) : (
        <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
          <circle cx="20" cy="16" r="8" fill="#A0ADB5" />
          <ellipse cx="20" cy="36" rx="14" ry="9" fill="#A0ADB5" />
        </svg>
      )}
    </div>
  );

  const titleBlock = (
    <div
      className={`flex-1 min-w-0 ${rtl ? "text-end" : "text-start"}`}
      dir={rtl ? "rtl" : "ltr"}
    >
      <div
        data-testid="contact-name"
        className="text-[17px] font-semibold text-black leading-tight truncate"
      >
        {name}
      </div>
      <div className="text-[13px] text-[#667781] leading-tight truncate">
        {subtitle}
      </div>
    </div>
  );

  const actionsBlock = (
    <div
      dir="ltr"
      className={`flex flex-row items-center shrink-0 ${HEADER_ACTION_PAIR_GAP_CLASS}`}
    >
      <Phone size={HEADER_ACTION_ICON_SIZE} color="#000000" />
      <HeaderVideoCallIcon />
    </div>
  );

  return (
    <header
      className="flex flex-row items-center justify-between gap-2 px-2 py-2 bg-[#F6F6F6] border-b border-[#E5E5E5]"
      style={{ minHeight: 56 }}
      dir="ltr"
    >
      <div className="flex shrink-0 items-center">{backBlock}</div>

      <div className="flex flex-1 min-w-0 items-center gap-2">
        {avatarBlock}
        {titleBlock}
      </div>

      <div className="flex shrink-0 items-center">{actionsBlock}</div>
    </header>
  );
}

// ─── Typing indicator ────────────────────────────────────────────────────────

function TypingIndicator({ rtl }: { rtl: boolean }) {
  return (
    <div
      data-testid="typing-indicator"
      className={`flex ${rtl ? "justify-end" : "justify-start"} px-2 py-1`}
    >
      <div
        className="bg-white rounded-2xl rounded-bl-sm px-3 py-2 shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] flex items-center gap-1"
        style={{ minWidth: 52 }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="block w-2 h-2 rounded-full bg-[#8696A0]"
            style={{
              animation: `typingDot 1.2s ease-in-out ${i * 0.4}s infinite`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes typingDot {
          0%, 100% { opacity: 0.3; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({
  message,
  rtl,
  visible,
  showReaction,
}: {
  message: Message;
  rtl: boolean;
  visible: boolean;
  showReaction: boolean;
}) {
  const isOut = message.sender === "outgoing";

  // In RTL: incoming = right, outgoing = left
  // In LTR: incoming = left, outgoing = right
  const alignRight = rtl ? !isOut : isOut;

  const bubbleBg = isOut ? "#DCF8C6" : "#FFFFFF";

  // Tail: the tail corner is on the bottom-outside of the bubble
  const tailStyle = alignRight
    ? { borderBottomRightRadius: 4 }
    : { borderBottomLeftRadius: 4 };

  return (
    <div
      data-testid="message-bubble"
      className={`flex ${alignRight ? "justify-end" : "justify-start"} px-2 py-2 relative`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "scale(1)" : "scale(0.92)",
        transition: "opacity 0.2s ease, transform 0.2s ease",
      }}
    >
      <div className="relative max-w-[75%]">
        <div
          className="rounded-xl px-[10px] pt-[6px] pb-[4px]"
          style={{
            backgroundColor: bubbleBg,
            boxShadow: "0 1px 0.5px rgba(0,0,0,0.13)",
            borderRadius: 12,
            ...tailStyle,
          }}
        >
          {/* Reply quote */}
          {message.replyTo && (
            <div
              className="flex mb-1 rounded-lg overflow-hidden"
              style={{ backgroundColor: isOut ? "#bef5b0" : "#F0F0F0" }}
            >
              <div
                className="w-1 flex-shrink-0"
                style={{
                  backgroundColor:
                    message.replyTo.senderColor ??
                    (isOut ? "#E74C3C" : "#1F7AEC"),
                }}
              />
              <div className="px-2 py-1 min-w-0">
                <div
                  className="text-[13px] font-semibold truncate"
                  style={{
                    color:
                      message.replyTo.senderColor ??
                      (isOut ? "#E74C3C" : "#1F7AEC"),
                  }}
                >
                  {message.replyTo.senderName}
                </div>
                <div className="text-[13px] text-[#667781] truncate">
                  {message.replyTo.text}
                </div>
              </div>
            </div>
          )}

          {/* Message text + timestamp row */}
          <div className="flex items-end gap-2 flex-wrap">
            <span
              className="text-[16px] leading-[1.3] text-black break-words"
              dir={rtl ? "rtl" : "ltr"}
            >
              {message.text}
            </span>
            <span className="flex items-center gap-[2px] ml-auto mt-[2px] flex-shrink-0">
              <span className="text-[11px] text-[#667781] whitespace-nowrap">
                {message.timestamp}
              </span>
              {isOut && <ReadReceipt status={message.status} />}
            </span>
          </div>
        </div>

        {/* Emoji reaction */}
        {message.reactions && message.reactions.length > 0 && showReaction && (
          <div
            data-testid="reaction-bubble"
            className={`absolute -bottom-3 ${alignRight ? "left-1" : "right-1"} bg-white rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.15)] px-1.5 py-0.5 text-[13px] flex items-center gap-0.5`}
            style={{
              animation:
                "reactionPop 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards",
            }}
          >
            {message.reactions.join("")}
            <style>{`
              @keyframes reactionPop {
                from { opacity: 0; transform: scale(0.5); }
                to { opacity: 1; transform: scale(1); }
              }
            `}</style>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Input bar ────────────────────────────────────────────────────────────────

function InputBar({ rtl }: { rtl: boolean }) {
  const plusBtn = (
    <button type="button" className="text-[#8696A0] shrink-0 leading-none">
      <Plus size={24} strokeWidth={1.75} />
    </button>
  );
  const cameraBtn = (
    <button
      type="button"
      className="text-black shrink-0 p-0 leading-none flex items-center justify-center w-9 min-w-0 h-12"
      aria-label={rtl ? "מצלמה" : "Camera"}
    >
      <Camera size={28} strokeWidth={1.75} className="shrink-0" />
    </button>
  );
  const field = (
    <div className="flex-1 flex items-center bg-white rounded-full px-4 min-h-[40px] border border-[#E5E5E5]">
      <span className="flex-1 min-w-0 py-2" aria-hidden />
    </div>
  );
  const micBtn = (
    <button
      type="button"
      className="text-black shrink-0 p-0 leading-none flex items-center justify-center w-9 min-w-0 h-12"
      aria-label={rtl ? "הקלטה" : "Voice message"}
    >
      <Mic size={28} strokeWidth={1.75} className="shrink-0" />
    </button>
  );

  const cameraMicGroup = (
    <div className="flex items-center shrink-0 gap-3">
      {rtl ? (
        <>
          {micBtn}
          {cameraBtn}
        </>
      ) : (
        <>
          {cameraBtn}
          {micBtn}
        </>
      )}
    </div>
  );

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 sm:px-5 sm:py-4 bg-[#F6F6F6] border-t border-[#E5E5E5]"
      dir={rtl ? "rtl" : "ltr"}
    >
      {rtl ? (
        <>
          {cameraMicGroup}
          {field}
          {plusBtn}
        </>
      ) : (
        <>
          {plusBtn}
          {field}
          {cameraMicGroup}
        </>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function WhatsAppChat({
  header,
  messages,
  direction = "ltr",
  showStatusBar = true,
  statusBarTime = "15:27",
  showInputBar = true,
  autoplay = false,
  showControls = true,
  syncStatusBarFromMessages = true,
  className,
}: WhatsAppChatProps) {
  const rtl = direction === "rtl";

  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [reactionIds, setReactionIds] = useState<Set<string>>(new Set());
  const [showTyping, setShowTyping] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [done, setDone] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef(false);

  const displayedStatusTime = useMemo(() => {
    if (!syncStatusBarFromMessages) return statusBarTime;
    const visible = messages.filter((m) => visibleIds.has(m.id));
    if (visible.length === 0) {
      return messages.length > 0 ? messages[0].timestamp : statusBarTime;
    }
    return visible[visible.length - 1].timestamp;
  }, [
    syncStatusBarFromMessages,
    statusBarTime,
    messages,
    visibleIds,
  ]);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  const play = useCallback(async () => {
    if (isPlaying) return;
    cancelRef.current = false;
    setIsPlaying(true);
    setDone(false);

    for (const msg of messages) {
      if (cancelRef.current) break;

      await delay(msg.delayBeforeMs ?? 800);
      if (cancelRef.current) break;

      if (msg.sender === "incoming") {
        setShowTyping(true);
        scrollToBottom();
        await delay(typingDuration(msg.text, msg.typingDurationMs));
        if (cancelRef.current) break;
        setShowTyping(false);
      }

      setVisibleIds((prev) => new Set(prev).add(msg.id));
      scrollToBottom();

      // Trigger reveal animation on next tick
      setTimeout(() => {
        setRevealedIds((prev) => new Set(prev).add(msg.id));
      }, 20);

      if (msg.reactions && msg.reactions.length > 0) {
        await delay(300);
        if (cancelRef.current) break;
        setReactionIds((prev) => new Set(prev).add(msg.id));
      }
    }

    setShowTyping(false);
    setIsPlaying(false);
    setDone(true);
  }, [isPlaying, messages, scrollToBottom]);

  const reset = useCallback(() => {
    cancelRef.current = true;
    setIsPlaying(false);
    setDone(false);
    setVisibleIds(new Set());
    setRevealedIds(new Set());
    setReactionIds(new Set());
    setShowTyping(false);
  }, []);

  useEffect(() => {
    if (autoplay) play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [visibleIds, showTyping, scrollToBottom]);

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen bg-gray-200 py-4 overflow-y-auto${className ? ` ${className}` : ""}`}>
      {/* Controls — outside the phone frame */}
      {showControls && (
        <div className="flex gap-3 mb-8">
          {!isPlaying && !done && (
            <button
              data-testid="play-button"
              onClick={play}
              className="px-6 py-2 bg-[#25D366] text-white rounded-full font-semibold shadow hover:bg-[#1ebe5d] transition-colors"
            >
              ▶ Play
            </button>
          )}
          {(isPlaying || done) && (
            <button
              data-testid="reset-button"
              onClick={reset}
              className="px-6 py-2 bg-white text-[#25D366] border border-[#25D366] rounded-full font-semibold shadow hover:bg-gray-50 transition-colors"
            >
              ↺ Reset
            </button>
          )}
        </div>
      )}

      {/* Phone frame */}
      <div
        data-testid="phone-frame"
        className="relative flex flex-col overflow-hidden bg-white"
        style={{
          width: 390,
          height: 844,
          borderRadius: 44,
          boxShadow:
            "0 0 0 10px #1a1a1a, 0 0 0 12px #3a3a3a, 0 30px 60px rgba(0,0,0,0.4)",
        }}
        dir="ltr"
      >
        {/* Notch */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 z-10 bg-[#1a1a1a]"
          style={{ width: 126, height: 34, borderRadius: "0 0 20px 20px" }}
        />

        {showStatusBar && <StatusBar time={displayedStatusTime} />}

        <ChatHeader
          avatarUrl={header.avatarUrl}
          name={header.name}
          subtitle={header.subtitle ?? "tap here to add to contacts"}
          unreadCount={header.unreadCount}
          rtl={rtl}
        />

        {/* Message area */}
        <div
          ref={scrollRef}
          dir="ltr"
          className="flex-1 overflow-y-auto py-2"
          style={{
            backgroundImage: DOODLE_URI,
            backgroundSize: "200px 200px",
            backgroundColor: "#EFE7DD",
          }}
        >
          {messages.map((msg) =>
            visibleIds.has(msg.id) ? (
              <MessageBubble
                key={msg.id}
                message={msg}
                rtl={rtl}
                visible={revealedIds.has(msg.id)}
                showReaction={reactionIds.has(msg.id)}
              />
            ) : null,
          )}

          {showTyping && <TypingIndicator rtl={rtl} />}

          {/* Bottom padding so last message isn't clipped by reaction bubbles */}
          <div className="h-5" />
        </div>

        {showInputBar && <InputBar rtl={rtl} />}

        {/* iPhone home indicator */}
        <div className="flex justify-center items-center pb-2 pt-1 bg-white">
          <div className="w-32 h-[5px] bg-black rounded-full opacity-20" />
        </div>
      </div>
    </div>
  );
}
