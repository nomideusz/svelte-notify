import { describe, it, expect } from 'vitest';
import { escapeHtml } from './escape.js';
import { makeT } from './i18n.js';

describe('escapeHtml', () => {
	it('escapes the five HTML-significant characters', () => {
		expect(escapeHtml(`<script>&"'`)).toBe('&lt;script&gt;&amp;&quot;&#39;');
	});

	it('does not double-escape an ampersand it just produced', () => {
		// The chained-.replace() version of this helper turns `<` into `&lt;` and
		// then re-escapes that `&` into `&amp;lt;` unless `&` is handled first.
		expect(escapeHtml('<')).toBe('&lt;');
		expect(escapeHtml('&amp;')).toBe('&amp;amp;');
	});

	it('passes through text with nothing to escape', () => {
		expect(escapeHtml('Anna Kowalski')).toBe('Anna Kowalski');
		expect(escapeHtml('Ćwiczenia — До зустрічі')).toBe('Ćwiczenia — До зустрічі');
	});

	it('handles numbers and nullish without throwing', () => {
		expect(escapeHtml(42)).toBe('42');
		expect(escapeHtml(null)).toBe('');
		expect(escapeHtml(undefined)).toBe('');
	});
});

describe('makeT', () => {
	it('escapes params but keeps the message template markup', () => {
		const { t } = makeT('en');
		// b_body is `Your booking for <strong>{service}</strong> is confirmed.`
		const out = t('b_body', { service: '<img src=x onerror=alert(1)>' });
		expect(out).toContain('<strong>'); // template markup survives
		expect(out).toContain('&lt;img src=x onerror=alert(1)&gt;'); // param does not
		expect(out).not.toContain('<img');
	});

	it('does NOT escape in text context — an inbox shows &amp; literally', () => {
		const { tText } = makeT('en');
		const subject = tText('b_subject', { service: 'Bed & Breakfast', ref: 'TB-1' });
		expect(subject).toContain('Bed & Breakfast');
		expect(subject).not.toContain('&amp;');
	});

	it('treats app overrides as trusted templates, not as params', () => {
		const { t } = makeT('pl', { b_see_you: 'Do zobaczenia <strong>na macie</strong>!' });
		expect(t('b_see_you')).toBe('Do zobaczenia <strong>na macie</strong>!');
	});

	it('still falls back overrides → language → English → key', () => {
		const { t } = makeT('uk');
		expect(t('b_heading')).toBe('Ваше бронювання підтверджено');
		expect(t('totally_unknown_key')).toBe('totally_unknown_key');
	});
});
