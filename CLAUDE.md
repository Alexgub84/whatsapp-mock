# whatsapp-mock — Project Guide

`@alexgub84/whatsapp-chat-mock` — an iPhone-style **WhatsApp chat UI** for React
with scripted playback, for **screen-recorded demo videos** and marketing mockups.
Vite + React 18 + Tailwind v4. Published to **GitHub Packages**
(`@alexgub84:registry=https://npm.pkg.github.com`, auth via `GITHUB_TOKEN`).

## Layout

- `src/WhatsAppChat.tsx` — the chat component (phone frame, status bar, header,
  bubbles, typing, read receipts, autoplay). Honors `\n` in message text.
- `src/GoogleCalendar.tsx` — phone-frame Google-Calendar day view (RTL), with a
  new-event pop-in + radiating glow highlight.
- `src/RecordingStudio.tsx` — plays the chat, then **flips** the phone screen to
  the calendar (used for "booking lands on calendar" demos).
- `src/scenario.ts` — scenario types + runtime loaders. `src/index.ts` — library exports.
- `src/App.tsx` — dev playground: scenario `<select>`, honors `?scenario=<id>` deep link.
- Scenarios = data: `public/scenarios/<id>/scenario.json` + `public/scenarios/registry.json`.
  A scenario with a `calendar` block renders the RecordingStudio (chat → flip).

## Scripts

- `npm run dev` — playground at `http://localhost:5173` (no strictPort).
- `npm run build` — `tsc -b && vite build`. `npm run build:lib` — library bundle.
- `npm test` — Playwright e2e (builds, then `vite preview` on `:4173`).

## Conventions

- **Add a recording = one file**: `public/scenarios/<id>/scenario.json` + a line
  in `registry.json`. No component changes for a new scenario. Full authoring
  recipe (chat → calendar → reminder → staff roster, day separators, blue links,
  timing knobs) is in `docs/scenario-authoring.md`.
- **Message copy: NO emojis.** Break any list (time slots, options, booking
  details) **one item per line** (`\n`); separate blocks with blank lines (`\n\n`).
- **No em-dashes (`—`) in any user-facing copy** (messages, intro, captions,
  titles) — they read as AI-written. Use a comma, colon, or period instead. Keep
  the en-dash (`–`) for time ranges like `08:00–13:00`.
- e2e is DOM-count based; serve via `vite preview` (not dev) with `reuseExistingServer: false`.
- The chat→calendar flip back-face is always in the DOM (rotated away) — when
  testing/screenshotting the flip, wait for the actual flip transform, not just
  the calendar element existing.

## Related

The WhatsApp **bot** that routes these business demos lives in the separate
`whatsapp-demo-platform` repo. This repo is the **UI / recording** side only.
