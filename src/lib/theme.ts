/**
 * Per-app visual identity. Deliberately small: the only things that differed
 * across the apps this library was extracted from were an accent colour and a
 * button radius (yoga: green + 6px, thebest: sky + pill). Everything else was
 * identical, so it lives in the defaults rather than in every app's config.
 *
 * This is not a design system. Resist growing it into one — an email that needs
 * a bespoke layout should render its own HTML and pass it as `bodyHtml`.
 */
export interface Theme {
  /** Buttons, and the rule under the heading. */
  accent: string;
  /** Button corner radius — '6px' or '9999px' for a pill. */
  radius: string;
  /** Body copy. */
  text: string;
  /** Secondary copy: footnotes, the brand line. */
  muted: string;
  /** The card the message sits on. */
  surface: string;
  /** The page behind the card. */
  canvas: string;
  maxWidth: string;
  fontFamily: string;
}

export const DEFAULT_THEME: Theme = {
  accent: '#2563eb',
  radius: '6px',
  text: '#1a2332',
  muted: '#6b7a8f',
  surface: '#ffffff',
  canvas: '#f5f6f8',
  maxWidth: '560px',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
};

export function resolveTheme(theme?: Partial<Theme>): Theme {
  return theme ? { ...DEFAULT_THEME, ...theme } : DEFAULT_THEME;
}
