# Scenario Authoring Guide — Multi-Screen Demo Recordings

For designers building screen-recorded demo videos. A **scenario** is a single
JSON file (plus a registry line) that drives the whole montage. **No code
changes are needed for a new recording** — only for a new kind of screen.

- Scenario data: `public/scenarios/<id>/scenario.json`
- Register it: add `"<id>"` to `public/scenarios/registry.json` → `routes`
- Preview: `npm run dev`, then pick it in the top `Scenario` dropdown
  (deep link: `?scenario=<id>`)

---

## The montage (what plays, in order)

A scenario that includes a `calendar` block renders the **RecordingStudio**, a
3D phone that flips between screens. Each block is optional; include only the
ones you need. Order is fixed:

0. **Intro title card** — a branded opening frame (logo + name + a Hebrew
   leading line) that fades into the chat. Needs an `intro` block.
1. **WhatsApp chat** — `messages` autoplay (typing dots for incoming, read
   receipts for outgoing). Always present.
2. **Flip → Google Calendar** — after the chat finishes, the phone flips and the
   `calendar.newEvent` pops in with a glow. Needs a `calendar` block.
3. **Flip back → reminder** — the phone flips back to the chat and plays the
   `reminder` message(s) on top of the conversation. Needs a `reminder` block.
4. **Flip → staff roster** — the phone flips to a shift board and assigns the
   team one name at a time. Needs a `staff` block.

If you omit `reminder` but keep `staff`, it goes calendar → staff directly.
The chat does not start playing until the intro has faded — playback is on cue.

**Chapter captions.** Any scene can open with a branded **caption card** — the
same design as the intro, showing a one-line Hebrew label for what's coming
("מענה ללקוח", "קביעת התור ושיבוץ ביומן", …). The caption covers the phone, holds
a beat, then fades to reveal the scene (whose playback/pop-in waits until the
caption is gone). Add them with a `captions` block (see below).

### How the flips are driven (important)

Flips are **event-driven**, not on blind timers. The studio runs the scenes as
an ordered sequence (`chat → calendar → reminder → staff`); each scene plays its
own content and signals when it has **finished** — the chat/reminder when the
last bubble is revealed, the calendar when the new event has popped in, the
roster when the last worker is assigned. Only then does the studio wait a short
**read-hold** and flip to the next scene. So a flip can never happen before its
scene's content is done (e.g. the calendar flip waits for the booking
confirmation message, no matter how long the chat runs).

The delay knobs below are that read-hold **after** a scene finishes — not a race
against the content.

| Field | Default | Hold applied after… |
|---|---|---|
| `introDurationMs` | 3200 | the intro title card holds, then fades into the chat |
| `captionDurationMs` | 2400 | each chapter caption holds, then reveals its scene |
| `autoFlipDelayMs` (studio prop) | 4400 | the chat's last message is shown → flip to calendar |
| `reminderDelayMs` | 3000 | the calendar's new event has popped in → flip back to reminder |
| `staffDelayMs` | 3000 | the reminder message is shown → flip to the staff roster |
| `staff.staggerMs` | 750 | gap between each worker being assigned |

(The intro is a static title card with no content event, so its duration is a
plain hold — that's expected for a title card.)

Each flip animation is ~0.7s; pop-ins wait for it to finish before starting.

---

## Message copy rules (keep recordings clean)

- **No emojis.** Anywhere.
- Break any list (time slots, booking details, options) **one item per line**
  with `\n`; separate blocks with a blank line (`\n\n`).
- **Never quote hard prices** unless the demo is specifically about pricing.
- **URLs render as blue links automatically** — just paste the full
  `https://…` URL into the message `text`. No markup needed.

---

## Making a message read as a different day

Use a **date-separator chip** so a later message (e.g. a next-morning reminder)
feels like a new day, exactly like real WhatsApp.

```json
{
  "id": "r1",
  "sender": "outgoing",
  "text": "בוקר טוב דוד, תזכורת לתור שלך מחר:\n\n…\nhttps://pay.example.co.il/abc",
  "timestamp": "08:00",
  "daySeparator": "היום",
  "status": "delivered",
  "delayBeforeMs": 1100
}
```

- `daySeparator` — the chip text shown centered above this message
  (`"היום"`, `"אתמול"`, `"יום שלישי"`, a date — your call).
- Set `timestamp` to the send time (e.g. `"08:00"` morning, `"20:00"` evening).
  With `syncStatusBarFromMessages: true`, the phone clock follows it.
- Word the copy for the gap: a reminder sent the morning before says **מחר**
  (tomorrow); a same-day reminder says **היום**.

---

## Block reference

### `intro`

The branded opening title card. Add it to any montage scenario.

```json
"introDurationMs": 3200,
"intro": {
  "logoUrl": "/brand/handinhand-logo.png",
  "brandName": "handinhand",
  "tagline": "עסק שמתנהל חכם מרוויח יותר",
  "subline": "סוכן AI שמנהל לכם את היומן, התורים והתשלומים — בוואטסאפ"
}
```

- `logoUrl` defaults to the bundled brand mark (`public/brand/handinhand-logo.png`).
  To swap the logo, drop a new file in `public/brand/` and point `logoUrl` at it.
- `tagline` is the big Hebrew leading line; `subline` is an optional smaller line.
- Same `intro` block works in every montage scenario — reuse it verbatim for a
  consistent open across all videos.

### `captions`

A branded chapter card before each scene, keyed by scene name. Reuses the
intro's logo/brand; you only supply the Hebrew label.

```json
"captionDurationMs": 2400,
"captions": {
  "chat": "מענה ללקוח בוואטסאפ",
  "calendar": "קביעת התור ושיבוץ ביומן",
  "reminder": "תזכורת יום לפני התור",
  "staff": "סידור עבודה לצוות"
}
```

- Keys are optional — include only the scenes you want a caption for.
- The label shows on the same card as the intro (logo + brand + this line).
- The scene behind the caption stays frozen until the caption fades, so the
  reveal (calendar pop-in, staff assignment, chat playback) starts on cue.

### `calendar`

```json
"calendar": {
  "monthLabel": "יוני 2026",
  "dayLabel": "יום רביעי, 18 ביוני",
  "nowTime": "13:50",
  "dayStartHour": 8,
  "dayEndHour": 21,
  "newBadge": "חדש",
  "events": [
    { "time": "09:00", "durationMin": 30, "title": "תספורת", "subtitle": "יוסי ל.", "color": "blue" }
  ],
  "newEvent": {
    "time": "14:30", "durationMin": 45,
    "title": "תספורת + עיצוב זקן",
    "subtitle": "דוד כהן · 052-1234567", "color": "green"
  }
}
```

`events` are pre-seeded (static). `newEvent` is the one that animates in.
Colors: `blue` `purple` `orange` `teal` `pink` `green`.

### `reminder`

An array of `ScenarioMessage` (same shape as `messages`). Plays after the
calendar, on top of the existing conversation. This is where `daySeparator` and
the payment link usually live.

### `staff`

```json
"staff": {
  "title": "סידור עבודה — מספרת קינגס",
  "dayLabel": "יום רביעי, 18 ביוני",
  "staggerMs": 750,
  "shifts": [
    { "label": "בוקר", "time": "08:00–13:00", "station": "עמדה 1", "assignee": "יוסי לוי", "color": "blue" }
  ]
}
```

- One row per shift. Each `assignee` (Hebrew name) pops into its row in order,
  with an avatar (initials) and a green check. The header shows an `n/n`
  progress counter.
- `station` is optional sub-label (e.g. "דלפק", "עמדה 2").
- Colors: same palette as the calendar.
- Keep it to ~4–6 shifts so the assignment reads in ~5 seconds.

---

## Recording a scenario to video

`npm run record <scenarioId>` produces `recordings/<scenarioId>.mp4` — the full
montage, cropped to just the iPhone frame (no playground chrome). Needs a server
running and `ffmpeg` on PATH.

```bash
npm run dev                 # in one terminal (serves :5173)
npm run record barber-shop  # in another → recordings/barber-shop.mp4
```

How it works: Playwright opens the scenario, hides the nav/controls, zooms the
phone up for resolution, plays the whole montage (it waits for the staff roster
to reach n/n, or `--seconds N` for scenarios without a roster), then ffmpeg crops
the page video to the flip-stage bounds and encodes H.264.

Options: `--url <baseUrl>` (default `http://localhost:5173`), `--seconds N`
(fallback duration / max wait, default 90), `--zoom Z` (default 1.7 → ~586px-wide
phone). `recordings/` is gitignored. Use `vite preview` instead of `dev` for a
production-accurate capture.

## New kinds of screens (needs code)

The flip studio currently knows three back-screens: calendar, reminder (a chat
re-run), and staff roster. A genuinely new screen (e.g. an inventory board) is a
new React component in `src/`, wired into `RecordingStudio` as another phase,
plus a matching block in `scenario.ts`. Mirror `StaffRoster.tsx`: same phone
frame, a `data-testid` for the e2e suite, and an `animateIn` prop the studio
controls. Add an e2e assertion to `e2e/whatsapp.spec.ts`.
