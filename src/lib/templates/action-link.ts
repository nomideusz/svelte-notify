import type { EmailTemplate } from '../types.js';
import { renderLayout, renderText, type LayoutInput } from '../layout.js';

export interface ActionLinkInput extends LayoutInput {
  /** Plain text — subjects are never HTML. */
  subject: string;
}

/**
 * The "here is a link, go do the thing" email: magic-link sign-in, password
 * reset, address verification, team invite, account invite, recovery link.
 *
 * Every app rewrites these on day one, which is how both source apps ended up
 * with seven near-identical copies — three of them unescaped. This is not a
 * localized template: the copy is app-specific and passed in. What it
 * standardizes is the shell, the escaping contract, and the button.
 *
 * `cta` is optional — some transactional mail is a list of links with no single
 * primary action, and forcing a button on it would be a lie about the content.
 */
export function actionLinkTemplate({ subject, ...layout }: ActionLinkInput): EmailTemplate {
  return { subject, html: renderLayout(layout), text: renderText(layout) };
}
