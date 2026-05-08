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
      header={{ name: "Jane", profileImageUrl: "/avatar.png", subtitle: "online" }}
      messages={messages}
      autoplay={true}
    />
  );
}
```

## Sizing & scaling

The phone frame is always rendered at its native **390 × 844 px** resolution. Use the `scale` prop to resize it proportionally without any cropping or distortion.

The outer container automatically adjusts to `390 × scale` by `844 × scale`, so the component never bleeds outside its layout box — no manual width/height wrappers needed.

```tsx
// 80% of full size
<WhatsAppChat scale={0.8} header={...} messages={messages} />

// 60% — good for sidebars or narrow columns
<WhatsAppChat scale={0.6} header={...} messages={messages} />

// Full size (default)
<WhatsAppChat header={...} messages={messages} />
```

**Astro example**

```astro
---
import { WhatsAppChat } from "@alexgub84/whatsapp-chat-mock";
import "@alexgub84/whatsapp-chat-mock/styles.css";
import messages from "../data/messages.json";
---

<WhatsAppChat
  client:load
  scale={0.75}
  header={{ name: "Sarah", subtitle: "online" }}
  messages={messages}
  autoplay={true}
  showControls={false}
/>
```

> **`showControls={false}`** hides the Play/Reset buttons — recommended when embedding in a page where you want `autoplay` to run silently on scroll or mount.

## Demo wrapper

If you want the full-page grey demo look (e.g. a dedicated preview page), wrap the component with `WhatsAppDemo`:

```tsx
import { WhatsAppChat, WhatsAppDemo } from "@alexgub84/whatsapp-chat-mock";
import "@alexgub84/whatsapp-chat-mock/styles.css";

export default function PreviewPage() {
  return (
    <WhatsAppDemo>
      <WhatsAppChat
        scale={0.9}
        header={{ name: "Jane" }}
        messages={messages}
        showControls={true}
        autoplay={false}
      />
    </WhatsAppDemo>
  );
}
```

`WhatsAppDemo` provides a centered, grey-background full-screen layout. It has no effect on the phone frame itself.

## Props

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `header` | `{ name, profileImageUrl?, subtitle?, unreadCount? }` | required | Contact info shown in the chat header |
| `messages` | `Message[]` | required | Array of messages to animate |
| `scale` | `number` | `1` | Scale factor for the phone frame (e.g. `0.8` = 80%). Container auto-sizes to match. |
| `direction` | `"ltr" \| "rtl"` | `"ltr"` | Text/layout direction |
| `showStatusBar` | `boolean` | `true` | Show iPhone-style status bar |
| `statusBarTime` | `string` | `"15:27"` | Fixed time shown in status bar |
| `showInputBar` | `boolean` | `true` | Show the bottom input bar |
| `autoplay` | `boolean` | `false` | Auto-start message playback on mount |
| `showControls` | `boolean` | `true` | Show Play/Reset buttons above the frame |
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
  image?: {
    url: string;
    width?: number;
    height?: number;
    caption?: string;
  };
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
| `npm run preview` | Serve the production build locally (`http://localhost:4173` unless configured otherwise) |
| `npm run test:e2e` | Playwright tests (`npm run test` alias) |

## Scenarios

Conversation content is loaded from JSON under **`public/scenarios/<id>/scenario.json`**.

Add a scenario by creating a folder: `public/scenarios/<your-id>/scenario.json`. Optional assets (for example profile photos) sit in that same folder; `header.profile_image` is resolved relative to **`/scenarios/<id>/`** (see `resolveScenarioAssetUrl` in `src/scenario.ts` for absolute `http(s)://` and `/` URLs).

Optional root field **`description`**: ignored by the app; use it in JSON to document the scenario for authors.

**Image messages:** on any message, set optional **`image`**: `{ "url": "file.png", "caption": "optional" }`. Put the file in the same folder as `scenario.json`. Relative `url` values resolve to **`/scenarios/<id>/<url>`** (same rule as `header.profile_image`). URLs starting with `http://`, `https://`, or `/` are used as-is. Optional **`caption`** renders under the image; **`text`** renders below the caption when present. Use `text: ""` for an image-only bubble (caption and timestamp still show).

The top bar reads folder ids from **`public/scenarios/registry.json`** (`routes` array). When you add a new scenario folder, append its id there so a button appears.

Included examples:

- **`default`** — Hebrew / RTL Pilates studio flow (uses `profile_image` pointing at `avatar.jpeg` beside `scenario.json` if present).
- **`demo-en`** — Short English / LTR sample with no profile image.
- **`kettlbel`** — Hebrew / RTL Adrenaline studio flow (uses `avatar.png` via `profile_image` beside `scenario.json` if present).
- **`linoy-studio`** — Hebrew / RTL nail studio flow with design sample image (`profile_image.png`).
- **`image-test`** — Minimal LTR scenario covering image + caption playback (see `description` inside `scenario.json`).

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

[`e2e/whatsapp.spec.ts`](e2e/whatsapp.spec.ts) runs Playwright against a **production build** (`npm run build` + `vite preview` on port 4173) so long playback scenarios are stable. Default scenario playback is exercised at `/`. The **`image-test`** scenario validates image messages (`/?scenario=image-test`). If you change scenario JSON counts or copy, update the expectations accordingly.

`npm run test` runs the same Playwright suite as `npm run test:e2e`.
