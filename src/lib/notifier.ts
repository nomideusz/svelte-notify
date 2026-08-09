/**
 * Binds the per-app constants — brand, theme, default language, house voice —
 * so call sites pass only what actually varies per message.
 *
 * Without this, every call in every app repeats the same three fields; the two
 * source apps both grew a local `VOICE` constant threaded through by hand. Per
 * call still wins over config, because language is per-recipient even when the
 * app has a default.
 */
import type {
  BookingNotificationData,
  CancellationNotificationData,
  ScheduleChangeNotificationData,
  EmailTemplate,
} from './types.js';
import type { NotifyLang, NotifyOverrides } from './i18n.js';
import { resolveLang } from './i18n.js';
import type { Theme } from './theme.js';
import { bookingConfirmationTemplate } from './templates/booking-confirmation.js';
import { providerNotificationTemplate } from './templates/guide-notification.js';
import { cancellationTemplate } from './templates/cancellation.js';
import { reminderTemplate } from './templates/reminder.js';
import { scheduleChangedTemplate } from './templates/schedule-changed.js';
import { actionLinkTemplate, type ActionLinkInput } from './templates/action-link.js';

export interface NotifierConfig {
  /** Sender identity in the footer, e.g. 'szkolyjogi.pl'. */
  brand?: string;
  theme?: Partial<Theme>;
  /** Used when a message carries no recipient language of its own. */
  language?: string;
  /** IANA zone all times render in, e.g. 'Europe/Warsaw'. Pin it per app. */
  timeZone?: string;
  /**
   * House voice. The function form receives the resolved language, which is how
   * an app keeps a per-language override map without re-selecting it per call:
   * `overrides: (lang) => VOICE[lang]`.
   */
  overrides?: NotifyOverrides | ((lang: NotifyLang) => NotifyOverrides | undefined);
}

export interface Notifier {
  bookingConfirmation(data: BookingNotificationData): EmailTemplate;
  providerNotification(data: BookingNotificationData): EmailTemplate;
  cancellation(data: CancellationNotificationData): EmailTemplate;
  reminder(data: BookingNotificationData): EmailTemplate;
  scheduleChanged(data: ScheduleChangeNotificationData): EmailTemplate;
  actionLink(input: ActionLinkInput): EmailTemplate;
}

export function createNotifier(config: NotifierConfig = {}): Notifier {
  function applyDefaults<T extends BookingNotificationData>(data: T): T {
    const language = data.language ?? config.language;
    const configured =
      typeof config.overrides === 'function'
        ? config.overrides(resolveLang(language))
        : config.overrides;

    return {
      ...data,
      language,
      brand: data.brand ?? config.brand,
      theme: data.theme ?? config.theme,
      timeZone: data.timeZone ?? config.timeZone,
      // Per-call keys win over the house voice, key by key.
      overrides:
        configured || data.overrides ? { ...configured, ...data.overrides } : undefined,
    };
  }

  return {
    bookingConfirmation: (data) => bookingConfirmationTemplate(applyDefaults(data)),
    providerNotification: (data) => providerNotificationTemplate(applyDefaults(data)),
    cancellation: (data) => cancellationTemplate(applyDefaults(data)),
    reminder: (data) => reminderTemplate(applyDefaults(data)),
    scheduleChanged: (data) => scheduleChangedTemplate(applyDefaults(data)),
    actionLink: (input) =>
      actionLinkTemplate({
        brand: config.brand,
        theme: config.theme,
        lang: resolveLang(config.language),
        ...input,
      }),
  };
}
