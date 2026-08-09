/**
 * The shared shell every template renders into: a full HTML document, a centred
 * card, inline styles, table-based centring for Outlook.
 *
 * ## Escaping contract
 *
 * Fields suffixed `Html` are **trusted** — they carry deliberate markup
 * (`<strong>`, links) and are emitted as-is. Escape untrusted values with
 * `escapeHtml` before composing them in. This is the same split the message
 * templates use: templates are trusted, the values substituted into them aren't.
 *
 * Fields without the suffix (`brand`, `cta.label`, `cta.url`) are plain text or
 * a URL, and are escaped here so the caller can't get it wrong.
 */
import { escapeHtml as e } from './escape.js';
import { htmlToText } from './text.js';
import { resolveTheme, type Theme } from './theme.js';
import type { NotifyLang } from './i18n.js';

export interface LayoutInput {
  /** `<html lang>` — affects screen-reader pronunciation and client hyphenation. */
  lang?: NotifyLang;
  /** Trusted HTML. Rendered as an `<h1>` above the accent rule. */
  headingHtml?: string;
  /** Trusted HTML. A single greeting line, e.g. the output of `t('b_hi', …)`. */
  greetingHtml?: string;
  /** Trusted HTML. The body of the message — paragraphs, lists, whatever fits. */
  bodyHtml?: string;
  /** Escaped here. A single primary action; a second button belongs in `bodyHtml` as a link. */
  cta?: { label: string; url: string };
  /** Trusted HTML. Muted small print below the action, one `<p>` each. */
  footnotesHtml?: string[];
  /** Trusted HTML. Sign-off above the brand rule, e.g. `Bartek<br>szkolyjogi.pl`. */
  signoffHtml?: string;
  /** Escaped here. Sender identity in the footer; omitted when unset. */
  brand?: string;
  theme?: Partial<Theme>;
}

export function renderLayout(input: LayoutInput): string {
  const t = resolveTheme(input.theme);

  const heading = input.headingHtml
    ? `<h1 style="margin:0 0 16px;padding-bottom:16px;border-bottom:2px solid ${t.accent};font-size:18px;font-weight:600;line-height:1.4;">${input.headingHtml}</h1>`
    : '';

  const greeting = input.greetingHtml
    ? `<p style="margin:0 0 12px;font-size:15px;line-height:1.7;">${input.greetingHtml}</p>`
    : '';

  const body = input.bodyHtml
    ? `<div style="font-size:15px;line-height:1.7;">${input.bodyHtml}</div>`
    : '';

  // Inline-block anchor rather than a VML "bulletproof" button: the apps this
  // replaced all used one, and Outlook desktop is a rounding error in their
  // traffic. Swap in VML here if that ever stops being true.
  const cta = input.cta
    ? `<p style="margin:24px 0;"><a href="${e(input.cta.url)}" style="display:inline-block;padding:12px 24px;background:${t.accent};color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:${t.radius};">${e(input.cta.label)}</a></p>`
    : '';

  const footnotes = (input.footnotesHtml ?? []).map(
    (note) => `<p style="margin:0 0 12px;font-size:13px;line-height:1.7;color:${t.muted};">${note}</p>`,
  );

  const signoff = input.signoffHtml
    ? `<p style="margin:24px 0 0;font-size:15px;line-height:1.7;">${input.signoffHtml}</p>`
    : '';

  const brand = input.brand
    ? `<p style="margin:32px 0 0;padding-top:16px;border-top:1px solid #e6e9ee;font-size:12px;color:${t.muted};">${e(input.brand)}</p>`
    : '';

  const content = [heading, greeting, body, cta, ...footnotes, signoff, brand]
    .filter(Boolean)
    .join('\n              ');

  return `<!DOCTYPE html>
<html lang="${e(input.lang ?? 'en')}">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
</head>
<body style="margin:0;padding:0;background:${t.canvas};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${t.canvas};">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:${t.maxWidth};background:${t.surface};border-radius:8px;">
          <tr>
            <td style="padding:32px 24px;font-family:${t.fontFamily};color:${t.text};">
              ${content}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * The same message as the `text/plain` alternative. Built from the layout's
 * own parts rather than by parsing the finished document, so the button becomes
 * a labelled URL instead of a bare word and the card chrome never leaks in.
 */
export function renderText(input: LayoutInput): string {
  const sections = [
    input.headingHtml,
    input.greetingHtml,
    input.bodyHtml,
    input.cta ? `${input.cta.label}: ${input.cta.url}` : '',
    ...(input.footnotesHtml ?? []),
    input.signoffHtml,
  ]
    .filter(Boolean)
    .map((section) => htmlToText(section as string))
    .filter(Boolean);

  // The signature separator is composed after conversion — its newline is real
  // text, and htmlToText would collapse it as HTML source whitespace.
  if (input.brand) sections.push(`--\n${htmlToText(input.brand)}`);

  return sections.join('\n\n');
}
