export type {
  BookingNotificationData,
  CancellationNotificationData,
  ScheduleChangeNotificationData,
  EmailTemplate,
} from './types.js';
export { bookingConfirmationTemplate } from './templates/booking-confirmation.js';
export { providerNotificationTemplate, guideNotificationTemplate } from './templates/guide-notification.js';
export { cancellationTemplate } from './templates/cancellation.js';
export { reminderTemplate } from './templates/reminder.js';
export { scheduleChangedTemplate } from './templates/schedule-changed.js';
export { actionLinkTemplate } from './templates/action-link.js';
export type { ActionLinkInput } from './templates/action-link.js';
export type { NotifyLang, NotifyOverrides } from './i18n.js';
export { NOTIFY_MESSAGES, resolveLang } from './i18n.js';
// Date/money formatting is NOT re-exported here on purpose — it lives in
// @nomideusz/svelte-i18n (`formatDateTime`, `formatMoney`), so pages and emails
// share one implementation and apps don't import an email library to format a
// price. This package consumes it from there.

// Bind brand/theme/language/voice once per app instead of at every call site.
export { createNotifier } from './notifier.js';
export type { Notifier, NotifierConfig } from './notifier.js';

// The shell the templates render into — exported so an app composing a one-off
// email gets the same card, button and escaping contract as the packaged ones.
export { renderLayout, renderText } from './layout.js';
export type { LayoutInput } from './layout.js';
export { htmlToText } from './text.js';
export { DEFAULT_THEME, resolveTheme } from './theme.js';
export type { Theme } from './theme.js';

// Exported so apps composing their own transactional emails escape the same way
// these templates do, instead of each re-declaring a local `esc()`.
export { escapeHtml } from './escape.js';
