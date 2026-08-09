import { describe, it, expect } from 'vitest';
import { reminderTemplate } from './reminder.js';
import { scheduleChangedTemplate } from './schedule-changed.js';

const base = {
	guestName: 'Anna',
	guestEmail: 'anna@example.com',
	serviceName: 'Morning Vinyasa — Studio X',
	slotStartTime: new Date('2026-06-15T16:00:00Z'),
	participants: 1,
	totalAmount: 5000,
	currency: 'PLN',
	bookingReference: 'YG-AB12',
	timeZone: 'Europe/Warsaw',
};

describe('reminderTemplate', () => {
	it('puts the service and time in the subject', () => {
		const { subject } = reminderTemplate({ ...base, language: 'pl' });
		expect(subject).toContain('Morning Vinyasa — Studio X');
		expect(subject).toContain('18:00'); // 16:00Z in Europe/Warsaw
	});

	it('honours the pinned time zone rather than the server default', () => {
		const warsaw = reminderTemplate({ ...base, language: 'en' }).html;
		const utc = reminderTemplate({ ...base, language: 'en', timeZone: 'UTC' }).html;
		expect(warsaw).toContain('18:00');
		expect(utc).toContain('16:00');
	});

	it('omits the participant line for a party of one', () => {
		expect(reminderTemplate({ ...base, language: 'en' }).html).not.toContain('Participants');
		expect(reminderTemplate({ ...base, language: 'en', participants: 3 }).html).toContain(
			'Participants',
		);
	});

	it('prefers the ticket link over the manage link', () => {
		const { html } = reminderTemplate({
			...base,
			verifyUrl: 'https://x.test/v/YG-AB12',
			manageUrl: 'https://x.test/karnet/tok',
		});
		expect(html).toContain('https://x.test/v/YG-AB12');
		expect(html).not.toContain('karnet/tok');
	});

	it('ships a usable text part', () => {
		const { text } = reminderTemplate({ ...base, language: 'en', verifyUrl: 'https://x.test/v' });
		expect(text).toContain('Booking reminder');
		expect(text).toContain('https://x.test/v');
		expect(text).not.toContain('<');
	});
});

describe('scheduleChangedTemplate', () => {
	const moved = { ...base, previousStartTime: new Date('2026-06-15T08:00:00Z') };

	it('shows both the old and the new time', () => {
		const { html } = scheduleChangedTemplate({ ...moved, language: 'pl' });
		expect(html).toContain('10:00'); // was
		expect(html).toContain('18:00'); // now
	});

	it('says the booking survives the move', () => {
		const { html } = scheduleChangedTemplate({ ...moved, language: 'en' });
		expect(html).toContain('moves to the new time automatically');
	});

	it('offers cancellation as a footnote, not the primary action', () => {
		const { html } = scheduleChangedTemplate({ ...moved, verifyUrl: 'https://x.test/v/1' });
		expect(html).toContain('https://x.test/v/1');
		expect(html).not.toContain('display:inline-block'); // no CTA button
	});

	it('escapes a service name carrying markup', () => {
		const { html } = scheduleChangedTemplate({ ...moved, serviceName: '<b>x</b>' });
		expect(html).not.toContain('<b>x</b>');
		expect(html).toContain('&lt;b&gt;');
	});
});
