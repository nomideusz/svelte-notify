/**
 * HTML escaping for untrusted values interpolated into email bodies.
 *
 * The distinction this library draws: **message templates are trusted, params
 * are not.** Built-in copy and app-supplied `overrides` deliberately carry
 * markup (`<strong>{service}</strong>`), so they are interpolated as-is. The
 * values substituted into them — guest names, phone numbers, service names —
 * come from public booking forms and are escaped.
 *
 * This matters most for provider notifications: a guest types their name into
 * an unauthenticated form and it is rendered into an email delivered to a
 * *third party's* inbox. Without escaping that is a markup-injection path into
 * someone else's mail client.
 *
 * Subjects are a plain-text context and must NOT be escaped — `Anna &amp; Co`
 * renders literally in an inbox list. See `makeT`'s `tText`.
 */

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/**
 * Escapes `&<>"'` for both element and quoted-attribute contexts.
 *
 * Single regex pass rather than chained `.replace()` calls — chaining has to
 * handle `&` first or it double-escapes the entities it just produced, which is
 * the classic way this helper is written wrong.
 */
export function escapeHtml(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[&<>"']/g, (c) => ESCAPES[c]);
}
