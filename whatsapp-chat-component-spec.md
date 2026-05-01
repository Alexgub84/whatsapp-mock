# WhatsApp Chat Imitation Component — Task Spec

## Goal

Build a single-file React component that imitates the iPhone WhatsApp chat screen. The component is used to **record demo videos via screen capture (QuickTime)** for marketing reels. It accepts a configurable header and a scripted array of messages, then plays them back one-by-one with realistic animations (typing indicators, message-in animations, scroll-to-bottom, read receipts).

The same component will be reused across many scenarios (different businesses, languages, conversations) by simply passing different props.

---

## Visual Reference

The component must visually match the iPhone WhatsApp chat screen:

- **iPhone status bar** (time, signal bars, 5G, battery) at the very top
- **WhatsApp chat header:** back arrow + optional unread count badge, circular avatar, contact name/number, subtitle line (e.g. "tap here to add to contacts" or "online"), video-call icon, voice-call icon
- **Message area** with WhatsApp's signature beige/cream doodle background pattern
- **Incoming messages:** white bubbles, left-aligned (right-aligned in RTL), timestamp in bottom-right corner of the bubble
- **Outgoing messages:** light-green bubbles (`#DCF8C6`), right-aligned (left-aligned in RTL), timestamp + read-receipt checkmarks in bottom-right corner of the bubble
- **Quoted reply bubbles:** vertical colored bar on the side + sender name + preview text above the actual message text
- **Emoji reactions:** small white bubble overlapping the bottom edge of a message
- **NO keyboard.** The bottom input bar (+ icon, text field, sticker, camera, mic) may render statically, but no keyboard pops up — this leaves maximum space for messages.

---

## Tech Constraints

- Single React component file (`.jsx` or `.tsx`)
- React 18+ with hooks (`useState`, `useEffect`, `useRef`)
- **Tailwind CSS only** — no separate CSS files, no styled-components
- Icons: `lucide-react`
- No external state management, no router, no fetch calls
- Default export, no required props (sensible defaults so it renders out of the box)

---

## Component API

```ts
type Message = {
  id: string;
  sender: 'incoming' | 'outgoing';
  text: string;
  timestamp: string;                          // e.g. "12:36"
  status?: 'sent' | 'delivered' | 'read';     // outgoing only
  replyTo?: {
    senderName: string;                       // shown above quoted text
    senderColor?: string;                     // hex for vertical bar (default red or blue)
    text: string;                             // quoted preview
  };
  reactions?: string[];                       // e.g. ['❤️', '👍']
  typingDurationMs?: number;                  // override; default ~1500ms scaled to text length
  delayBeforeMs?: number;                     // pause before this message appears; default 800ms
};

type WhatsAppChatProps = {
  header: {
    avatarUrl?: string;                       // defaults to placeholder
    name: string;
    subtitle?: string;                        // default "tap here to add to contacts"
    unreadCount?: number;                     // shows next to back arrow
  };
  messages: Message[];
  direction?: 'ltr' | 'rtl';                  // default 'ltr'
  showStatusBar?: boolean;                    // default true
  statusBarTime?: string;                     // default "15:27"
  showInputBar?: boolean;                     // default true (the bottom + / text / camera / mic bar)
  autoplay?: boolean;                         // default false (shows Play button)
  showControls?: boolean;                     // default true; set false during recording so Play/Reset don't appear
};
```

---

## Behavior

### Playback sequence

1. **Initial state:** header + empty doodle background visible. If `showControls` is true, a floating Play button appears (positioned outside the phone frame, not inside the chat — so it can be cropped from recordings).
2. **On Play**, iterate `messages` in order:
   - Wait `delayBeforeMs` (default 800ms)
   - If `sender === 'incoming'`: show typing indicator (3 animated dots in a white bubble at the appropriate side) for `typingDurationMs` (default ~1500ms, scale by text length: ~30ms per character, capped 800–3000ms)
   - Reveal the message bubble with a subtle scale + fade animation (~200ms)
   - Auto-scroll to bottom smoothly
   - If `reactions` present, animate them in ~300ms after the message lands (small pop-in)
3. After all messages: keep state. Reset button restarts from empty.

### Typing indicator

- Only shown for `incoming` messages
- White bubble with 3 grey dots, each animating opacity `0.3 → 1.0 → 0.3` in staggered sequence (~1.2s loop)
- Disappears immediately when the message bubble appears

### Read receipts (outgoing only)

- `sent`: single grey check (`#8696A0`)
- `delivered`: double grey check
- `read`: double blue check (`#34B7F1`)

### RTL mode

When `direction='rtl'`:
- Mirror entire layout: incoming bubbles align right, outgoing align left, header items reversed
- All text aligned right
- Hebrew / Arabic content renders correctly with proper font fallbacks

---

## Styling Details

### Colors
| Element | Color |
|---|---|
| Background (chat area) | `#EFE7DD` with WhatsApp doodle pattern overlay |
| Incoming bubble | `#FFFFFF` |
| Outgoing bubble | `#DCF8C6` |
| Bubble shadow | `0 1px 0.5px rgba(0,0,0,0.13)` |
| Timestamp text | `#667781`, 11px |
| Read receipt grey | `#8696A0` |
| Read receipt blue | `#34B7F1` |
| Reply bar (incoming) | `#1F7AEC` |
| Reply bar (outgoing) | `#E74C3C` |
| Header background | `#F6F6F6` |
| Header bottom border | `#E5E5E5`, 1px |
| Unread badge | WhatsApp green `#25D366` |

### Doodle background

Use a tiled SVG pattern of WhatsApp-style icons (hearts, stars, paperclips, smileys, etc.) at low opacity (~10–15%) over the beige base. Embed as inline SVG or base64 data URI — do not require external image files.

### Typography

- Font stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- Message text: 16px, line-height 1.3
- Header name: 17px, semi-bold
- Subtitle: 13px, `#667781`

### Layout

- Outer container: phone-shaped frame, max-width 420px, fixed aspect ratio matching iPhone (e.g. 9:19.5)
- Bubble max-width: 75% of chat area width
- Bubble border-radius: 12px (with one corner reduced to 4px on the "tail" side for first message in a sequence — matches WhatsApp)
- Bubble padding: 6px 10px
- Margin between bubbles from same sender: 2px
- Margin between bubbles from different senders: 8px

---

## Acceptance Criteria

The component is complete when:

1. It renders correctly with the example data below (RTL Hebrew cleaning-agency demo)
2. Play button triggers a sequential animation that, when screen-recorded, looks indistinguishable from a real WhatsApp screen recording
3. Both LTR (English) and RTL (Hebrew) render perfectly
4. `showControls={false}` removes Play/Reset buttons from the visual frame entirely
5. The component is one self-contained file with default props, ready to drop in and use
6. Looks pixel-clean at 1080p when screen-recorded

---

## Out of Scope (v1)

- Image / video / voice / document messages
- Group chats with multiple senders
- Real WhatsApp API integration
- Keyboard rendering
- Sound effects (notification ding, send sound) — may be added later
- Dark mode

---

## Example Usage

```jsx
<WhatsAppChat
  direction="rtl"
  showControls={false}
  header={{
    name: "ניקיון פלוס",
    subtitle: "מקוון",
    avatarUrl: "/cleaning-logo.png"
  }}
  messages={[
    {
      id: '1',
      sender: 'incoming',
      text: 'היי, אפשר לקבוע ניקיון לדירה השבוע?',
      timestamp: '23:14',
      delayBeforeMs: 500
    },
    {
      id: '2',
      sender: 'outgoing',
      text: 'בטח! כמה חדרים?',
      timestamp: '23:14',
      status: 'read'
    },
    {
      id: '3',
      sender: 'incoming',
      text: '4 חדרים, תל אביב',
      timestamp: '23:15'
    },
    {
      id: '4',
      sender: 'outgoing',
      text: 'מעולה. מתי נוח לך השבוע?',
      timestamp: '23:15',
      status: 'read'
    },
    {
      id: '5',
      sender: 'incoming',
      text: 'יום חמישי בבוקר אם אפשר 🙏',
      timestamp: '23:16',
      reactions: ['❤️']
    }
  ]}
/>
```
