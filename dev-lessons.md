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
