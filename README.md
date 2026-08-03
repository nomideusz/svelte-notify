# @nomideusz/svelte-notify

[![npm](https://badgen.net/npm/v/@nomideusz/svelte-notify)](https://www.npmjs.com/package/@nomideusz/svelte-notify) [![license](https://badgen.net/badge/license/MIT/blue)](./LICENSE)

Transactional email templates for booking products — confirmation with QR ticket, new-booking provider notification, cancellation with refund copy. Localized (en/pl/uk), brandable, and overridable per call so every app keeps its own voice.

Pairs with [@nomideusz/svelte-scheduler](https://www.npmjs.com/package/@nomideusz/svelte-scheduler) and [@nomideusz/svelte-payments](https://www.npmjs.com/package/@nomideusz/svelte-payments); QR codes via [@nomideusz/svelte-qr](https://www.npmjs.com/package/@nomideusz/svelte-qr).

## Installation

```bash
npm install @nomideusz/svelte-notify
```

## Usage

Templates are pure functions: data in, `{ subject, html }` out. Send with any SMTP transport.

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

## License

MIT
