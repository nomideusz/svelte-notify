import { describe, it, expect } from 'vitest';
import { renderLayout } from './layout.js';
import { actionLinkTemplate } from './templates/action-link.js';

describe('renderLayout', () => {
	it('emits a complete document with the recipient language', () => {
		const html = renderLayout({ lang: 'uk', bodyHtml: '<p>x</p>' });
		expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
		expect(html).toContain('<html lang="uk">');
		expect(html).toContain('charset="utf-8"');
	});

	it('emits trusted *Html fields verbatim', () => {
		const html = renderLayout({ bodyHtml: '<p>Do zobaczenia <strong>na macie</strong></p>' });
		expect(html).toContain('<strong>na macie</strong>');
	});

	it('escapes the fields it owns — cta label, cta url, brand', () => {
		const html = renderLayout({
			brand: 'Bed & Breakfast',
			cta: { label: 'Go <now>', url: 'https://x.test/?a=1&b=2' },
		});
		expect(html).toContain('Bed &amp; Breakfast');
		expect(html).toContain('Go &lt;now&gt;');
		expect(html).toContain('href="https://x.test/?a=1&amp;b=2"'); // correct in an attribute
	});

	it('applies theme accent and radius to the button', () => {
		const html = renderLayout({
			theme: { accent: '#1a7f4b', radius: '9999px' },
			cta: { label: 'Go', url: 'https://x.test' },
		});
		expect(html).toContain('background:#1a7f4b');
		expect(html).toContain('border-radius:9999px');
	});

	it('omits optional blocks entirely rather than leaving empty tags', () => {
		const html = renderLayout({ bodyHtml: '<p>x</p>' });
		expect(html).not.toContain('<h1');
		expect(html).not.toContain('<a href');
		expect(html).not.toContain('border-top'); // no brand rule without a brand
	});
});

describe('actionLinkTemplate', () => {
	it('passes the subject through as plain text and renders the shell', () => {
		const { subject, html } = actionLinkTemplate({
			subject: 'Reset your password — Bed & Breakfast',
			headingHtml: 'Reset your password',
			cta: { label: 'Reset password', url: 'https://x.test/reset?t=abc' },
			brand: 'x.test',
		});
		expect(subject).toBe('Reset your password — Bed & Breakfast'); // never escaped
		expect(html).toContain('Reset password');
		expect(html).toContain('https://x.test/reset?t=abc');
	});
});
