import type { NotifyOverrides } from './i18n.js';
import type { Theme } from './theme.js';

export interface BookingNotificationData {
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  /** What was booked — a class, an appointment, a tour. */
  serviceName: string;
  slotStartTime: Date;
  /**
   * When the booked slot ends. Optional: only rendered when it falls on a
   * different calendar day than the start (a workshop, a retreat, a
   * multi-day tour) — same-day classes keep the single timestamp.
   */
  slotEndTime?: Date;
  participants: number;
  totalAmount: number;   // in cents
  currency: string;      // ISO 4217, e.g. 'PLN'
  bookingReference: string;
  /** Who delivers the service — instructor, guide, stylist. */
  providerName?: string;
  providerEmail?: string;
  /** Recipient's language ('en' | 'pl' | 'uk'; unknown → English). */
  language?: string;
  /** Sender identity shown in the footer, e.g. 'thebest.travel'. */
  brand?: string;
  /** Accent colour and button radius. Usually set once via `createNotifier`. */
  theme?: Partial<Theme>;
  /**
   * IANA zone the times are rendered in, e.g. 'Europe/Warsaw'. Defaults to the
   * server's zone — pin it, or the same booking reads differently depending on
   * where the process happens to run.
   */
  timeZone?: string;
  /** Per-call copy overrides — replace any message key to keep the app's voice. */
  overrides?: NotifyOverrides;
  /** Optional booking verification URL — if provided, a QR code is inlined in the email. */
  verifyUrl?: string;
  /** Guest's own page (all bookings/passes) — rendered as a manage link when set */
  manageUrl?: string;
  /**
   * Optional hosted QR image URL (PNG). Preferred over the inline data-URI
   * fallback — most email clients (Gmail, Outlook) strip data: images.
   */
  qrImageUrl?: string;
}

export interface CancellationNotificationData extends BookingNotificationData {
  cancelledBy: 'guest' | 'guide' | 'system';
  refundAmount: number;  // in cents, 0 = no refund
}

export interface ScheduleChangeNotificationData extends BookingNotificationData {
  /** Where the booking used to sit; `slotStartTime` is the new time. */
  previousStartTime: Date;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  /** `text/plain` alternative. Send it as the alternative part, not instead of `html`. */
  text: string;
}
