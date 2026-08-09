import type { BookingNotificationData, EmailTemplate } from '../types.js';
import { formatDate, makeT, resolveLang } from '../i18n.js';
import { escapeHtml as e } from '../escape.js';
import { renderLayout, renderText } from '../layout.js';

/**
 * Pre-arrival nudge, typically swept the day before. The copy is
 * schedule-neutral ("upcoming") rather than "tomorrow", so an app that reminds
 * two hours out isn't lying; override `r_body` for a specific cadence.
 *
 * `verifyUrl` (ticket) is preferred over `manageUrl` — a reminder is the moment
 * someone wants the QR, not their whole booking history.
 */
export function reminderTemplate(data: BookingNotificationData): EmailTemplate {
  const lang = resolveLang(data.language);
  const { t, tText } = makeT(data.language, data.overrides);
  const when = formatDate(data.slotStartTime, lang, data.timeZone);
  const ticketUrl = data.verifyUrl ?? data.manageUrl;

  const layout = {
    lang,
    theme: data.theme,
    brand: data.brand,
    headingHtml: t('r_heading'),
    greetingHtml: t('b_hi', { name: data.guestName }),
    bodyHtml: `
        <p style="margin:0 0 16px;">${t('r_body')}</p>
        <ul style="margin:0;padding-left:20px;">
          <li><strong>${e(data.serviceName)}</strong></li>
          <li>${t('b_date')}: ${e(when)}</li>
          ${data.participants > 1 ? `<li>${t('b_participants')}: ${e(data.participants)}</li>` : ''}
          <li>${t('b_ref')}: ${e(data.bookingReference)}</li>
        </ul>
        <p style="margin:16px 0 0;">${t('b_see_you')}</p>`,
    footnotesHtml: ticketUrl
      ? [`${t('r_ticket')}<br/><a href="${e(ticketUrl)}">${e(ticketUrl)}</a>`]
      : [],
  };

  return {
    subject: tText('r_subject', { service: data.serviceName, date: when }),
    html: renderLayout(layout),
    text: renderText(layout),
  };
}
