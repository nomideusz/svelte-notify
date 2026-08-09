import { describe, it, expect } from 'vitest';
import { htmlToText } from './text.js';
import { renderText } from './layout.js';

describe('htmlToText', () => {
	it('turns block elements into line breaks, not run-on text', () => {
		expect(htmlToText('<p>One</p><p>Two</p>')).toBe('One\n\nTwo');
	});

	it('renders list items as dashes', () => {
		expect(htmlToText('<ul><li>Date: Monday</li><li>People: 2</li></ul>')).toBe(
			'- Date: Monday\n- People: 2',
		);
	});

	it('keeps a link readable as "label (url)"', () => {
		expect(htmlToText('<a href="https://x.test/t">Your ticket</a>')).toBe(
			'Your ticket (https://x.test/t)',
		);
	});

	it('collapses a self-labelled link to the bare URL', () => {
		// `<a href="X">X</a>` is the common shape here; "X (X)" reads as a bug.
		expect(htmlToText('<a href="https://x.test/t">https://x.test/t</a>')).toBe('https://x.test/t');
	});

	it('drops images — a QR cannot travel in a text part', () => {
		expect(htmlToText('<p>Hi</p><img src="data:image/svg+xml;base64,AAA" alt="QR"/>')).toBe('Hi');
	});

	it('decodes entities, and does not turn &amp;lt; into <', () => {
		expect(htmlToText('<p>Bed &amp; Breakfast</p>')).toBe('Bed & Breakfast');
		expect(htmlToText('<p>&amp;lt;</p>')).toBe('&lt;');
	});

	it('flattens a field table into label: value lines', () => {
		expect(htmlToText('<table><tr><td>Studio</td><td>Yoga X</td></tr></table>')).toBe(
			'Studio: Yoga X',
		);
	});

	it('converts <br> to newlines and trims the runs', () => {
		expect(htmlToText('<p>a<br/>b<br><br>c</p>')).toBe('a\nb\n\nc');
	});
});

describe('renderText', () => {
	it('renders the button as a labelled URL rather than a bare word', () => {
		const text = renderText({
			headingHtml: 'Sign in',
			cta: { label: 'Sign in', url: 'https://x.test/l?t=abc' },
		});
		expect(text).toContain('Sign in: https://x.test/l?t=abc');
	});

	it('leaves out the card chrome entirely', () => {
		const text = renderText({ bodyHtml: '<p>Hello</p>', brand: 'x.test' });
		expect(text).not.toContain('<');
		expect(text).not.toContain('style');
		expect(text).toBe('Hello\n\n--\nx.test');
	});
});
