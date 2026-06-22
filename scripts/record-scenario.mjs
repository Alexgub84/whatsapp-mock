// Record a scenario's montage as an MP4 cropped to just the iPhone frame.
//
// Usage:
//   node scripts/record-scenario.mjs [scenarioId] [--url <baseUrl>] [--seconds N] [--zoom Z]
//
// Needs a running server (npm run dev, or vite preview) and ffmpeg on PATH.
// Output: recordings/<scenarioId>.mp4
//
// It plays the scenario, waits for the staff roster to finish (or `--seconds`
// if there is no roster), then crops the page video to the flip-stage bounds.

import { chromium } from "@playwright/test";
import { spawnSync } from "node:child_process";
import { mkdirSync, rmSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const flag = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : def;
};
const scenario = args.find((a) => !a.startsWith("--")) ?? "barber-shop";
const baseUrl = flag("url", "http://localhost:5173");
const maxSeconds = Number(flag("seconds", "90"));
const zoom = Number(flag("zoom", "1.7"));
// How long to hold the closing CTA card on screen (it never auto-advances).
const outroHoldSec = Number(flag("outro-hold", "5"));

const W = 760;
const H = 1500;
const TMP = "/tmp/rec-scenario";
const OUT_DIR = "recordings";

function ff(binArgs) {
  const r = spawnSync("ffmpeg", binArgs, { stdio: "inherit" });
  if (r.status !== 0) throw new Error("ffmpeg failed");
}

const run = async () => {
  if (spawnSync("ffmpeg", ["-version"]).status !== 0) {
    throw new Error("ffmpeg not found on PATH — install it (brew install ffmpeg)");
  }
  rmSync(TMP, { recursive: true, force: true });
  mkdirSync(TMP, { recursive: true });
  mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: W, height: H },
    recordVideo: { dir: TMP, size: { width: W, height: H } },
  });

  // Hide the playground chrome and zoom the phone up before first paint.
  await ctx.addInitScript((z) => {
    const apply = () => {
      const s = document.createElement("style");
      s.textContent =
        "nav{display:none!important}" +
        "[data-testid=studio-restart],[data-testid=studio-flip]{display:none!important}" +
        `html{zoom:${z}}`;
      document.head.appendChild(s);
    };
    if (document.head) apply();
    else document.addEventListener("DOMContentLoaded", apply);
  }, zoom);

  const page = await ctx.newPage();
  // Video recording starts ~here (page creation). Everything before the app
  // mounts is a blank white loading frame — measure that lead so we can trim it.
  const recStartMs = Date.now();
  console.log(`▶ recording "${scenario}" from ${baseUrl}`);
  await page.goto(`${baseUrl}/?scenario=${scenario}`);
  const stage = page
    .locator('[data-testid="recording-studio"] [style*="perspective"]')
    .first();
  await stage.waitFor({ timeout: 15_000 });
  await stage.scrollIntoViewIfNeeded();
  // Lead-in to drop: load time until the studio (intro logo card) is on screen,
  // plus a small margin so the trimmed video opens cleanly on the logo, never
  // on a half-faded white frame.
  const leadInSec = Math.max(0, (Date.now() - recStartMs) / 1000 + 0.15);

  // Prefer an explicit end signal (staff roster fully assigned); fall back to a
  // fixed duration for scenarios without one.
  //
  // Gotcha: the roster pre-renders its FINISHED `n/n` state while it sits hidden
  // behind the chapter caption (animateIn=false → assignedCount=shifts.length).
  // Waiting for `n/n` alone matches that transient hidden value and stops the
  // recording on the staff caption card, cutting the whole roster scene. So wait
  // for the caption to clear and the real animation to reset to `0/n` FIRST, then
  // for it to count back up to `n/n`.
  try {
    const progress = page.getByTestId("staff-progress");
    await progress.getByText(/^0\/\d+$/).waitFor({ timeout: maxSeconds * 1000 });
    await progress.getByText(/^(\d+)\/\1$/).waitFor({ timeout: maxSeconds * 1000 });
    await page.waitForTimeout(2000);
  } catch {
    await page.waitForTimeout(maxSeconds * 1000);
  }

  // If the montage ends with a closing CTA card, wait for it to come up and hold
  // it on screen (the outro is terminal — it never advances, so the recorder
  // decides how long it shows). Otherwise stop right after the last scene.
  try {
    await page
      .locator('[data-testid="recording-studio"][data-scene="outro"]')
      .waitFor({ timeout: 12_000 });
    await page.waitForTimeout(outroHoldSec * 1000);
  } catch {
    /* no outro scene — the prior hold already covered the final scene */
  }

  const box = await stage.boundingBox();
  const pad = 22;
  const x = Math.max(0, Math.floor((box.x - pad) / 2) * 2);
  const y = Math.max(0, Math.floor((box.y - pad) / 2) * 2);
  const w = Math.min(W - x, Math.floor((box.width + pad * 2) / 2) * 2);
  const h = Math.min(H - y, Math.floor((box.height + pad * 2) / 2) * 2);

  const videoPath = await page.video().path();
  await ctx.close();
  await browser.close();

  const out = join(OUT_DIR, `${scenario}.mp4`);
  console.log(
    `✂ cropping ${w}x${h}+${x}+${y}, trim ${leadInSec.toFixed(2)}s lead → ${out}`,
  );
  ff([
    "-y",
    "-i",
    videoPath,
    // Output seek (after -i) is frame-accurate: drops the white loading lead so
    // the montage opens on the intro logo card.
    "-ss",
    leadInSec.toFixed(3),
    "-vf",
    `crop=${w}:${h}:${x}:${y},format=yuv420p`,
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "20",
    "-movflags",
    "+faststart",
    out,
  ]);

  // pick the produced webm just to confirm it existed
  if (existsSync(TMP)) {
    const left = readdirSync(TMP).filter((f) => f.endsWith(".webm"));
    if (left.length) rmSync(TMP, { recursive: true, force: true });
  }
  console.log(`✓ done: ${out}`);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
