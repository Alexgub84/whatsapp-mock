# WhatsApp mock

A small **Vite + React + TypeScript** app that renders an **iPhone-style WhatsApp chat** for scripted playback: typing indicators, message animations, scroll behavior, and read receipts. It is meant for **screen-recorded demos** (for example QuickTime) rather than real messaging.

The main UI lives in [`src/WhatsAppChat.tsx`](src/WhatsAppChat.tsx). Behavior and props are documented in detail in [`whatsapp-chat-component-spec.md`](whatsapp-chat-component-spec.md).

## Requirements

- Node.js 18+ (or current LTS)

## Setup

```bash
npm install
```

## Scripts

| Command        | Description                                      |
| -------------- | ------------------------------------------------ |
| `npm run dev`  | Dev server (default: http://localhost:5173)      |
| `npm run build`| Typecheck and production build to `dist/`        |
| `npm run preview` | Serve the production build locally            |
| `npm run test:e2e` | Playwright tests (starts dev server if needed) |

## Scenarios

Conversation content is loaded from JSON under **`public/scenarios/<id>/scenario.json`**.

Add a scenario by creating a folder: `public/scenarios/<your-id>/scenario.json`. Optional assets (for example avatars) sit in that same folder; `header.avatar` is resolved relative to **`/scenarios/<id>/`**.

The top bar reads folder ids from **`public/scenarios/registry.json`** (`routes` array). When you add a new scenario folder, append its id there so a button appears.

Included examples:

- **`default`** — Hebrew / RTL Pilates studio flow (uses `avatar.jpeg` beside `scenario.json` if present).
- **`demo-en`** — Short English / LTR sample with no avatar.
- **`kettlbel`** — Hebrew / RTL Adrenaline studio flow (uses `avatar.png` beside `scenario.json` if present).

**How to pick which scenario loads**

1. **Query string (highest priority):** `http://localhost:5173/?scenario=demo-en` loads `public/scenarios/demo-en/scenario.json`.
2. **Env default:** If the URL has no `scenario`, the app uses `VITE_SCENARIO`, then falls back to `default`. Copy [`.env.example`](.env.example) to `.env` or `.env.local` and set `VITE_SCENARIO=<your-id>`.
3. **Production build:** `VITE_SCENARIO` is baked in at build time (`npm run build`). For runtime switching without rebuilding, rely on **`?scenario=...`** instead.

See [`src/scenario.ts`](src/scenario.ts) for the JSON shape and types.

## Embedding the component

You can import `WhatsAppChat` directly and pass `header`, `messages`, and optional props (`direction`, `autoplay`, `showControls`, and others) as described in the spec file—no JSON layer required.

## Stack

- React 18, Vite 6, TypeScript  
- Tailwind CSS 4 (`@tailwindcss/vite`)  
- Icons: `lucide-react`  
- E2E: Playwright  

## E2E tests

[`e2e/whatsapp.spec.ts`](e2e/whatsapp.spec.ts) exercises the default scenario at `/`. If you change `public/scenarios/default/scenario.json`, update the test expectations so they stay aligned.
