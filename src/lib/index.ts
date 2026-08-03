export type { BookingNotificationData, CancellationNotificationData, EmailTemplate } from './types.js';
export { bookingConfirmationTemplate } from './templates/booking-confirmation.js';
export { providerNotificationTemplate, guideNotificationTemplate } from './templates/guide-notification.js';
export { cancellationTemplate } from './templates/cancellation.js';
export type { NotifyLang, NotifyOverrides } from './i18n.js';
export { NOTIFY_MESSAGES, resolveLang } from './i18n.js';
