import type { BookingNotificationData, EmailTemplate } from '../types.js';
import { formatDate, formatMoney, makeT, resolveLang } from '../i18n.js';
import { escapeHtml as e } from '../escape.js';
import { renderLayout, renderText } from '../layout.js';

/**
 * New-booking heads-up to whoever delivers the service.
 *
 * Every guest-supplied field here — name, e-mail, phone — is typed into a
 * public booking form and delivered to someone else's inbox, which makes this
 * the template where escaping is load-bearing rather than defensive.
 */
export function providerNotificationTemplate(data: BookingNotificationData): EmailTemplate {
  const lang = resolveLang(data.language);
  const { t, tText } = makeT(data.language, data.overrides);

  const layout = {
    lang,
    theme: data.theme,
    brand: data.brand,
    headingHtml: t('p_heading'),
    greetingHtml: t('p_hi', { name: data.providerName ?? '' }),
    bodyHtml: `
        <p style="margin:0 0 16px;">${t('p_body', { guest: data.guestName, service: data.serviceName })}</p>
        <ul style="margin:0;padding-left:20px;">
          <li>${t('b_date')}: ${e(formatDate(data.slotStartTime, lang, data.timeZone))}</li>
          <li>${t('b_participants')}: ${e(data.participants)}</li>
          <li>${t('p_amount')}: ${e(formatMoney(data.totalAmount, data.currency, lang))}</li>
          <li>${t('p_guest_email')}: ${e(data.guestEmail)}</li>
          ${data.guestPhone ? `<li>${t('p_guest_phone')}: ${e(data.guestPhone)}</li>` : ''}
          <li>${t('b_ref')}: ${e(data.bookingReference)}</li>
        </ul>`,
  };

  return {
    subject: tText('p_subject', { service: data.serviceName, participants: data.participants }),
    html: renderLayout(layout),
    text: renderText(layout),
  };
}

/** @deprecated Renamed to providerNotificationTemplate. */
export const guideNotificationTemplate = providerNotificationTemplate;
