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

- **Default scenario:** `public/scenarios/default/scenario.json` is used when no other source is set.
- **Query string:** `http://localhost:5173/?scenario=default` loads `public/scenarios/default/scenario.json`. Replace `default` with another folder name when you add scenarios.
- **Build-time default:** Set `VITE_SCENARIO=myScenario` so the app defaults to that id when the URL has no `scenario` parameter.

The loader resolves `header.avatar` to **`/scenarios/<id>/<filename>`** (for example `avatar.jpeg` next to `scenario.json`). See [`src/scenario.ts`](src/scenario.ts) for the JSON shape and types.

## Embedding the component

You can import `WhatsAppChat` directly and pass `header`, `messages`, and optional props (`direction`, `autoplay`, `showControls`, and others) as described in the spec file—no JSON layer required.

## Stack

- React 18, Vite 6, TypeScript  
- Tailwind CSS 4 (`@tailwindcss/vite`)  
- Icons: `lucide-react`  
- E2E: Playwright  

## E2E tests

[`e2e/whatsapp.spec.ts`](e2e/whatsapp.spec.ts) exercises the default scenario at `/`. If you change `public/scenarios/default/scenario.json`, update the test expectations so they stay aligned.
