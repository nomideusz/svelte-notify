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
import { interpolate } from '@nomideusz/svelte-i18n';

export type NotifyLang = 'en' | 'pl' | 'uk';

export function resolveLang(language?: string): NotifyLang {
  const l = language?.toLowerCase() ?? '';
  if (l.startsWith('pl')) return 'pl';
  if (l.startsWith('uk')) return 'uk';
  return 'en';
}

const LOCALE: Record<NotifyLang, string> = { en: 'en-GB', pl: 'pl-PL', uk: 'uk-UA' };

export function formatDate(d: Date, lang: NotifyLang): string {
  return d.toLocaleString(LOCALE[lang], {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatMoney(cents: number, currency: string, lang: NotifyLang): string {
  return new Intl.NumberFormat(LOCALE[lang], { style: 'currency', currency }).format(cents / 100);
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
  },
};

export type NotifyOverrides = Partial<Record<string, string>>;

/** Per-call translator: overrides → language dictionary → English fallback. */
export function makeT(language?: string, overrides?: NotifyOverrides) {
  const lang = resolveLang(language);
  return (key: string, params?: Record<string, string | number>): string =>
    interpolate(overrides?.[key] ?? NOTIFY_MESSAGES[lang][key] ?? NOTIFY_MESSAGES.en[key] ?? key, params);
}
