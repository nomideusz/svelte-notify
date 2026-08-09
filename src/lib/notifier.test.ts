import { describe, it, expect } from 'vitest';
import { createNotifier } from './notifier.js';

const booking = {
	guestName: 'Anna',
	guestEmail: 'anna@example.com',
	serviceName: 'Morning Vinyasa',
	slotStartTime: new Date('2026-06-15T10:00:00Z'),
	participants: 1,
	totalAmount: 5000,
	currency: 'PLN',
	bookingReference: 'YG-1',
};

describe('createNotifier', () => {
	it('applies brand and theme without repeating them per call', () => {
		const notify = createNotifier({ brand: 'szkolyjogi.pl', theme: { accent: '#1a7f4b' } });
		const { html } = notify.bookingConfirmation(booking);
		expect(html).toContain('szkolyjogi.pl');
		expect(html).toContain('#1a7f4b');
	});

	it('uses the configured language but lets a recipient override it', () => {
		const notify = createNotifier({ language: 'pl' });
		expect(notify.bookingConfirmation(booking).html).toContain('Twoja rezerwacja');
		expect(notify.bookingConfirmation({ ...booking, language: 'uk' }).html).toContain(
			'Ваше бронювання',
		);
	});

	it('selects house voice by resolved language via the function form', () => {
		const notify = createNotifier({
			language: 'pl',
			overrides: (lang) => ({ b_see_you: lang === 'uk' ? 'До зустрічі на маті!' : 'Do zobaczenia na macie!' }),
		});
		expect(notify.bookingConfirmation(booking).html).toContain('Do zobaczenia na macie!');
		expect(notify.bookingConfirmation({ ...booking, language: 'uk' }).html).toContain(
			'До зустрічі на маті!',
		);
	});

	it('lets a per-call override beat the house voice key by key', () => {
		const notify = createNotifier({
			language: 'pl',
			overrides: { b_see_you: 'House voice', b_qr_hint: 'House hint' },
		});
		const { html } = notify.bookingConfirmation({
			...booking,
			verifyUrl: 'https://x.test/v/YG-1',
			overrides: { b_see_you: 'Call voice' },
		});
		expect(html).toContain('Call voice');
		expect(html).toContain('House hint'); // untouched key survives
		expect(html).not.toContain('House voice');
	});

	it('binds brand and theme onto actionLink too', () => {
		const notify = createNotifier({ brand: 'thebest.travel', theme: { radius: '9999px' } });
		const { html } = notify.actionLink({
			subject: 'Verify your email',
			headingHtml: 'Verify your email',
			cta: { label: 'Verify', url: 'https://x.test/v' },
		});
		expect(html).toContain('thebest.travel');
		expect(html).toContain('border-radius:9999px');
	});
});
