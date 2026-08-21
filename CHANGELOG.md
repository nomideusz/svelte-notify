# Changelog

## 0.7.3

### Patch Changes

- Updated dependencies
  - @nomideusz/svelte-i18n@1.0.0

## 0.7.2

### Patch Changes

- Updated dependencies [e0ef585]
  - @nomideusz/svelte-i18n@0.6.0

## 0.7.1

### Patch Changes

- Updated dependencies [6bd4ac9]
  - @nomideusz/svelte-qr@1.0.0

## 0.7.0 — 2026-08-18

### Added
- Per-message sender overrides on `SendInput`: `from`, `fromName` and
  `envelopeFrom`. For a sender the authenticated account owns but the mailer
  isn't bound to — e.g. a sub-address (`wiadomosci+<id>@…`) as the visible
  `From` so replies route back to one polled inbox, with `envelopeFrom` as the
  bare address because many servers refuse a sub-address as MAIL FROM.
  Omitting all three keeps existing callers byte-identical.

## 0.6.1 — 2026-08-17

### Changed
- Depends on `@nomideusz/svelte-i18n` ^0.5.0; `@types/nodemailer` declared as an optional peer so `./transport` types resolve for consumers.

### Added
- `BookingNotificationData.slotEndTime?: Date` — when the booked slot ends on
  a different calendar day than it starts (a workshop, a retreat, a multi-day
  tour), `bookingConfirmation` and `guideNotification` render the date as a
  "start – end" span. Same-day slots keep the single timestamp; omitting the
  field keeps the old behavior exactly. Zone-aware via the existing
  `timeZone`. New helper `formatDateSpan` exported from the i18n module.

## 0.6.0 — 2026-08-09

### Added
- **`@nomideusz/svelte-notify/transport`** — the SMTP transport both source
  apps had duplicated (nodemailer setup, transient-retry with 800/1600ms
  backoff, byte-identical `isTransient` classifiers), extracted behind
  `createMailer(config)`. `nodemailer` is an **optional peer dependency**: only
  this subpath imports it, the main entry stays pure and browser-safe.
  - `send()` **throws by default when unconfigured.** Callers that mark DB rows
    "sent" after `await send(...)` (reminders, waitlist) must not have an
    unconfigured deploy silently no-op. Pass `onUnconfigured` to opt into
    log-and-skip (`send()` then resolves `false`); the callback fires per
    message — an app wanting a once-only warning dedupes in its callback.
  - `canSend()` — `transporter.verify()` cached 60s, recipient-agnostic so an
    SMTP outage never becomes an address-existence oracle (moved from yoga).
  - `from` is sent as nodemailer's `{ name, address }`, ending the
    quoted-vs-unquoted from-name divergence between the two apps.
  - `isTransient` exported; its test suite moved in from yoga verbatim.
    (Provenance note: the retry/`isTransient` copies were duplicated across the
    two apps' *working trees* from the same-day email pass — yoga's last
    *deployed* transport was single-attempt, so vs production yoga gains
    retry-with-backoff here, up to +2.4s latency on awaited sends during
    transient SMTP blips.)
  - Env reading stays in the app: the config object is the seam, so each app
    keeps its own env names (`SMTP_PASS` vs `SMTP_PASSWORD`) untouched.
- Observability deltas vs the app-local copies (deliberate): every successful
  send logs (thebest previously logged only retry successes); pass `log:` to
  route through a structured logger instead of console.

## 0.5.0 — 2026-08-09

### Added
- **Every template returns a `text` part.** Built from the layout's own parts
  rather than by parsing the finished document, so the button becomes a
  labelled URL and the card chrome never leaks in. HTML-only mail from a
  low-reputation relay costs deliverability; this is the cheap half of fixing
  that. `htmlToText` and `renderText` are exported for app-composed messages.
- **`reminderTemplate`** — pre-arrival nudge. Copy is schedule-neutral
  ("upcoming") so an app reminding two hours out isn't lying; override `r_body`
  for a specific cadence. Prefers `verifyUrl` over `manageUrl` — a reminder is
  when someone wants the QR, not their booking history.
- **`scheduleChangedTemplate`** — "we moved your booking", with both times and
  free cancellation as a footnote rather than the primary action, because the
  booking survives the move.
- **`timeZone`** on the data shape and on `NotifierConfig`. Without it the same
  booking reads differently depending on where the process runs.
### Removed
- Date/money formatting moved to `@nomideusz/svelte-i18n` 0.4.0
  (`formatDateTime`, `formatMoney`, `intlLocale`) and is consumed from there.
  An app formatting a price on a booking page shouldn't import an email
  template library, and the `en → en-GB` regional policy now holds for pages
  and emails alike instead of being decided twice.

### Changed
- **Breaking:** `EmailTemplate` now requires `text`. Anything constructing one
  by hand needs the field; callers destructuring `{ subject, html }` are fine.
- `actionLinkTemplate`'s `cta` is now optional. Some transactional mail is a
  list of links with no single primary action, and forcing a button on it is a
  lie about the content.

## 0.4.0 — 2026-08-09

### Added
- **`createNotifier(config)`** — binds the per-app constants (brand, theme,
  default language, house voice) so call sites pass only what varies per
  message. `overrides` accepts a `(lang) => overrides` function, which is how an
  app keeps a per-language voice map without re-selecting it at every call.
  Per-call values still win, key by key, because language is per-recipient.
- **`renderLayout` + `actionLinkTemplate`** — the shared shell: full HTML
  document, centred card, table-based centring, inline styles. `actionLink`
  covers the "here is a link, go do the thing" email (magic link, password
  reset, verification, invite, recovery) that every app rewrites on day one —
  the two source apps had seven near-identical copies between them, three
  unescaped.
- **`Theme`** — accent colour and button radius, the only two things that
  actually differed between the source apps. Deliberately not a design system.

### Changed
- The three booking templates now render through `renderLayout`, so they emit a
  complete document instead of a bare `<h2>`/`<p>` fragment. **Sent mail will
  look different** — a card on a tinted page, rather than unstyled client
  defaults.
- `BookingNotificationData` gained an optional `theme`.

## 0.3.0 — 2026-08-09

### Fixed
- **Interpolated values are now HTML-escaped.** Templates rendered guest-supplied
  fields (`guestName`, `guestEmail`, `guestPhone`, `serviceName`,
  `bookingReference`) straight into the HTML body — `svelte-i18n`'s `interpolate`
  is a plain `String(value)` substitution and escapes nothing. The exposure was
  `providerNotificationTemplate`, which carries values typed into a public,
  unauthenticated booking form into the *provider's* inbox.

  Message templates stay trusted, so built-in copy and app `overrides` keep their
  deliberate `<strong>`; only the params substituted into them are escaped.
  Subjects are unescaped by design — a plain-text context where `&amp;` would
  render literally.

### Added
- `escapeHtml` is now exported, so apps composing their own transactional emails
  escape the same way these templates do instead of each declaring a local
  `esc()` helper.

## 0.2.2 — 2026-08-03

### Added
- Demo site at https://svelte-notify.vercel.app/ — live template previewer with
  language switching and QR toggle. `homepage` now points at it.

## 0.2.1 — 2026-08-03

### Changed
- `sideEffects: false` in package.json, so bundlers can tree-shake unused
  exports. Every module here is pure; without the declaration a consumer
  importing one helper had to ship the whole library.

### Added
- Standalone repo at github.com/nomideusz/svelte-notify with a Release & Publish
  workflow, so this package has a reproducible release path for the first time.

Backfilled 2026-08-02 from git history. Entries before that date are
reconstructed from commits, so they record what changed rather than a release
that was tagged at the time.

## 0.2.0 — 2026-07-30

### Changed
- **Breaking — templates are internationalized** (en/pl/uk) via `svelte-i18n`'s
  `interpolate`, with brand configuration and per-template overrides. Callers
  now pass a locale.

## 0.1.1 — 2026-07-07

### Fixed
- Ship TypeScript-free `.svelte` files (vitePreprocess script pass), so
  consumers without a TS setup can use the components.

## 0.1.0 — 2026-03-06

### Added
- Email template functions with tests: booking confirmation, cancellation,
  reminder. QR codes embed via `@nomideusz/svelte-qr`.
