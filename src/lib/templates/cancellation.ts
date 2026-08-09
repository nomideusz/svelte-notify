import type { CancellationNotificationData, EmailTemplate } from '../types.js';
import { formatDate, formatMoney, makeT, resolveLang } from '../i18n.js';
import { escapeHtml as e } from '../escape.js';
import { renderLayout, renderText } from '../layout.js';

export function cancellationTemplate(data: CancellationNotificationData): EmailTemplate {
  const lang = resolveLang(data.language);
  const { t, tText } = makeT(data.language, data.overrides);

  // Provider and system cancellations read the same to the guest: the event
  // was called off through no fault of theirs, with a full refund.
  const byOperator = data.cancelledBy === 'guide' || data.cancelledBy === 'system';
  const date = formatDate(data.slotStartTime, lang, data.timeZone);

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
  const layout = {
    lang,
    theme: data.theme,
    brand: data.brand,
    headingHtml: byOperator ? t('c_heading_provider') : t('c_heading'),
    greetingHtml: t('b_hi', { name: data.guestName }),
    bodyHtml: `
        <p style="margin:0 0 16px;">${byOperator ? t('c_body_provider', { service: data.serviceName, date }) : t('c_body_guest', { service: data.serviceName, date })}</p>
        <p style="margin:0 0 16px;">${refundText}</p>
        <p style="margin:0;">${t('b_ref')}: <strong>${e(data.bookingReference)}</strong></p>`,
  };

  return {
    subject: tText(subjectKey, { service: data.serviceName, ref: data.bookingReference }),
    html: renderLayout(layout),
    text: renderText(layout),
  };
}
