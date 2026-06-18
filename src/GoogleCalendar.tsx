import { useEffect, useRef, useState } from "react";
import { Menu, Search } from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

export type CalendarEventColor =
  | "blue"
  | "purple"
  | "orange"
  | "teal"
  | "pink"
  | "green";

export type CalendarEvent = {
  /** "HH:MM" 24h start time */
  time: string;
  durationMin: number;
  title: string;
  subtitle?: string;
  color?: CalendarEventColor;
};

export type GoogleCalendarProps = {
  /** Month/year title, e.g. "יוני 2026". */
  monthLabel: string;
  /** Day strip label, e.g. "יום רביעי, 18 ביוני". */
  dayLabel: string;
  /** Existing events already on the calendar. */
  events: CalendarEvent[];
  /** The booking that animates in (when animateIn is true). */
  newEvent?: CalendarEvent;
  /** Trigger the new event's pop-in animation. */
  animateIn?: boolean;
  /** "now" indicator time, e.g. "14:05". Hidden when omitted. */
  nowTime?: string;
  dayStartHour?: number;
  dayEndHour?: number;
  direction?: "ltr" | "rtl";
  showStatusBar?: boolean;
  statusBarTime?: string;
  /** Label for the "new" badge (RTL default Hebrew). */
  newBadge?: string;
  scale?: number;
  className?: string;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

const PHONE_W = 390;
const PHONE_H = 844;
const HOUR_PX = 64;

const COLOR_HEX: Record<CalendarEventColor, string> = {
  blue: "#1a73e8",
  purple: "#8e24aa",
  orange: "#ef6c00",
  teal: "#00897b",
  pink: "#d81b60",
  green: "#0b8043",
};

const toMin = (hm: string): number => {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
};

// ─── Status bar (mirrors WhatsAppChat for a matching phone frame) ────────────

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
        <svg width="18" height="12" viewBox="0 0 18 12" fill="black">
          <rect x="0" y="8" width="3" height="4" rx="0.5" />
          <rect x="4.5" y="5.5" width="3" height="6.5" rx="0.5" />
          <rect x="9" y="3" width="3" height="9" rx="0.5" />
          <rect x="13.5" y="0" width="3" height="12" rx="0.5" />
        </svg>
        <span className="text-[13px] font-semibold text-black">5G</span>
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

// ─── Event block ──────────────────────────────────────────────────────────────

function EventBlock({
  ev,
  startHour,
  isNew,
  popped,
  newBadge,
}: {
  ev: CalendarEvent;
  startHour: number;
  isNew?: boolean;
  popped?: boolean;
  newBadge: string;
}) {
  const top = ((toMin(ev.time) - startHour * 60) / 60) * HOUR_PX;
  const height = Math.max(26, (ev.durationMin / 60) * HOUR_PX);
  const hex = COLOR_HEX[ev.color ?? "blue"];

  return (
    <div
      data-testid={isNew ? "calendar-event-new" : "calendar-event"}
      className="absolute text-white shadow"
      style={{
        top,
        height,
        insetInlineStart: 8,
        insetInlineEnd: 12,
        borderRadius: 8,
        padding: "4px 10px",
        overflow: isNew ? "visible" : "hidden",
        background: hex,
        boxShadow: isNew
          ? `0 0 0 3px ${hex}40, 0 8px 18px rgba(0,0,0,0.30)`
          : "0 1px 2px rgba(0,0,0,0.18)",
        transform: isNew ? (popped ? "scale(1)" : "scale(0.6)") : undefined,
        opacity: isNew ? (popped ? 1 : 0) : 1,
        transition: isNew
          ? "transform 0.5s cubic-bezier(0.34,1.56,0.64,1), opacity 0.4s ease-out"
          : undefined,
        zIndex: isNew ? 5 : 2,
      }}
    >
      <div className="flex items-start justify-between gap-1">
        <span className="text-[12px] font-semibold leading-tight truncate">
          {ev.time} {ev.title}
        </span>
        {isNew && (
          <span
            className="shrink-0 rounded-full bg-white px-1.5 text-[9px] font-extrabold leading-[14px]"
            style={{ color: hex }}
          >
            {newBadge}
          </span>
        )}
      </div>
      {ev.subtitle && (
        <div className="text-[11px] leading-tight opacity-95 truncate">
          {ev.subtitle}
        </div>
      )}

      {isNew && (
        <svg
          className="pointer-events-none absolute"
          style={{ top: -12, left: -10, width: "calc(100% + 20px)", height: "calc(100% + 24px)" }}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          fill="none"
          aria-hidden="true"
        >
          {/* hand-drawn marker loop with a slight overshoot tail */}
          <path
            d="M50 6 C80 4 97 24 95 50 C94 77 73 96 49 95 C24 96 4 76 6 50 C5 25 24 5 54 5 C66 5 76 9 82 16"
            pathLength={100}
            stroke="#ff3b30"
            strokeWidth={3}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            style={{
              strokeDasharray: 100,
              strokeDashoffset: popped ? 0 : 100,
              animation: popped
                ? "gc-draw 0.85s cubic-bezier(0.65,0,0.35,1) 0.35s both"
                : undefined,
            }}
          />
        </svg>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function GoogleCalendar({
  monthLabel,
  dayLabel,
  events,
  newEvent,
  animateIn = false,
  nowTime,
  dayStartHour = 8,
  dayEndHour = 21,
  direction = "rtl",
  showStatusBar = true,
  statusBarTime = "14:05",
  newBadge = "חדש",
  scale = 1,
  className,
}: GoogleCalendarProps) {
  const rtl = direction === "rtl";
  const [popped, setPopped] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!animateIn || !newEvent) return;
    const t = setTimeout(() => {
      setPopped(true);
      if (gridRef.current) {
        const top =
          ((toMin(newEvent.time) - dayStartHour * 60) / 60) * HOUR_PX;
        gridRef.current.scrollTo({ top: Math.max(0, top - 150), behavior: "smooth" });
      }
    }, 650);
    return () => clearTimeout(t);
  }, [animateIn, newEvent, dayStartHour]);

  const hours: number[] = [];
  for (let h = dayStartHour; h <= dayEndHour; h++) hours.push(h);
  const totalH = (dayEndHour - dayStartHour) * HOUR_PX;
  const nowTop =
    nowTime !== undefined
      ? ((toMin(nowTime) - dayStartHour * 60) / 60) * HOUR_PX
      : null;

  return (
    <div
      className={`inline-flex flex-col items-center${className ? ` ${className}` : ""}`}
      style={{ background: "transparent" }}
    >
      <div
        style={{
          width: PHONE_W * scale,
          height: PHONE_H * scale,
          flexShrink: 0,
          position: "relative",
        }}
      >
        <div
          data-testid="calendar-frame"
          className="relative flex flex-col overflow-hidden bg-white"
          style={{
            width: PHONE_W,
            height: PHONE_H,
            borderRadius: 44,
            boxShadow:
              "0 0 0 10px #1a1a1a, 0 0 0 12px #3a3a3a, 0 30px 60px rgba(0,0,0,0.4)",
            transform: scale !== 1 ? `scale(${scale})` : undefined,
            transformOrigin: "top left",
            position: "absolute",
            top: 0,
            left: 0,
          }}
          dir="ltr"
        >
          <style>{`@keyframes gc-draw { from { stroke-dashoffset: 100; } to { stroke-dashoffset: 0; } }`}</style>

          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 z-10 bg-[#1a1a1a]"
            style={{ width: 126, height: 34, borderRadius: "0 0 20px 20px" }}
          />

          {showStatusBar && <StatusBar time={statusBarTime} />}

          {/* App header */}
          <div
            className="flex items-center gap-4 px-4 pt-2 pb-3 bg-white"
            dir={rtl ? "rtl" : "ltr"}
          >
            <Menu size={22} color="#5f6368" />
            <span className="text-[20px] font-medium text-[#3c4043] flex-1">
              {monthLabel}
            </span>
            <Search size={20} color="#5f6368" />
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#1a73e8] text-[14px] font-semibold text-white">
              ק
            </span>
          </div>

          {/* Day strip */}
          <div
            className="border-b border-[#e4e6ea] px-4 pb-2"
            dir={rtl ? "rtl" : "ltr"}
          >
            <span className="text-[13px] font-semibold tracking-wide text-[#1a73e8]">
              {dayLabel}
            </span>
          </div>

          {/* Day grid */}
          <div
            ref={gridRef}
            data-testid="calendar-view"
            className="relative flex-1 min-h-0 overflow-y-auto scrollbar-hidden"
            dir={rtl ? "rtl" : "ltr"}
          >
            <div className="relative flex" style={{ height: totalH }}>
              {/* hour gutter */}
              <div className="relative shrink-0" style={{ width: 56 }}>
                {hours.map((h) => (
                  <span
                    key={h}
                    className="absolute text-[11px] text-[#80868b]"
                    style={{
                      top: (h - dayStartHour) * HOUR_PX - 6,
                      insetInlineEnd: 8,
                    }}
                  >
                    {String(h).padStart(2, "0")}:00
                  </span>
                ))}
              </div>

              {/* events column */}
              <div
                className="relative flex-1 border-s border-[#e4e6ea]"
                style={{ height: totalH }}
              >
                {hours.map((h) => (
                  <div
                    key={h}
                    className="absolute inset-x-0 border-t border-[#e4e6ea]"
                    style={{ top: (h - dayStartHour) * HOUR_PX }}
                  />
                ))}

                {events.map((ev, i) => (
                  <EventBlock
                    key={i}
                    ev={ev}
                    startHour={dayStartHour}
                    newBadge={newBadge}
                  />
                ))}

                {newEvent && (
                  <EventBlock
                    ev={newEvent}
                    startHour={dayStartHour}
                    isNew
                    popped={!animateIn || popped}
                    newBadge={newBadge}
                  />
                )}

                {nowTop !== null && (
                  <div
                    className="absolute inset-x-0 z-[6]"
                    style={{ top: nowTop, borderTop: "2px solid #ea4335" }}
                  >
                    <span
                      className="absolute h-2.5 w-2.5 rounded-full bg-[#ea4335]"
                      style={{ top: -5, insetInlineStart: -5 }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* home indicator */}
          <div className="flex justify-center items-center pb-2 pt-1 bg-white">
            <div className="w-32 h-[5px] bg-black rounded-full opacity-20" />
          </div>
        </div>
      </div>
    </div>
  );
}
