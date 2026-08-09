/**
 * HTML → plain text for the `text/plain` alternative part.
 *
 * This is not a general-purpose converter and shouldn't become one. It handles
 * exactly the markup this library emits — paragraphs, headings, lists, links,
 * `<br>`, the field tables an app may pass as `bodyHtml` — because a multipart
 * message whose text part is a tag-stripped soup is worse for both readers and
 * spam scoring than a short accurate one.
 *
 * Sending HTML-only from a low-reputation relay costs deliverability; this is
 * the cheap half of fixing that (an SPF/DKIM-aligned domain is the other half).
 */

const ENTITIES: [RegExp, string][] = [
  [/&lt;/g, '<'],
  [/&gt;/g, '>'],
  [/&quot;/g, '"'],
  [/&#39;/g, "'"],
  [/&nbsp;/g, ' '],
  // Last, or `&amp;lt;` would decode to `<` instead of `&lt;`.
  [/&amp;/g, '&'],
];

function decodeEntities(s: string): string {
  return ENTITIES.reduce((acc, [pattern, char]) => acc.replace(pattern, char), s);
}

function stripTags(s: string): string {
  return s.replace(/<[^>]*>/g, '');
}

export function htmlToText(html: string): string {
  return decodeEntities(
    stripTags(
      html
        // Source newlines and indentation are whitespace in HTML, not content.
        // Collapse them first, or a prettily-indented <ul> gains a blank line
        // between every item once tags start becoming newlines.
        .replace(/\s+/g, ' ')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<img[^>]*>/gi, '')
        // `<a href="X">X</a>` is the common shape here — printing "X (X)" reads
        // as a bug, so collapse it to the bare URL.
        .replace(/<a\s+[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_m, href, label) => {
          const text = stripTags(label).trim();
          return !text || text === href ? href : `${text} (${href})`;
        })
        .replace(/<li[^>]*>/gi, '- ')
        .replace(/<\/td>\s*<td[^>]*>/gi, ': ')
        // Rows and list items are lines within a block; blocks get a blank line
        // between them, or paragraphs run together into a wall of text.
        .replace(/<\/(li|tr)>/gi, '\n')
        .replace(/<\/(p|h1|h2|h3|div|ul|ol|table)>/gi, '\n\n'),
    ),
  )
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
