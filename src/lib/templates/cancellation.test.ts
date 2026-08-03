import { describe, it, expect } from 'vitest';
import { cancellationTemplate } from './cancellation.js';

const base = {
  guestName: 'Anna Kowalski',
  guestEmail: 'anna@example.com',
  serviceName: 'Old Town Walking Tour',
  slotStartTime: new Date('2026-06-15T10:00:00Z'),
  participants: 2,
  totalAmount: 8000,
  currency: 'PLN',
  bookingReference: 'TB-12345',
  cancelledBy: 'guest' as const,
  refundAmount: 8000,
};

describe('cancellationTemplate', () => {
  it('mentions refund when refundAmount > 0', () => {
    const { html } = cancellationTemplate({ ...base, refundAmount: 8000 });
    expect(html.toLowerCase()).toMatch(/refund/);
  });

  it('says no refund when refundAmount is 0', () => {
    const { html } = cancellationTemplate({ ...base, refundAmount: 0 });
    expect(html).toContain('No refund');
  });

  it('includes booking reference', () => {
    const { html, subject } = cancellationTemplate(base);
    expect(html).toContain('TB-12345');
    expect(subject).toContain('TB-12345');
  });

  it('uses operator copy and full-refund reassurance when guide cancels', () => {
    const { html, subject } = cancellationTemplate({ ...base, cancelledBy: 'guide' });
    expect(subject).toContain('Cancelled by the organizer');
    expect(html).toContain('organizer had to cancel');
    expect(html).toContain('full refund');
  });

  it('says no payment was taken for unpaid bookings on guide cancel', () => {
    const { html } = cancellationTemplate({ ...base, cancelledBy: 'guide', refundAmount: 0 });
    expect(html).toContain('No payment was taken');
  });

  it('renders Polish copy when language is pl', () => {
    const { html, subject } = cancellationTemplate({
      ...base,
      cancelledBy: 'guide',
      language: 'pl',
    });
    expect(subject).toContain('Odwołane przez organizatora');
    expect(html).toContain('pełny zwrot');
  });

  it('falls back to English for unknown languages', () => {
    const { subject } = cancellationTemplate({ ...base, language: 'de' });
    expect(subject).toContain('Booking cancelled');
  });
});
