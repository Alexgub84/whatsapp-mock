# Dev lessons

## 2026-06-18 (recording studio: chat → calendar flip)

**Context:** Needed demo videos showing a WhatsApp booking conversation, then the
same phone screen turning into a Google Calendar where the new appointment
appears — reusable across scenarios.

**Decision:** Kept it data-driven on top of the existing scenario system. Added an
optional `calendar` block to `ScenarioFile`; when present, the playground renders
`RecordingStudio` (a 3D `rotateY` flip between `WhatsAppChat` and a new
`GoogleCalendar` view) instead of a bare chat. The only change inside the existing
component was an additive `onComplete` callback fired at the end of `play()`, used
to auto-flip when playback finishes.

**Lesson:** A new "mode" rode entirely on the JSON-scenario seam — no breaking
changes to `WhatsAppChat`, and a new recording is just a scenario file. The flip's
back face (`GoogleCalendar`) is always in the DOM (rotated away), so e2e/screenshot
logic must wait for the actual flip transform, not merely for the calendar element
to exist.

## 2026-05-08 (dev port)

**Problem:** `npm run dev` crashed with "Port 5173 is already in use" because Vite was configured with `strictPort: true`.

**Root cause:** `strictPort` tells Vite to fail instead of binding to the next free port.

**Solution:** Drop `strictPort` for the dev server so Vite retries on 5174, 5175, and so on (default behavior).

**Lesson:** Use strict ports only when the URL must be fixed (e.g. Playwright `webServer` + `url`); for day-to-day `vite` dev, prefer the default so multiple projects can run locally.

## 2026-05-08

**Problem:** Playwright e2e for the default scenario timed out waiting for 13 bubbles; mid-run navigation reset the UI to zero bubbles while the locator was polling.

**Root cause:** Running tests against `npm run dev` with `reuseExistingServer: true` could attach to whichever process already listened on `:5173` (wrong project or stale bundle). Separately, Vite dev HMR/full reload risk during multi-minute scripted playback resets React state while the assertion was still counting.

**Solution:** Serve the demo with `vite preview` on `:4173` from Playwright (`npm run build` then preview, `reuseExistingServer: false`, matching `strictPort` on preview). Dev uses `vite` on `5173` without `strictPort` so a busy port falls forward to the next free one.

**Lesson:** Prefer a production preview (or deterministic port + no reuse) for e2e that stress long SPA sessions; pairing `strictPort` with the Playwright `url` avoids silent wrong-server mismatches.

## 2026-06-18 (scenario message style)

**Decision:** Scenario message text uses **no emojis**, and any list (time slots,
options, booking details) is broken **one item per line** (`\n`), with blank
lines (`\n\n`) separating logical blocks.

**Why:** Cleaner, more professional/structured mockups; run-together lists read
poorly on the phone frame.

**Lesson:** Treat message `text` as structured copy — newlines do the layout.
Applies to new/edited scenarios (existing demos kept as-is unless revisited).

## 2026-06-18 (four-screen flip montage + reusable recipe)

**Context:** Barber-shop demo needed to grow from chat → calendar into a longer
montage: chat → calendar → flip back to a next-day reminder (payment link) →
flip to a staff/shift roster the owner fills in.

**[Win] Reuse the chat for the reminder, don't rebuild it.** Flipping "back to
WhatsApp" with a new message = re-mount `WhatsAppChat` with the combined
`[...messages, ...reminder]` and a new `playFromIndex` prop that shows earlier
bubbles instantly and animates only from that index. No second chat component,
no incremental-append plumbing into the existing one-shot `play()` loop.

**[Win] Third back-screen on the same 2-face flip card.** The flip stage only
has front/back faces. Rather than a 3-face rotation, the back face renders
`phase === "staff" ? <StaffRoster/> : <GoogleCalendar/>`, and `showBack` covers
both `calendar` and `staff`. Each new screen is one more phase + a conditional.

**[Decision] Different-day feel = a `daySeparator` chip on the message**, not a
real date model. WhatsApp shows a centered date pill; one optional string field
on `ScenarioMessage` plus a 08:00 timestamp makes a reminder read as a new day.
Rejected: per-message date objects / timezone logic — overkill for a mockup.

**[Win] URLs auto-linkify.** `renderTextWithLinks` splits message text on a URL
regex and wraps matches in a blue (`#027EB5`) `<a>`. Designers just paste the
URL; no markup. Caveat: test the matched part with a non-global `/^https?:/`,
not `URL_RE.test()` — a `/g` regex's `lastIndex` is stateful and flaps.

**Lesson:** The authoring recipe (block schema, timing knobs, copy rules, day
separator, staff roster) lives in `docs/scenario-authoring.md` so other
designers reproduce the montage from data alone.

## 2026-06-18 (flip control — event-driven scene sequence)

**[Decision] Flips are driven by scene-completion events, not blind timers.**

**Context:** First cut chained the montage with scattered `setTimeout`s
(onComplete → flip; then fixed `reminderDelayMs`/`staffDelayMs` seconds). It
read as "flip happens on a guessed second count," which is fragile: a longer or
edited chat could flip mid-conversation, and the control flow was hard to follow.

**Decision:** `RecordingStudio` now holds an ordered `Scene[]`
(`chat → calendar → reminder → staff`, built from whichever blocks the scenario
provides) and a `sceneIdx`. Each scene emits a **done** signal — chat/reminder
via `WhatsAppChat.onComplete`, calendar via new `GoogleCalendar.onSettled`
(after the event pops in), roster via new `StaffRoster.onSettled` (after the
last assignment). On done, the studio waits a short **read-hold** then advances
`sceneIdx`. The flip transform is `scene === "calendar" || scene === "staff"`.
Rejected: keeping per-step blind timers anchored to earlier events.

**Why it's correct:** A flip cannot precede its scene's content finishing — the
calendar flip waits for the booking-confirmation bubble regardless of chat
length. The delay props became *holds after a scene completes*, not races.

**Gotcha:** the front face must stay mounted across flips — keyed
`chat-<run>` through chat+calendar, then `reminder-<run>` from the reminder
scene onward (with `playFromIndex` so earlier bubbles show instantly). Don't key
it on the live scene or it replays every time you flip back to it.

**Lesson:** For any multi-step flip/scene player, model it as an explicit
sequence + per-scene completion callbacks. Never advance the outer flow on a
timer that assumes how long an inner animation took.

## 2026-06-18 (branded intro title card)

**[Win] Intro is the first scene + a fade overlay, not another flip face.** The
flip card only has front/back; a title card fits better as an absolutely-
positioned layer over the stage that fades (`opacity` 1→0) as the studio
advances `intro → chat`. The chat front face is **gated** (`scene !== "intro"`)
so `WhatsAppChat` mounts — and autoplays — only when the intro is done; otherwise
the chat would silently play underneath the card and be seconds in by reveal.

**[Win] Brand assets pulled from the live site.** Logo + Hebrew tagline came
from handinhandai.com (`/handinhand-logo.png`, og:title
"עסק שמתנהל חכם מרוויח יותר"). Saved to `public/brand/`; `intro.logoUrl` is
overridable so a designer can drop a higher-res file later.

**Gotcha:** the overlay anchors to the stage, so the `perspective` stage div
needs `position: relative` — without it `inset:0` escapes to the page container
and the card mis-positions.

**Lesson:** A title card has no content-completion event, so a fixed
`introDurationMs` hold is correct here (unlike the chat/calendar/staff flips,
which are event-driven). Reuse the same `intro` block across every montage
scenario for a consistent open.

## 2026-06-18 (chapter caption cards between scenes)

**[Win] Captions are overlay states, not new scenes.** Each content scene can
open with a branded caption (same card as the intro, Hebrew label). Modeled as a
`captionActive` boolean that re-arms on every scene change, NOT as extra entries
in the scene array — so the existing scene sequence / completion-event flow is
untouched.

**Key trick — gate the scene behind the caption.** The caption covers the phone
while it's up, so: the front chat/reminder run is **not mounted** until the
caption clears (`mountFront`), and the calendar/staff **`animateIn` is ANDed with
`!captionActive`**. Result: playback, calendar pop-in, and staff assignment all
start the instant the caption fades — never behind it. The flip to a back-face
scene happens *behind* the caption, so the caption replaces the raw flip with a
clean chapter card.

**Gotcha:** `GoogleCalendar`/`StaffRoster` render their *finished* state when
`animateIn` is false (event already popped / 5-of-5 assigned). That briefly shows
behind the caption (hidden), then resets to animate on reveal — fine because the
caption covers it. Don't "fix" it by showing an empty state; it's invisible.

**Lesson:** To insert framing cards into an event-driven sequence without
breaking it, make them a covering overlay + a content gate, not new timeline
nodes. Labels live in a `captions` block in scenario.json for easy review/edit.

## 2026-06-18 (self-serve scenario → MP4 recorder)

**[Win] Record the montage headlessly, crop to the phone.** `npm run record
<id>` (scripts/record-scenario.mjs) uses Playwright `recordVideo` to capture the
page, then ffmpeg crops to the flip-stage bounding box → `recordings/<id>.mp4`.
No screen-capture app, no manual trimming.

**Tactics that mattered:**
- Playwright video resolution == `recordVideo.size` (CSS px), NOT deviceScale
  factor. To get a larger phone, set `html{zoom:1.7}` before first paint via
  `addInitScript` — the phone renders ~586px wide instead of ~320.
- `getBoundingClientRect`/`boundingBox()` already returns zoom-scaled coords, so
  the crop box maps 1:1 to video pixels. Pad ~22px for the bezel; clamp w/h to
  the viewport and round to even numbers (H.264 needs even dimensions).
- End detection is event-based: wait for staff-progress `n/n` (regex `^(\d+)/\1$`),
  fall back to `--seconds` for scenarios with no roster. Beats a blind sleep.
- Hide playground chrome (`nav`, studio Restart/Flip) via injected CSS so the
  crop is clean.

**Lesson:** For "record the running UI" tasks, Playwright recordVideo + ffmpeg
crop is the zero-dependency path. The gotcha is resolution — drive it with page
zoom, not DSF.

## 2026-06-22 (recorder cut the staff roster — hidden `n/n` false end-signal)

**[Fix] End-detection matched the roster's pre-rendered finished state.**

**Context:** `npm run record barber-shop` stopped on the staff *caption* card; the
whole roster scene was missing from the MP4 (video ended ~43.8s, real montage is
~52s). The recorder's end-signal waited for `staff-progress` text `n/n` (regex
`^(\d+)/\1$`).

**Cause:** `StaffRoster` renders its FINISHED state when `animateIn=false`
(`setAssignedCount(shifts.length)` → `5/5`) while it sits hidden behind the chapter
caption. The recorder matched that transient hidden `5/5`, waited its 1.5s hold, and
closed the context before the caption cleared and the roster animated.

**Decision:** In `scripts/record-scenario.mjs`, wait for the REAL animation: first
`^0/\d+$` (caption cleared → `animateIn=true` resets count to 0), THEN `^(\d+)/\1$`,
then a 2s hold. The leading `0/n` gate skips the hidden pre-render.

**Lesson:** When an element pre-renders its done-state behind a cover, a single
"done" wait is racy. Gate on the animation's start (reset-to-zero) before its
finish, or the recorder stops on the ghost completion.
