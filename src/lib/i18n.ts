/**
 * Template localization. Messages are flat `{param}` templates rendered with
 * @nomideusz/svelte-i18n's pure `interpolate` — deliberately NOT its reactive
 * store: emails render per-recipient on the server, and a shared mutable
 * locale would race across concurrent requests. Language is resolved per call
 * from `data.language`; unknown languages fall back to English.
 *
 * Apps keep their own voice via the `overrides` parameter — any key can be
 * replaced per call ("See you there!" → "Do zobaczenia na macie!").
 */
import { interpolate, formatDateTime, formatMoney } from '@nomideusz/svelte-i18n';
import { escapeHtml } from './escape.js';

// Re-exported under the names the templates use. The regional policy
// (en → en-GB) lives in svelte-i18n's `intlLocale`, so it is decided once for
// pages and emails alike instead of drifting between them.
export { formatDateTime as formatDate, formatMoney };

/**
 * "One day or a range?" for a slot's rendered time. Multi-day slots
 * (workshops, retreats, multi-day tours) print "start – end"; everything
 * else keeps the single timestamp. Zone-aware: the calendar day is the
 * recipient's, not the server's.
 */
export function formatDateSpan(
  start: Date,
  end: Date | undefined,
  language?: string,
  timeZone?: string,
): string {
  const one = formatDateTime(start, resolveLang(language), timeZone);
  if (!end) return one;
  const key = (d: Date) =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  return key(start) === key(end)
    ? one
    : `${one} – ${formatDateTime(end, resolveLang(language), timeZone)}`;
}

export type NotifyLang = 'en' | 'pl' | 'uk';

export function resolveLang(language?: string): NotifyLang {
  const l = language?.toLowerCase() ?? '';
  if (l.startsWith('pl')) return 'pl';
  if (l.startsWith('uk')) return 'uk';
  return 'en';
}

export const NOTIFY_MESSAGES: Record<NotifyLang, Record<string, string>> = {
  en: {
    b_subject: 'Booking confirmed: {service} — Ref {ref}',
    b_heading: 'Your booking is confirmed',
    b_hi: 'Hi {name},',
    b_body: 'Your booking for <strong>{service}</strong> is confirmed.',
    b_date: 'Date',
    b_participants: 'Participants',
    b_total: 'Total paid',
    b_ref: 'Reference',
    b_qr_hint: 'Show this QR code at the entrance',
    b_see_you: 'See you there!',
    b_manage: 'Your bookings and passes, all in one place:',

    p_subject: 'New booking: {service} — {participants} participant(s)',
    p_heading: 'New booking received',
    p_hi: 'Hi {name},',
    p_body: '<strong>{guest}</strong> booked <strong>{service}</strong>.',
    p_amount: 'Amount',
    p_guest_email: 'Guest email',
    p_guest_phone: 'Guest phone',

    c_subject_guest: 'Booking cancelled: {service} — Ref {ref}',
    c_subject_provider: 'Cancelled by the organizer: {service} — Ref {ref}',
    c_heading: 'Booking cancelled',
    c_heading_provider: 'Your booking was cancelled by the organizer',
    c_body_guest: 'Your booking for <strong>{service}</strong> on {date} has been cancelled.',
    c_body_provider:
      'Unfortunately, the organizer had to cancel <strong>{service}</strong> scheduled for {date}. We are sorry for the inconvenience.',
    c_refund: 'A refund of {amount} will be processed within 5–10 business days.',
    c_refund_full_provider:
      'You will receive a full refund of {amount} within 5–10 business days — no action is needed on your side.',
    c_no_refund: 'No refund applies per the cancellation policy.',
    c_no_payment: 'No payment was taken for this booking.',

    r_subject: 'Reminder: {service} — {date}',
    r_heading: 'Booking reminder',
    r_body: 'A reminder about your upcoming booking:',
    r_ticket: 'Your ticket, and the cancellation link:',

    s_subject: 'Schedule change: {service}',
    s_heading: 'Your booking has been rescheduled',
    s_body: 'The organizer moved a booking of yours:',
    s_from: 'Was',
    s_to: 'Now',
    s_keep: 'Your booking moves to the new time automatically — nothing to do.',
    s_cancel: "If the new time doesn't work for you, you can cancel free of charge:",
  },
  pl: {
    b_subject: 'Rezerwacja potwierdzona: {service} — nr {ref}',
    b_heading: 'Twoja rezerwacja jest potwierdzona',
    b_hi: 'Cześć {name},',
    b_body: 'Twoja rezerwacja na <strong>{service}</strong> jest potwierdzona.',
    b_date: 'Termin',
    b_participants: 'Liczba osób',
    b_total: 'Zapłacono',
    b_ref: 'Numer rezerwacji',
    b_qr_hint: 'Pokaż ten kod QR przy wejściu',
    b_see_you: 'Do zobaczenia!',
    b_manage: 'Twoje zapisy i karnety w jednym miejscu:',

    p_subject: 'Nowa rezerwacja: {service} — {participants} os.',
    p_heading: 'Nowa rezerwacja',
    p_hi: 'Cześć {name},',
    p_body: '<strong>{guest}</strong> zarezerwował(a) <strong>{service}</strong>.',
    p_amount: 'Kwota',
    p_guest_email: 'E-mail gościa',
    p_guest_phone: 'Telefon gościa',

    c_subject_guest: 'Rezerwacja anulowana: {service} — nr {ref}',
    c_subject_provider: 'Odwołane przez organizatora: {service} — nr {ref}',
    c_heading: 'Rezerwacja anulowana',
    c_heading_provider: 'Twoja rezerwacja została odwołana przez organizatora',
    c_body_guest: 'Twoja rezerwacja na <strong>{service}</strong> w dniu {date} została anulowana.',
    c_body_provider:
      'Niestety organizator musiał odwołać <strong>{service}</strong> zaplanowane na {date}. Przepraszamy za niedogodność.',
    c_refund: 'Zwrot {amount} zostanie zrealizowany w ciągu 5–10 dni roboczych.',
    c_refund_full_provider:
      'Otrzymasz pełny zwrot {amount} w ciągu 5–10 dni roboczych — nie musisz nic robić.',
    c_no_refund: 'Zgodnie z polityką anulowania zwrot nie przysługuje.',
    c_no_payment: 'Za tę rezerwację nie pobrano płatności.',

    r_subject: 'Przypomnienie: {service} — {date}',
    r_heading: 'Przypomnienie o rezerwacji',
    r_body: 'Przypominamy o nadchodzącej rezerwacji:',
    r_ticket: 'Twój bilet z kodem QR (i możliwość odwołania):',

    s_subject: 'Zmiana terminu: {service}',
    s_heading: 'Zmiana terminu rezerwacji',
    s_body: 'Organizator przeniósł termin Twojej rezerwacji:',
    s_from: 'Było',
    s_to: 'Jest',
    s_keep: 'Twoja rezerwacja przechodzi na nowy termin automatycznie — nie musisz nic robić.',
    s_cancel: 'Jeśli nowy termin Ci nie pasuje, możesz bezpłatnie odwołać rezerwację:',
  },
  uk: {
    b_subject: 'Бронювання підтверджено: {service} — № {ref}',
    b_heading: 'Ваше бронювання підтверджено',
    b_hi: 'Вітаємо, {name}!',
    b_body: 'Ваше бронювання на <strong>{service}</strong> підтверджено.',
    b_date: 'Дата',
    b_participants: 'Кількість осіб',
    b_total: 'Сплачено',
    b_ref: 'Номер бронювання',
    b_qr_hint: 'Покажіть цей QR-код на вході',
    b_see_you: 'До зустрічі!',
    b_manage: 'Ваші записи й абонементи в одному місці:',

    p_subject: 'Нове бронювання: {service} — {participants} ос.',
    p_heading: 'Нове бронювання',
    p_hi: 'Вітаємо, {name}!',
    p_body: '<strong>{guest}</strong> забронював(ла) <strong>{service}</strong>.',
    p_amount: 'Сума',
    p_guest_email: 'E-mail гостя',
    p_guest_phone: 'Телефон гостя',

    c_subject_guest: 'Бронювання скасовано: {service} — № {ref}',
    c_subject_provider: 'Скасовано організатором: {service} — № {ref}',
    c_heading: 'Бронювання скасовано',
    c_heading_provider: 'Ваше бронювання скасовано організатором',
    c_body_guest: 'Ваше бронювання на <strong>{service}</strong> {date} було скасовано.',
    c_body_provider:
      'На жаль, організатор мусив скасувати <strong>{service}</strong>, заплановане на {date}. Просимо вибачення за незручності.',
    c_refund: 'Повернення {amount} буде оброблено протягом 5–10 робочих днів.',
    c_refund_full_provider:
      'Ви отримаєте повне повернення {amount} протягом 5–10 робочих днів — жодних дій не потрібно.',
    c_no_refund: 'Згідно з політикою скасування повернення не передбачено.',
    c_no_payment: 'Оплату за це бронювання не стягнуто.',

    r_subject: 'Нагадування: {service} — {date}',
    r_heading: 'Нагадування про бронювання',
    r_body: 'Нагадуємо про найближче бронювання:',
    r_ticket: 'Ваш квиток з QR-кодом (і можливість скасування):',

    s_subject: 'Зміна розкладу: {service}',
    s_heading: 'Зміна часу бронювання',
    s_body: 'Організатор переніс ваше бронювання:',
    s_from: 'Було',
    s_to: 'Тепер',
    s_keep: 'Ваше бронювання автоматично переходить на новий час — нічого робити не треба.',
    s_cancel: 'Якщо новий час не підходить, ви можете безкоштовно скасувати бронювання:',
  },
};

export type NotifyOverrides = Partial<Record<string, string>>;

export type TranslateParams = Record<string, string | number | null | undefined>;

function escapeParams(params?: TranslateParams): Record<string, string> | undefined {
  if (!params) return undefined;
  const escaped: Record<string, string> = {};
  for (const key of Object.keys(params)) escaped[key] = escapeHtml(params[key]);
  return escaped;
}

/**
 * Per-call translator: overrides → language dictionary → English fallback.
 *
 * Returns one translator per output context, because escaping is correct in
 * exactly one of them:
 *
 * - `t`     — HTML bodies. Params are escaped; the message template is not, so
 *             built-in and overridden copy keeps its deliberate `<strong>`.
 * - `tText` — plain-text contexts, i.e. subject lines. Nothing is escaped;
 *             an inbox shows `&amp;` literally.
 *
 * Splitting them at the factory rather than adding an `escape: false` flag
 * means the call site names its context and can't silently pick the wrong one.
 */
export function makeT(language?: string, overrides?: NotifyOverrides) {
  const lang = resolveLang(language);
  const lookup = (key: string): string =>
    overrides?.[key] ?? NOTIFY_MESSAGES[lang][key] ?? NOTIFY_MESSAGES.en[key] ?? key;

  return {
    t: (key: string, params?: TranslateParams): string =>
      interpolate(lookup(key), escapeParams(params)),
    tText: (key: string, params?: TranslateParams): string =>
      interpolate(lookup(key), params as Record<string, string | number> | undefined),
  };
}
