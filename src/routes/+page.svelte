<script lang="ts">
	import {
		bookingConfirmationTemplate,
		cancellationTemplate,
		providerNotificationTemplate,
		reminderTemplate,
		scheduleChangedTemplate,
		type NotifyLang,
	} from '$lib/index.js';

	const TEMPLATES = {
		'Booking confirmation': bookingConfirmationTemplate,
		'Cancellation': cancellationTemplate,
		'Provider notification': providerNotificationTemplate,
		'Reminder': reminderTemplate,
		'Schedule changed': scheduleChangedTemplate,
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
		// Schedule-change-only field; likewise harmless elsewhere
		previousStartTime: new Date('2026-09-13T18:00:00Z'),
	});

	const rendered = $derived(TEMPLATES[template](data));
</script>

<svelte:head>
	<title>@nomideusz/svelte-notify — email templates</title>
	<meta
		name="description"
		content="Transactional email templates for Svelte 5 apps — booking confirmation, cancellation, provider notification, reminder, schedule change. English, Polish and Ukrainian."
	/>
</svelte:head>

<main>
	<header>
		<h1>@nomideusz/svelte-notify</h1>
		<p class="lede">
			Transactional email templates as plain functions: pass the booking, get back
			<code>&lbrace; subject, html, text &rbrace;</code>. Localized in English, Polish and Ukrainian, with
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
		<details class="textpart">
			<summary>text/plain alternative</summary>
			<pre>{rendered.text}</pre>
		</details>
	</section>

	<section class="usage">
		<h2>Usage</h2>
		<pre><code>{`import { bookingConfirmationTemplate } from '@nomideusz/svelte-notify';

const { subject, html, text } = bookingConfirmationTemplate({
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

await sendMail({ to: guest.email, subject, html, text });`}</code></pre>
		<p class="note">
			The templates are pure functions — no transport, no side effects. Every one returns a
			<code>text/plain</code> alternative alongside the HTML. Send the result with whatever mailer
			you already use, or with the SMTP transport below. Date and money formatting comes from
			<a href="https://www.npmjs.com/package/@nomideusz/svelte-i18n">@nomideusz/svelte-i18n</a>
			(<code>formatDateTime</code>, <code>formatMoney</code>), so pages and emails share one
			implementation.
		</p>
	</section>

	<section class="usage">
		<h2>Bind once with createNotifier</h2>
		<pre><code>{`import { createNotifier } from '@nomideusz/svelte-notify';

// Once, next to your mailer setup:
const notify = createNotifier({
  brand: 'szkolyjogi.pl',
  theme: { accent: '#3f6f4f', radius: '6px' },
  language: 'pl',                    // default when a message carries none
  timeZone: 'Europe/Warsaw',         // pin it — all times render in this zone
  overrides: (lang) => VOICE[lang],  // house voice, resolved per language
});

// Call sites pass only what varies per message:
notify.bookingConfirmation(data);    // also: providerNotification,
notify.reminder(data);               // cancellation, scheduleChanged,
notify.actionLink({ ... });          // and the action-link shell below`}</code></pre>
		<p class="note">
			Per-call values win over the config, key by key — language stays per-recipient even when the
			app has a default.
		</p>
	</section>

	<section class="usage">
		<h2>One-off emails: the shared shell</h2>
		<pre><code>{`import { actionLinkTemplate, escapeHtml } from '@nomideusz/svelte-notify';

// Magic link, password reset, invite — the copy is yours, the shell isn't:
const { subject, html, text } = actionLinkTemplate({
  subject: 'Sign in to szkolyjogi.pl',        // plain text, never HTML
  headingHtml: 'Sign in',
  bodyHtml: '<p>Hi ' + escapeHtml(user.name) + ', this link signs you in.</p>',
  cta: { label: 'Sign in', url: magicLink },  // label & url escaped for you
  footnotesHtml: ['The link expires in 15 minutes.'],
  brand: 'szkolyjogi.pl',
});`}</code></pre>
		<p class="note">
			The escaping contract: templates are trusted, params are not. Fields suffixed
			<code>Html</code> carry deliberate markup and render as-is — run untrusted values (names
			typed into public forms) through <code>escapeHtml</code> before composing them in. Plain
			fields (<code>brand</code>, the <code>cta</code>) are escaped for you.
			<code>renderLayout</code>, <code>renderText</code> and <code>htmlToText</code> are exported
			too if you want the card without a subject.
		</p>
	</section>

	<section class="usage">
		<h2>Sending: SMTP transport (server-side)</h2>
		<pre><code>{`// Server only — needs the optional nodemailer peer: pnpm add nodemailer
import { createMailer } from '@nomideusz/svelte-notify/transport';

const mailer = createMailer({
  host: env.SMTP_HOST,          // any of host/user/pass missing ⇒ send()
  user: env.SMTP_USER,          // throws (safe default); pass onUnconfigured
  pass: env.SMTP_PASS,          // to log-and-skip instead
  port: 465,                    // default; secure defaults to port === 465
  from: 'noreply@example.com',
  fromName: 'szkolyjogi.pl',    // sent as { name, address }
  replyTo: 'hello@example.com',
});

await mailer.send({ to: data.guestEmail, ...notify.bookingConfirmation(data) });

await mailer.canSend();         // transporter.verify(), cached for 60 s`}</code></pre>
		<p class="note">
			Transient failures — 4xx SMTP responses and connection errors — are retried with
			800&nbsp;ms then 1600&nbsp;ms backoff; permanent 5xx is not. Only the
			<code>/transport</code> subpath imports nodemailer, so the main entry stays pure and
			browser-safe.
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
	.textpart {
		border-top: 1px solid #e6e4df;
	}
	.textpart summary {
		padding: 0.6rem 1rem;
		font-size: 0.8rem;
		color: #666;
		cursor: pointer;
	}
	.textpart pre {
		margin: 0;
		border-radius: 0;
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
		.textpart {
			border-color: #33333a;
		}
		.lede,
		.note,
		.textpart summary {
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
