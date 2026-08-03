import type { NotifyOverrides } from './i18n.js';

export interface BookingNotificationData {
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  /** What was booked — a class, an appointment, a tour. */
  serviceName: string;
  slotStartTime: Date;
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
  /** Per-call copy overrides — replace any message key to keep the app's voice. */
  overrides?: NotifyOverrides;
  /** Optional booking verification URL — if provided, a QR code is inlined in the email. */
  verifyUrl?: string;
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

export interface EmailTemplate {
  subject: string;
  html: string;
}
