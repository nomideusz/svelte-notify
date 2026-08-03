import type { CancellationNotificationData, EmailTemplate } from '../types.js';
import { formatDate, formatMoney, makeT, resolveLang } from '../i18n.js';

export function cancellationTemplate(data: CancellationNotificationData): EmailTemplate {
  const lang = resolveLang(data.language);
  const t = makeT(data.language, data.overrides);

  // Provider and system cancellations read the same to the guest: the event
  // was called off through no fault of theirs, with a full refund.
  const byOperator = data.cancelledBy === 'guide' || data.cancelledBy === 'system';
  const date = formatDate(data.slotStartTime, lang);

  let refundText: string;
  if (data.refundAmount > 0) {
    const amount = formatMoney(data.refundAmount, data.currency, lang);
    refundText = byOperator
      ? t('c_refund_full_provider', { amount })
      : t('c_refund', { amount });
  } else {
    refundText = byOperator ? t('c_no_payment') : t('c_no_refund');
  }

  const subjectKey = byOperator ? 'c_subject_provider' : 'c_subject_guest';
  return {
    subject: t(subjectKey, { service: data.serviceName, ref: data.bookingReference }),
    html: `
      <h2>${byOperator ? t('c_heading_provider') : t('c_heading')}</h2>
      <p>${t('b_hi', { name: data.guestName })}</p>
      <p>${byOperator ? t('c_body_provider', { service: data.serviceName, date }) : t('c_body_guest', { service: data.serviceName, date })}</p>
      <p>${refundText}</p>
      <p>${t('b_ref')}: <strong>${data.bookingReference}</strong></p>
      ${data.brand ? `<hr/>\n      <p style="font-size:12px;color:#666">${data.brand}</p>` : ''}
    `,
  };
}
