import { useEffect, useState } from "react";
import { Menu, UserPlus, Check } from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

export type StaffColor =
  | "blue"
  | "purple"
  | "orange"
  | "teal"
  | "pink"
  | "green";

export type StaffShift = {
  /** Shift label, e.g. "בוקר". */
  label: string;
  /** Time range, e.g. "08:00–13:00". */
  time: string;
  /** Station/role, e.g. "עמדה 1". */
  station?: string;
  /** Assigned worker name (Hebrew). */
  assignee: string;
  /** Avatar accent color. */
  color?: StaffColor;
};

export type StaffRosterProps = {
  /** App-bar title. Defaults to "סידור עבודה". */
  title?: string;
  /** Day strip label, e.g. "יום רביעי, 18 ביוני". */
  dayLabel: string;
  /** Shifts to fill, top to bottom. */
  shifts: StaffShift[];
  /** Trigger the staggered "assigning people" animation. */
  animateIn?: boolean;
  /** Delay between each name popping into its shift (ms). */
  staggerMs?: number;
  /** Fired once every shift has been assigned (scene "done" signal). */
  onSettled?: () => void;
  direction?: "ltr" | "rtl";
  showStatusBar?: boolean;
  statusBarTime?: string;
  scale?: number;
  className?: string;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

const PHONE_W = 390;
const PHONE_H = 844;

const COLOR_HEX: Record<StaffColor, string> = {
  blue: "#1a73e8",
  purple: "#8e24aa",
  orange: "#ef6c00",
  teal: "#00897b",
  pink: "#d81b60",
  green: "#0b8043",
};

const initials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

// ─── Status bar (mirrors WhatsAppChat / GoogleCalendar) ──────────────────────

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

// ─── Shift row ────────────────────────────────────────────────────────────────

function ShiftRow({
  shift,
  assigned,
}: {
  shift: StaffShift;
  assigned: boolean;
}) {
  const hex = COLOR_HEX[shift.color ?? "blue"];

  return (
    <div
      data-testid="staff-shift"
      className="flex items-center gap-3 rounded-2xl border border-[#e4e6ea] bg-white px-3 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
    >
      {/* Shift time + label */}
      <div className="min-w-[88px] shrink-0">
        <div className="text-[15px] font-semibold text-[#202124]">
          {shift.label}
        </div>
        <div className="text-[12px] tabular-nums text-[#5f6368]" dir="ltr">
          {shift.time}
        </div>
        {shift.station && (
          <div className="text-[11px] text-[#80868b]">{shift.station}</div>
        )}
      </div>

      {/* Assignment slot */}
      <div className="relative flex flex-1 items-center justify-end">
        {/* Empty slot placeholder */}
        <div
          className="flex items-center gap-2 text-[#9aa0a6]"
          style={{
            opacity: assigned ? 0 : 1,
            transition: "opacity 0.25s ease",
            position: assigned ? "absolute" : "relative",
            insetInlineEnd: 0,
          }}
        >
          <span className="text-[13px]">ממתין לשיבוץ</span>
          <span className="grid h-9 w-9 place-items-center rounded-full border-2 border-dashed border-[#cfd4da]">
            <UserPlus size={16} color="#9aa0a6" />
          </span>
        </div>

        {/* Assigned person chip */}
        <div
          data-testid="staff-assignee"
          className="flex items-center gap-2"
          style={{
            opacity: assigned ? 1 : 0,
            transform: assigned
              ? "translateY(0) scale(1)"
              : "translateY(6px) scale(0.9)",
            transition:
              "opacity 0.35s ease-out, transform 0.45s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        >
          <span className="text-[15px] font-medium text-[#202124]">
            {shift.assignee}
          </span>
          <span
            className="relative grid h-9 w-9 place-items-center rounded-full text-[13px] font-bold text-white"
            style={{ background: hex }}
          >
            {initials(shift.assignee)}
            <span
              className="absolute -bottom-0.5 -left-0.5 grid h-4 w-4 place-items-center rounded-full bg-[#0b8043] ring-2 ring-white"
              style={{
                opacity: assigned ? 1 : 0,
                transition: "opacity 0.2s ease 0.25s",
              }}
            >
              <Check size={10} color="#fff" strokeWidth={3} />
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function StaffRoster({
  title = "סידור עבודה",
  dayLabel,
  shifts,
  animateIn = false,
  staggerMs = 700,
  onSettled,
  direction = "rtl",
  showStatusBar = true,
  statusBarTime = "11:00",
  scale = 1,
  className,
}: StaffRosterProps) {
  const rtl = direction === "rtl";
  const [assignedCount, setAssignedCount] = useState(0);

  useEffect(() => {
    if (!animateIn) {
      setAssignedCount(shifts.length);
      return;
    }
    setAssignedCount(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    // Wait for the flip (0.7s) to finish, then assign people one by one.
    shifts.forEach((_, i) => {
      timers.push(
        setTimeout(
          () => setAssignedCount((c) => Math.max(c, i + 1)),
          1100 + i * staggerMs,
        ),
      );
    });
    // Signal scene done shortly after the last name lands.
    timers.push(
      setTimeout(
        () => onSettled?.(),
        1100 + shifts.length * staggerMs + 400,
      ),
    );
    return () => timers.forEach(clearTimeout);
  }, [animateIn, shifts, staggerMs, onSettled]);

  const assignedTotal = Math.min(assignedCount, shifts.length);

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
          data-testid="staff-frame"
          className="relative flex flex-col overflow-hidden bg-[#f1f3f4]"
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
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 z-10 bg-[#1a1a1a]"
            style={{ width: 126, height: 34, borderRadius: "0 0 20px 20px" }}
          />

          {showStatusBar && <StatusBar time={statusBarTime} />}

          {/* App header */}
          <div
            className="flex items-center gap-4 bg-white px-4 pt-2 pb-3"
            dir={rtl ? "rtl" : "ltr"}
          >
            <Menu size={22} color="#5f6368" />
            <span className="flex-1 text-[20px] font-medium text-[#3c4043]">
              {title}
            </span>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#0b8043] text-[14px] font-semibold text-white">
              ק
            </span>
          </div>

          {/* Day strip + progress */}
          <div
            className="flex items-center justify-between border-b border-[#e4e6ea] bg-white px-4 pb-2"
            dir={rtl ? "rtl" : "ltr"}
          >
            <span className="text-[13px] font-semibold tracking-wide text-[#0b8043]">
              {dayLabel}
            </span>
            <span
              data-testid="staff-progress"
              className="text-[12px] font-medium tabular-nums text-[#5f6368]"
              dir="ltr"
            >
              {assignedTotal}/{shifts.length}
            </span>
          </div>

          {/* Shift list */}
          <div
            data-testid="staff-view"
            className="flex-1 min-h-0 space-y-2.5 overflow-y-auto px-3 py-3 scrollbar-hidden"
            dir={rtl ? "rtl" : "ltr"}
          >
            {shifts.map((shift, i) => (
              <ShiftRow key={i} shift={shift} assigned={i < assignedTotal} />
            ))}
          </div>

          {/* home indicator */}
          <div className="flex items-center justify-center bg-white pb-2 pt-1">
            <div className="h-[5px] w-32 rounded-full bg-black opacity-20" />
          </div>
        </div>
      </div>
    </div>
  );
}
