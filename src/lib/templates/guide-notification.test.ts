import { describe, it, expect } from 'vitest';
import { providerNotificationTemplate } from './guide-notification.js';

// This template carries public-form input into a third party's inbox, so the
// escaping here is the reason escape.ts exists.
const base = {
	guestName: 'Anna Kowalski',
	guestEmail: 'anna@example.com',
	guestPhone: '+48 600 100 200',
	serviceName: 'Morning Vinyasa',
	slotStartTime: new Date('2026-06-15T10:00:00Z'),
	participants: 2,
	totalAmount: 8000,
	currency: 'PLN',
	bookingReference: 'YG-12345',
	providerName: 'Studio X',
};

describe('providerNotificationTemplate', () => {
	it('renders guest contact details', () => {
		const { html } = providerNotificationTemplate(base);
		expect(html).toContain('Anna Kowalski');
		expect(html).toContain('anna@example.com');
		expect(html).toContain('+48 600 100 200');
	});

	it('escapes a guest name carrying markup', () => {
		const { html } = providerNotificationTemplate({
			...base,
			guestName: '<script>alert(1)</script>',
		});
		expect(html).not.toContain('<script>');
		expect(html).toContain('&lt;script&gt;');
	});

	it('escapes guest phone and e-mail, which are separate form fields', () => {
		const { html } = providerNotificationTemplate({
			...base,
			guestEmail: 'a@b.c"><b>x</b>',
			guestPhone: '<b>555</b>',
		});
		expect(html).not.toContain('<b>');
		expect(html).toContain('&lt;b&gt;');
	});

	it('leaves the subject unescaped — it is a plain-text context', () => {
		const { subject } = providerNotificationTemplate({ ...base, serviceName: 'Yin & Restore' });
		expect(subject).toContain('Yin & Restore');
		expect(subject).not.toContain('&amp;');
	});
});
