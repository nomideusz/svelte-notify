import type { BookingNotificationData, EmailTemplate } from '../types.js';
import { getQrMatrix, matrixToSvg } from '@nomideusz/svelte-qr';
import { formatDateSpan, formatMoney, makeT, resolveLang } from '../i18n.js';
import { escapeHtml as e } from '../escape.js';
import { renderLayout, renderText } from '../layout.js';
import { resolveTheme } from '../theme.js';

export function bookingConfirmationTemplate(data: BookingNotificationData): EmailTemplate {
  const lang = resolveLang(data.language);
  const { t, tText } = makeT(data.language, data.overrides);
  const theme = resolveTheme(data.theme);

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
          <p style="font-size:13px;color:${theme.muted};margin:0 0 8px;">${t('b_qr_hint')}</p>
          <img src="${e(qrImgSrc)}" width="160" height="160" alt="QR — ${e(data.bookingReference)}" style="display:block;margin:0 auto;"/>
        </div>`
    : '';

  const manageFootnote = data.manageUrl
    ? [`${t('b_manage')}<br/><a href="${e(data.manageUrl)}">${e(data.manageUrl)}</a>`]
    : [];

  // The QR block is the one part that differs between the two renderings: an
  // image in HTML, the URL behind it in text — otherwise a plain-text reader
  // is left holding a hint with nothing to scan.
  const body = (qrBlock: string) => `
        <p style="margin:0 0 16px;">${t('b_body', { service: data.serviceName })}</p>
        <ul style="margin:0;padding-left:20px;">
          <li>${t('b_date')}: ${e(formatDateSpan(data.slotStartTime, data.slotEndTime, lang, data.timeZone))}</li>
          <li>${t('b_participants')}: ${e(data.participants)}</li>
          <li>${t('b_total')}: ${e(formatMoney(data.totalAmount, data.currency, lang))}</li>
          <li>${t('b_ref')}: <strong>${e(data.bookingReference)}</strong></li>
        </ul>
        ${qrBlock}
        <p style="margin:16px 0 0;">${t('b_see_you')}</p>`;

  const layout = {
    lang,
    theme: data.theme,
    brand: data.brand,
    headingHtml: t('b_heading'),
    greetingHtml: t('b_hi', { name: data.guestName }),
    bodyHtml: body(qrSection),
    footnotesHtml: manageFootnote,
  };

  return {
    subject: tText('b_subject', { service: data.serviceName, ref: data.bookingReference }),
    html: renderLayout(layout),
    text: renderText({
      ...layout,
      bodyHtml: body(
        data.verifyUrl ? `<p>${t('b_qr_hint')}<br/>${e(data.verifyUrl)}</p>` : '',
      ),
    }),
  };
}
