import type { ScheduleChangeNotificationData, EmailTemplate } from '../types.js';
import { formatDate, makeT, resolveLang } from '../i18n.js';
import { escapeHtml as e } from '../escape.js';
import { renderLayout, renderText } from '../layout.js';

/**
 * "We moved your booking." The booking survives the move — this is a heads-up
 * with an escape hatch, not a cancellation, so the free-cancellation link is a
 * footnote rather than the primary action.
 */
export function scheduleChangedTemplate(data: ScheduleChangeNotificationData): EmailTemplate {
  const lang = resolveLang(data.language);
  const { t, tText } = makeT(data.language, data.overrides);
  const before = formatDate(data.previousStartTime, lang, data.timeZone);
  const after = formatDate(data.slotStartTime, lang, data.timeZone);
  const cancelUrl = data.verifyUrl ?? data.manageUrl;

  const layout = {
    lang,
    theme: data.theme,
    brand: data.brand,
    headingHtml: t('s_heading'),
    greetingHtml: t('b_hi', { name: data.guestName }),
    bodyHtml: `
        <p style="margin:0 0 16px;">${t('s_body')}</p>
        <p style="margin:0 0 16px;">
          <strong>${e(data.serviceName)}</strong><br/>
          ${t('s_from')}: <s>${e(before)}</s><br/>
          ${t('s_to')}: <strong>${e(after)}</strong>
        </p>
        <p style="margin:0;">${t('s_keep')}</p>`,
    footnotesHtml: cancelUrl
      ? [`${t('s_cancel')}<br/><a href="${e(cancelUrl)}">${e(cancelUrl)}</a>`]
      : [],
  };

  return {
    subject: tText('s_subject', { service: data.serviceName }),
    html: renderLayout(layout),
    text: renderText(layout),
  };
}
