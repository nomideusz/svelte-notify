# Changelog

## Unreleased

### Changed
- `sideEffects: false`, so bundlers can tree-shake unused exports.
  Not yet released — this package has no publish path from the monorepo,
  see docs/plans/2026-08-02-v1-roadmap.md.

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
