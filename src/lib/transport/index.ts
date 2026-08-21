/**
 * SMTP transport — `@nomideusz/svelte-notify/transport`.
 *
 * The nodemailer setup + retry logic both source apps had duplicated, bound
 * once per app. `nodemailer` is an OPTIONAL peer dependency: only this subpath
 * imports it, so the main entry stays pure and browser-safe.
 *
 * Env reading stays in the app — `$env/dynamic/private` is SvelteKit-specific
 * and each app maps its own variable names (`SMTP_PASS` vs `SMTP_PASSWORD`)
 * onto this config object.
 *
 * ## Unconfigured behavior — read this before passing `onUnconfigured`
 *
 * Without `onUnconfigured`, `send()` THROWS when host/user/pass are missing.
 * That is the safe default: callers that mark database rows as "sent" right
 * after `await send(...)` (reminders, waitlist notifies) must not have an
 * unconfigured deploy silently mark mail as delivered. Passing
 * `onUnconfigured` opts into log-and-skip: the callback fires per message and
 * `send()` resolves `false`.
 */
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface SendInput {
  to: string | string[];
  subject: string;
  html: string;
  /** `text/plain` alternative — every packaged template returns one. */
  text?: string;
  /** Overrides the mailer-level `replyTo` for this message. */
  replyTo?: string;
  /**
   * Overrides the mailer-level `from` (and `fromName`) for this message —
   * for a sender the authenticated account owns but the mailer isn't bound to,
   * e.g. a sub-address that routes replies back to one inbox.
   */
  from?: string;
  fromName?: string;
  /**
   * SMTP envelope sender, when it must differ from the `From` header (a
   * sub-address is a legitimate `From` but many servers refuse it as MAIL
   * FROM). Absent ⇒ nodemailer derives the envelope from the header, which is
   * what every existing caller gets.
   */
  envelopeFrom?: string;
}

export interface MailerLog {
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}

export interface MailerConfig {
  /** Any of host/user/pass missing ⇒ the mailer is unconfigured. */
  host?: string;
  user?: string;
  pass?: string;
  /** Default 465. (Railway blocks standard SMTP ports — use e.g. 2465 there.) */
  port?: number;
  /** Default: `port === 465` (implicit TLS). */
  secure?: boolean;
  /** Sets nodemailer's `tls.servername` (SNI for proxied hosts). */
  tlsServername?: string;
  /** Sender address, e.g. 'noreply@example.com'. */
  from: string;
  /** Display name; sent as `{ name, address }` so quoting is nodemailer's problem. */
  fromName?: string;
  /** Default Reply-To; a per-message `replyTo` wins. */
  replyTo?: string;
  /**
   * ABSENT ⇒ `send()` throws when unconfigured (safe default — see module doc).
   * PRESENT ⇒ the callback fires (per message) and `send()` resolves `false`.
   */
  onUnconfigured?: (msg: SendInput) => void;
  /** Defaults to console. Pass a structured logger to route transport logs. */
  log?: Partial<MailerLog>;
  /** Test seam; defaults to `nodemailer.createTransport`. */
  createTransport?: (options: Record<string, unknown>) => Transporter;
}

export interface Mailer {
  /**
   * `true` = sent, `false` = skipped (unconfigured, with `onUnconfigured` set).
   * Rejects when a configured send fails after retries.
   */
  send(msg: SendInput): Promise<boolean>;
  /**
   * Can we send mail at all right now? `false` when unconfigured, otherwise
   * `transporter.verify()` cached for 60s. Deliberately says nothing about any
   * recipient: callers that must not reveal whether an address is known ask
   * this BEFORE looking the address up, so an SMTP outage reads the same for
   * every address instead of becoming an existence oracle. A cached negative
   * can lag a recovery by up to a minute.
   */
  canSend(): Promise<boolean>;
  isConfigured(): boolean;
}

// Transient SMTP failures worth retrying: 4xx responses (e.g. Stalwart's
// `454 Temporary authentication failure` while its auth directory reconnects)
// and connection-level errors. Permanent 5xx is not retried; neither is EAUTH.
export function isTransient(error: unknown): boolean {
  const e = error as { responseCode?: number; code?: string };
  if (typeof e?.responseCode === 'number') return e.responseCode >= 400 && e.responseCode < 500;
  return ['ECONNRESET', 'ETIMEDOUT', 'ESOCKET', 'ECONNECTION', 'EDNS', 'ETLS'].includes(
    e?.code ?? '',
  );
}

const MAX_ATTEMPTS = 3;
const VERIFY_TTL_MS = 60_000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));

export function createMailer(config: MailerConfig): Mailer {
  const configured = Boolean(config.host && config.user && config.pass);
  const port = config.port ?? 465;
  const secure = config.secure ?? port === 465;
  const log: MailerLog = {
    info: config.log?.info ?? ((m, c) => console.log(`[mail] ${m}`, c ?? '')),
    warn: config.log?.warn ?? ((m, c) => console.warn(`[mail] ${m}`, c ?? '')),
    error: config.log?.error ?? ((m, c) => console.error(`[mail] ${m}`, c ?? '')),
  };

  let tx: Transporter | null = null;
  function transporter(): Transporter {
    if (!tx) {
      const factory = config.createTransport ?? nodemailer.createTransport;
      tx = factory({
        host: config.host,
        port,
        secure,
        auth: { user: config.user, pass: config.pass },
        ...(config.tlsServername ? { tls: { servername: config.tlsServername } } : {}),
      });
    }
    return tx;
  }

  let verifiedAt = 0;
  let verifyOk = false;

  return {
    isConfigured: () => configured,

    async canSend(): Promise<boolean> {
      if (!configured) return false;
      const now = Date.now();
      if (now - verifiedAt < VERIFY_TTL_MS) return verifyOk;
      try {
        await transporter().verify();
        verifyOk = true;
      } catch (e) {
        log.error('SMTP verify failed', { error: errMsg(e) });
        verifyOk = false;
      }
      verifiedAt = now;
      return verifyOk;
    },

    async send(msg: SendInput): Promise<boolean> {
      if (!configured) {
        if (config.onUnconfigured) {
          config.onUnconfigured(msg);
          return false;
        }
        throw new Error('SMTP transport not configured (host/user/pass missing)');
      }

      const fromAddress = msg.from ?? config.from;
      const fromName = msg.from ? msg.fromName : (msg.fromName ?? config.fromName);
      const envelope = {
        from: fromName ? { name: fromName, address: fromAddress } : fromAddress,
        to: msg.to,
        replyTo: msg.replyTo ?? config.replyTo,
        subject: msg.subject,
        html: msg.html,
        text: msg.text,
        // Only when asked: nodemailer's own derivation is what every caller
        // before this option relied on.
        ...(msg.envelopeFrom
          ? { envelope: { from: msg.envelopeFrom, to: Array.isArray(msg.to) ? msg.to : [msg.to] } }
          : {}),
      };

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
          const info = await transporter().sendMail(envelope);
          log.info('email sent', { to: msg.to, messageId: info?.messageId, attempt });
          return true;
        } catch (e) {
          if (!isTransient(e) || attempt === MAX_ATTEMPTS) {
            log.error('email send failed', {
              to: msg.to,
              subject: msg.subject,
              attempt,
              error: errMsg(e),
            });
            throw e;
          }
          log.warn('transient email failure, retrying', {
            to: msg.to,
            attempt,
            error: errMsg(e),
          });
          await sleep(attempt * 800); // 800ms, then 1600ms
        }
      }
      /* v8 ignore next -- loop always returns or throws */
      return false;
    },
  };
}
