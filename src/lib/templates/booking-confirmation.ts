import type { BookingNotificationData, EmailTemplate } from '../types.js';
import { getQrMatrix, matrixToSvg } from '@nomideusz/svelte-qr';
import { formatDate, formatMoney, makeT, resolveLang } from '../i18n.js';

export function bookingConfirmationTemplate(data: BookingNotificationData): EmailTemplate {
  const lang = resolveLang(data.language);
  const t = makeT(data.language, data.overrides);

  // Hosted PNG when available — Gmail/Outlook strip data: URIs, so the
  // inline SVG fallback only renders in a minority of clients.
  const qrImgSrc =
    data.qrImageUrl ??
    (data.verifyUrl
      ? (() => {
          const matrix = getQrMatrix(data.verifyUrl, { errorCorrection: 'M', size: 160 });
          const svg = matrixToSvg(matrix, { size: 160 });
          return `data:image/svg+xml;base64,${btoa(svg)}`;
        })()
      : null);

  const qrSection = qrImgSrc
    ? `
        <div style="text-align:center;margin:24px 0;">
          <p style="font-size:13px;color:#666;margin-bottom:8px;">${t('b_qr_hint')}</p>
          <img src="${qrImgSrc}" width="160" height="160" alt="QR — ${data.bookingReference}" style="display:block;margin:0 auto;"/>
        </div>`
    : '';

  return {
    subject: t('b_subject', { service: data.serviceName, ref: data.bookingReference }),
    html: `
      <h2>${t('b_heading')}</h2>
      <p>${t('b_hi', { name: data.guestName })}</p>
      <p>${t('b_body', { service: data.serviceName })}</p>
      <ul>
        <li>${t('b_date')}: ${formatDate(data.slotStartTime, lang)}</li>
        <li>${t('b_participants')}: ${data.participants}</li>
        <li>${t('b_total')}: ${formatMoney(data.totalAmount, data.currency, lang)}</li>
        <li>${t('b_ref')}: <strong>${data.bookingReference}</strong></li>
      </ul>
      ${qrSection}
      <p>${t('b_see_you')}</p>
      ${data.brand ? `<hr/>\n      <p style="font-size:12px;color:#666">${data.brand}</p>` : ''}
    `,
  };
}
