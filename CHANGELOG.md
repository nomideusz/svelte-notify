# Changelog

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
