import { useEffect, useState } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────

export type IntroCardProps = {
  /** Brand logo. Defaults to the bundled handinhand mark. */
  logoUrl?: string;
  /** Wordmark shown under the logo, e.g. "handinhand". */
  brandName?: string;
  /** The Hebrew leading sentence (headline). */
  tagline: string;
  /** Optional smaller line under the tagline. */
  subline?: string;
  /** Trigger the fade/rise-in animation. */
  animateIn?: boolean;
  direction?: "ltr" | "rtl";
  showStatusBar?: boolean;
  statusBarTime?: string;
  scale?: number;
  className?: string;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

const PHONE_W = 390;
const PHONE_H = 844;

const NAVY = "#21374F";
const GREEN = "#8CC63F";
const WORD_GREEN = "#8DC63F";
const WORD_ORANGE = "#EF8A3C";

// ─── Brand wordmark (matches the site header: HandInHandAI, AI emphasized) ───

function Wordmark({ brandName }: { brandName: string }) {
  const normalized = brandName.replace(/\s+/g, "").toLowerCase();
  // Only the house brand gets the styled HandInHand AI wordmark.
  if (normalized !== "handinhand" && normalized !== "handinhandai") {
    return <>{brandName}</>;
  }
  return (
    <span style={{ direction: "ltr", letterSpacing: "-0.01em" }}>
      Hand
      <span style={{ color: WORD_GREEN }}>In</span>
      Hand
      <span
        style={{
          color: WORD_ORANGE,
          fontWeight: 800,
          fontSize: "1.2em",
          letterSpacing: "0.01em",
        }}
      >
        AI
      </span>
    </span>
  );
}

// ─── Status bar (mirrors the other phone frames) ─────────────────────────────

function StatusBar({ time }: { time: string }) {
  return (
    <div
      className="flex items-center justify-between px-5 py-1"
      style={{ height: 44 }}
      dir="ltr"
    >
      <span className="text-[15px] font-semibold tracking-tight text-white">
        {time}
      </span>
      <div className="flex items-center gap-1">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="white">
          <rect x="0" y="8" width="3" height="4" rx="0.5" />
          <rect x="4.5" y="5.5" width="3" height="6.5" rx="0.5" />
          <rect x="9" y="3" width="3" height="9" rx="0.5" />
          <rect x="13.5" y="0" width="3" height="12" rx="0.5" />
        </svg>
        <span className="text-[13px] font-semibold text-white">5G</span>
        <svg width="27" height="13" viewBox="0 0 27 13" fill="none">
          <rect
            x="0.5"
            y="0.5"
            width="22"
            height="12"
            rx="3.5"
            stroke="white"
            strokeOpacity="0.45"
          />
          <rect x="1.5" y="1.5" width="19" height="10" rx="2.5" fill="white" />
          <path
            d="M23.5 4.5V8.5C24.3284 8.22 25 7.2 25 6.5C25 5.8 24.3284 4.78 23.5 4.5Z"
            fill="white"
            fillOpacity="0.5"
          />
        </svg>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function IntroCard({
  logoUrl = "/brand/handinhand-logo.png",
  brandName = "handinhand",
  tagline,
  subline,
  animateIn = false,
  direction = "rtl",
  showStatusBar = true,
  statusBarTime = "8:00",
  scale = 1,
  className,
}: IntroCardProps) {
  const rtl = direction === "rtl";
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!animateIn) {
      setShown(true);
      return;
    }
    setShown(false);
    const t = setTimeout(() => setShown(true), 60);
    return () => clearTimeout(t);
  }, [animateIn]);

  const rise = (delayMs: number) => ({
    opacity: shown ? 1 : 0,
    transform: shown ? "translateY(0)" : "translateY(14px)",
    transition: `opacity 0.6s ease ${delayMs}ms, transform 0.6s cubic-bezier(0.22,1,0.36,1) ${delayMs}ms`,
  });

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
          data-testid="intro-frame"
          className="relative flex flex-col overflow-hidden"
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
            background: `radial-gradient(120% 90% at 50% 12%, #2c4a68 0%, ${NAVY} 55%, #18293a 100%)`,
          }}
          dir="ltr"
        >
          {/* Notch */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 z-10 bg-[#1a1a1a]"
            style={{ width: 126, height: 34, borderRadius: "0 0 20px 20px" }}
          />

          {showStatusBar && <StatusBar time={statusBarTime} />}

          {/* Centered brand block */}
          <div
            className="flex flex-1 flex-col items-center justify-center px-8 text-center"
            dir={rtl ? "rtl" : "ltr"}
          >
            <div
              data-testid="intro-logo"
              className="grid place-items-center rounded-full bg-white"
              style={{
                width: 150,
                height: 150,
                boxShadow: `0 0 0 6px rgba(140,198,63,0.18), 0 18px 40px rgba(0,0,0,0.35)`,
                ...rise(0),
              }}
            >
              <img
                src={logoUrl}
                alt={brandName}
                width={132}
                height={132}
                className="object-contain"
              />
            </div>

            <div
              className="mt-7 flex items-baseline text-[34px] font-bold tracking-tight text-white"
              style={rise(180)}
            >
              <Wordmark brandName={brandName} />
            </div>

            <div
              className="mt-2 h-1 rounded-full"
              style={{ width: 54, background: GREEN, ...rise(180) }}
            />

            <div
              data-testid="intro-tagline"
              className="mt-6 text-[22px] font-semibold leading-snug text-white"
              dir="rtl"
              style={rise(340)}
            >
              {tagline}
            </div>

            {subline && (
              <div
                className="mt-3 text-[15px] font-medium leading-relaxed text-[#cdd9e6]"
                dir="rtl"
                style={rise(500)}
              >
                {subline}
              </div>
            )}
          </div>

          {/* home indicator */}
          <div className="flex items-center justify-center pb-2 pt-1">
            <div className="h-[5px] w-32 rounded-full bg-white opacity-30" />
          </div>
        </div>
      </div>
    </div>
  );
}
