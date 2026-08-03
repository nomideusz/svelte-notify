<script lang="ts">
	import {
		bookingConfirmationTemplate,
		cancellationTemplate,
		providerNotificationTemplate,
		type NotifyLang,
	} from '$lib/index.js';

	const TEMPLATES = {
		'Booking confirmation': bookingConfirmationTemplate,
		'Cancellation': cancellationTemplate,
		'Provider notification': providerNotificationTemplate,
	} as const;

	type TemplateName = keyof typeof TEMPLATES;

	let template = $state<TemplateName>('Booking confirmation');
	let lang = $state<NotifyLang>('en');
	let brand = $state('thebest.travel');
	let withQr = $state(true);

	const data = $derived({
		guestName: 'Anna Kowalska',
		guestEmail: 'anna@example.com',
		serviceName: 'Sunrise Hatha class',
		slotStartTime: new Date('2026-09-14T07:30:00Z'),
		participants: 2,
		totalAmount: 12000, // cents
		currency: 'PLN',
		bookingReference: 'BK-4F92A1',
		providerName: 'Studio Jogi Shanti',
		providerEmail: 'hello@example.com',
		language: lang,
		brand,
		verifyUrl: withQr ? 'https://example.com/verify/BK-4F92A1' : undefined,
		// Cancellation-only fields; harmless on the other templates
		cancelledBy: 'guest' as const,
		refundAmount: 12000,
	});

	const rendered = $derived(TEMPLATES[template](data));
</script>

<svelte:head>
	<title>@nomideusz/svelte-notify — email templates</title>
	<meta
		name="description"
		content="Transactional email templates for Svelte 5 apps — booking confirmation, cancellation, provider notification. English, Polish and Ukrainian."
	/>
</svelte:head>

<main>
	<header>
		<h1>@nomideusz/svelte-notify</h1>
		<p class="lede">
			Transactional email templates as plain functions: pass the booking, get back
			<code>&lbrace; subject, html &rbrace;</code>. Localized in English, Polish and Ukrainian, with
			per-call copy overrides so the app keeps its own voice. QR codes come from
			<a href="https://www.npmjs.com/package/@nomideusz/svelte-qr">@nomideusz/svelte-qr</a>.
		</p>
		<p class="install"><code>pnpm add @nomideusz/svelte-notify</code></p>
	</header>

	<section class="controls">
		<label>
			Template
			<select bind:value={template}>
				{#each Object.keys(TEMPLATES) as name (name)}
					<option value={name}>{name}</option>
				{/each}
			</select>
		</label>

		<label>
			Language
			<select bind:value={lang}>
				<option value="en">English</option>
				<option value="pl">Polski</option>
				<option value="uk">Українська</option>
			</select>
		</label>

		<label>
			Brand
			<input bind:value={brand} placeholder="your-domain.com" />
		</label>

		<label class="check">
			<input type="checkbox" bind:checked={withQr} />
			Include QR code
		</label>
	</section>

	<section class="preview">
		<div class="subject">
			<span class="field">Subject</span>
			<strong>{rendered.subject}</strong>
		</div>
		<iframe title="Email preview" srcdoc={rendered.html}></iframe>
	</section>

	<section class="usage">
		<h2>Usage</h2>
		<pre><code>{`import { bookingConfirmationTemplate } from '@nomideusz/svelte-notify';

const { subject, html } = bookingConfirmationTemplate({
  guestName: 'Anna Kowalska',
  serviceName: 'Sunrise Hatha class',
  slotStartTime: new Date('2026-09-14T07:30:00Z'),
  participants: 2,
  totalAmount: 12000,        // cents
  currency: 'PLN',
  bookingReference: 'BK-4F92A1',
  language: 'pl',            // 'en' | 'pl' | 'uk'; unknown falls back to English
  brand: 'thebest.travel',
  verifyUrl: 'https://example.com/verify/BK-4F92A1',   // inlines a QR code
});

await sendMail({ to: guest.email, subject, html });`}</code></pre>
		<p class="note">
			The templates are pure functions — no transport, no side effects. Send the result with
			whatever mailer you already use.
		</p>
	</section>

	<footer>
		<a href="https://github.com/nomideusz/svelte-notify">GitHub</a>
		<a href="https://www.npmjs.com/package/@nomideusz/svelte-notify">npm</a>
	</footer>
</main>

<style>
	:global(body) {
		margin: 0;
		background: #fbfbfa;
		color: #1a1a1a;
		font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
		line-height: 1.6;
	}
	main {
		max-width: 56rem;
		margin: 0 auto;
		padding: 3rem 1.5rem 4rem;
	}
	h1 {
		font-size: 1.75rem;
		margin: 0 0 0.5rem;
		letter-spacing: -0.02em;
	}
	.lede {
		margin: 0 0 1rem;
		color: #4a4a4a;
		max-width: 46rem;
	}
	.install code,
	code {
		background: #f0efec;
		padding: 0.15em 0.4em;
		border-radius: 4px;
		font-size: 0.9em;
	}
	a {
		color: #1a1a1a;
	}
	.controls {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		margin: 2rem 0 1.25rem;
		padding: 1rem;
		background: #fff;
		border: 1px solid #e6e4df;
		border-radius: 10px;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		font-size: 0.8rem;
		color: #666;
	}
	label.check {
		flex-direction: row;
		align-items: center;
		gap: 0.45rem;
		align-self: end;
		padding-bottom: 0.5rem;
		color: #1a1a1a;
	}
	select,
	input[type='text'],
	input:not([type]) {
		font: inherit;
		font-size: 0.9rem;
		padding: 0.4rem 0.5rem;
		border: 1px solid #d8d5ce;
		border-radius: 6px;
		background: #fff;
	}
	.preview {
		background: #fff;
		border: 1px solid #e6e4df;
		border-radius: 10px;
		overflow: hidden;
	}
	.subject {
		display: flex;
		gap: 0.75rem;
		align-items: baseline;
		padding: 0.85rem 1rem;
		border-bottom: 1px solid #e6e4df;
		background: #faf9f7;
	}
	.field {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #8a8a8a;
	}
	iframe {
		width: 100%;
		height: 34rem;
		border: 0;
		background: #fff;
		display: block;
	}
	.usage {
		margin-top: 2.5rem;
	}
	h2 {
		font-size: 1.1rem;
	}
	pre {
		background: #1e1e1c;
		color: #eceae4;
		padding: 1rem 1.15rem;
		border-radius: 10px;
		overflow-x: auto;
		font-size: 0.82rem;
		line-height: 1.55;
	}
	pre code {
		background: none;
		padding: 0;
		font-size: inherit;
	}
	.note {
		color: #666;
		font-size: 0.9rem;
	}
	footer {
		margin-top: 3rem;
		padding-top: 1.25rem;
		border-top: 1px solid #e6e4df;
		display: flex;
		gap: 1.25rem;
		font-size: 0.9rem;
	}
	@media (prefers-color-scheme: dark) {
		:global(body) {
			background: #17171a;
			color: #e8e6e3;
		}
		a,
		label.check {
			color: #e8e6e3;
		}
		.controls,
		.preview {
			background: #1f1f23;
			border-color: #33333a;
		}
		.subject {
			background: #242429;
			border-color: #33333a;
		}
		.lede,
		.note {
			color: #a8a5a0;
		}
		code {
			background: #2a2a30;
		}
		select,
		input:not([type]) {
			background: #2a2a30;
			border-color: #3d3d45;
			color: #e8e6e3;
		}
		footer {
			border-color: #33333a;
		}
	}
</style>
