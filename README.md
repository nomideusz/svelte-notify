# @nomideusz/svelte-notify

[![npm](https://badgen.net/npm/v/@nomideusz/svelte-notify)](https://www.npmjs.com/package/@nomideusz/svelte-notify) [![license](https://badgen.net/badge/license/MIT/blue)](https://github.com/nomideusz/svelte-notify/blob/main/LICENSE)

Transactional email templates for booking products — confirmation with QR ticket, new-booking provider notification, cancellation with refund copy. Localized (en/pl/uk), brandable, and overridable per call so every app keeps its own voice.

Pairs with [@nomideusz/svelte-scheduler](https://www.npmjs.com/package/@nomideusz/svelte-scheduler) and [@nomideusz/svelte-payments](https://www.npmjs.com/package/@nomideusz/svelte-payments); QR codes via [@nomideusz/svelte-qr](https://www.npmjs.com/package/@nomideusz/svelte-qr).

## Installation

```bash
npm install @nomideusz/svelte-notify
```

## Usage

Bind your app's identity once, then call templates with only what varies:

```ts
import { createNotifier } from '@nomideusz/svelte-notify';

export const notify = createNotifier({
  brand: 'szkolyjogi.pl',
  language: 'pl',                              // default; per-recipient wins
  theme: { accent: '#1a7f4b', radius: '6px' },
  overrides: (lang) => VOICE[lang],            // house voice, per language
});

const { subject, html } = notify.bookingConfirmation({ ...booking });
```

`notify.actionLink` covers the link-and-a-button emails every app needs on day
one — magic-link sign-in, password reset, address verification, team invite:

```ts
const { subject, html } = notify.actionLink({
  subject: 'Twój link do logowania — szkolyjogi.pl',
  headingHtml: 'Zaloguj się',
  bodyHtml: '<p style="margin:0;">Link jest jednorazowy i wygasa po 15 minutach.</p>',
  cta: { label: 'Zaloguj się', url },
  footnotesHtml: ['Jeśli to nie Ty prosiłeś/aś o ten link, zignoruj tę wiadomość.'],
});
```

Fields suffixed `Html` are trusted and emitted as-is — escape untrusted values
with `escapeHtml` first. `cta.label`, `cta.url` and `brand` are escaped for you.

Templates are pure functions: data in, `{ subject, html }` out. Send with any
SMTP transport. Calling them directly (without a notifier) still works — pass
`brand` / `language` / `theme` per call.

```ts
import { bookingConfirmationTemplate, providerNotificationTemplate, cancellationTemplate } from '@nomideusz/svelte-notify';

const { subject, html } = bookingConfirmationTemplate({
  guestName: 'Anna',
  guestEmail: 'anna@example.com',
  serviceName: 'Morning Vinyasa — Studio X',
  slotStartTime: new Date('2026-08-01T18:00:00'),
  participants: 2,
  totalAmount: 9000,            // integer cents
  currency: 'PLN',
  bookingReference: 'YG-AB12CD34',
  language: 'pl',               // 'en' | 'pl' | 'uk' — unknown → English
  brand: 'szkolyjogi.pl',       // footer identity; omit for none
  verifyUrl: 'https://example.com/verify/YG-AB12CD34',
  qrImageUrl: 'https://example.com/api/qr/YG-AB12CD34', // hosted PNG beats data: URIs in Gmail
});
```

### Language

Resolved **per call** from `data.language` — no global locale, safe under concurrent server rendering. Interpolation reuses `@nomideusz/svelte-i18n`'s pure `interpolate` (deliberately not its reactive store).

### Escaping

Templates are trusted, params are not. Built-in copy and your `overrides` may
carry markup (`<strong>{service}</strong>`); the values substituted into them —
guest names, phones, service names — are HTML-escaped, because they typically
come from a public booking form and `providerNotificationTemplate` delivers them
to someone else's inbox.

Subjects are a plain-text context and are deliberately **not** escaped — an
escaped subject shows a literal `&amp;` in the inbox list.

Composing your own transactional emails alongside these? Use the same helper
rather than declaring a local `esc()`:

```ts
import { escapeHtml } from '@nomideusz/svelte-notify';

const html = `<p>Hi ${escapeHtml(user.name)}</p>`;
```

### Your voice

Any message key can be replaced per call:

```ts
bookingConfirmationTemplate({
  ...data,
  overrides: { b_see_you: 'Do zobaczenia na macie!' },
});
```

All keys and built-in copy live in `NOTIFY_MESSAGES` (exported).

### Templates

- `bookingConfirmationTemplate` — guest confirmation; inlines a QR (hosted PNG preferred, SVG data-URI fallback) when `verifyUrl`/`qrImageUrl` is set
- `providerNotificationTemplate` — heads-up to the instructor/guide/stylist with guest contact details
- `cancellationTemplate` — guest- vs organizer-cancelled copy, refund/no-refund variants
- `reminderTemplate` — pre-arrival nudge with the ticket link
- `scheduleChangedTemplate` — booking moved: old time, new time, free cancellation
- `actionLinkTemplate` — link-and-a-button (sign-in, reset, verify, invite)

### Plain text

Every template returns `{ subject, html, text }`. Send `text` as the
`text/plain` alternative — not instead of `html`. HTML-only mail costs
deliverability, and the text part is built from the layout's own parts rather
than by stripping tags off the finished document, so links survive as URLs.

```ts
const { subject, html, text } = notify.bookingConfirmation(data);
await transporter.sendMail({ to, subject, html, text });
```

### Time zones

Times render in the server's zone unless you pin one. Set `timeZone` on the
notifier (`'Europe/Warsaw'`) so the same booking doesn't read differently
depending on where the process happens to run.

## License

MIT
