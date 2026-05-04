# @alexgub84/whatsapp-chat-mock

An **iPhone-style WhatsApp chat UI** component for React with scripted playback: typing indicators, message animations, scroll behavior, and read receipts. Designed for **screen-recorded demos** and **marketing mockups**.

The main UI lives in [`src/WhatsAppChat.tsx`](src/WhatsAppChat.tsx). Full behavior and props are documented in [`whatsapp-chat-component-spec.md`](whatsapp-chat-component-spec.md).

## Installation

This package is published to GitHub Packages. Add an `.npmrc` to your project:

```
@alexgub84:registry=https://npm.pkg.github.com
```

Then install:

```bash
npm install @alexgub84/whatsapp-chat-mock
```

## Usage

```tsx
import { WhatsAppChat } from "@alexgub84/whatsapp-chat-mock";
import "@alexgub84/whatsapp-chat-mock/styles.css";

const messages = [
  { id: "1", sender: "incoming", text: "Hey, is the class still on?", timestamp: "10:30" },
  { id: "2", sender: "outgoing", text: "Yes! See you at 6pm", timestamp: "10:31", status: "read" },
];

export default function Page() {
  return (
    <WhatsAppChat
      header={{ name: "Jane", avatarUrl: "/avatar.png", subtitle: "online" }}
      messages={messages}
      autoplay={true}
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `header` | `{ name, avatarUrl?, subtitle?, unreadCount? }` | required | Contact info shown in the chat header |
| `messages` | `Message[]` | required | Array of messages to animate |
| `direction` | `"ltr" \| "rtl"` | `"ltr"` | Text/layout direction |
| `showStatusBar` | `boolean` | `true` | Show iPhone-style status bar |
| `statusBarTime` | `string` | `"15:27"` | Fixed time shown in status bar |
| `showInputBar` | `boolean` | `true` | Show the bottom input bar |
| `autoplay` | `boolean` | `false` | Auto-start message playback on mount |
| `showControls` | `boolean` | `true` | Show Play/Reset buttons outside the frame |
| `syncStatusBarFromMessages` | `boolean` | `true` | Sync status bar clock with message timestamps |
| `className` | `string` | — | Additional CSS class for the outer wrapper |

### Message shape

```ts
type Message = {
  id: string;
  sender: "incoming" | "outgoing";
  text: string;
  timestamp: string;
  status?: "sent" | "delivered" | "read";
  replyTo?: { senderName: string; senderColor?: string; text: string };
  reactions?: string[];
  typingDurationMs?: number;
  delayBeforeMs?: number;
};
```

## Publishing (maintainer)

```bash
# Build the library
npm run build:lib

# Authenticate with GitHub Packages (once)
npm login --registry=https://npm.pkg.github.com

# Publish
npm publish
```

## Local Development

### Requirements

- Node.js 18+ (or current LTS)

### Setup

```bash
npm install
```

### Scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Dev server (default: http://localhost:5173) |
| `npm run build` | Typecheck and production build (demo app) |
| `npm run build:lib` | Build the publishable library to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run test:e2e` | Playwright tests |

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
