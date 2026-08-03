import type { BookingNotificationData, EmailTemplate } from '../types.js';
import { formatDate, formatMoney, makeT, resolveLang } from '../i18n.js';

/** New-booking heads-up to whoever delivers the service. */
export function providerNotificationTemplate(data: BookingNotificationData): EmailTemplate {
  const lang = resolveLang(data.language);
  const t = makeT(data.language, data.overrides);

  return {
    subject: t('p_subject', { service: data.serviceName, participants: data.participants }),
    html: `
      <h2>${t('p_heading')}</h2>
      <p>${t('p_hi', { name: data.providerName ?? '' })}</p>
      <p>${t('p_body', { guest: data.guestName, service: data.serviceName })}</p>
      <ul>
        <li>${t('b_date')}: ${formatDate(data.slotStartTime, lang)}</li>
        <li>${t('b_participants')}: ${data.participants}</li>
        <li>${t('p_amount')}: ${formatMoney(data.totalAmount, data.currency, lang)}</li>
        <li>${t('p_guest_email')}: ${data.guestEmail}</li>
        ${data.guestPhone ? `<li>${t('p_guest_phone')}: ${data.guestPhone}</li>` : ''}
        <li>${t('b_ref')}: ${data.bookingReference}</li>
      </ul>
      ${data.brand ? `<hr/>\n      <p style="font-size:12px;color:#666">${data.brand}</p>` : ''}
    `,
  };
}

/** @deprecated Renamed to providerNotificationTemplate. */
export const guideNotificationTemplate = providerNotificationTemplate;
