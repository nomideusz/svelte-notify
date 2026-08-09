import { describe, it, expect, vi, afterEach } from 'vitest';
import { createMailer, isTransient, type MailerConfig } from './index.js';
import type { Transporter } from 'nodemailer';

// Retry classification for the shared Stalwart relay. The one that matters is
// 454: Stalwart returns it while its Postgres auth directory reconnects, and a
// dropped magic link there is a silent login failure.
describe('isTransient', () => {
  it('retries 4xx — 454 auth-directory blip is the whole reason this exists', () => {
    expect(isTransient({ responseCode: 454 })).toBe(true);
    expect(isTransient({ responseCode: 421 })).toBe(true);
  });

  it('does not retry permanent 5xx (bad mailbox, rejected relay)', () => {
    expect(isTransient({ responseCode: 550 })).toBe(false);
    expect(isTransient({ responseCode: 535 })).toBe(false);
  });

  it('retries connection-level errors, which carry no responseCode', () => {
    expect(isTransient({ code: 'ECONNRESET' })).toBe(true);
    expect(isTransient({ code: 'ETIMEDOUT' })).toBe(true);
  });

  it('does not retry anything else — an unconfigured throw must surface', () => {
    expect(isTransient(new Error('SMTP transport not configured'))).toBe(false);
    expect(isTransient({ code: 'EAUTH' })).toBe(false);
    expect(isTransient(undefined)).toBe(false);
  });
});

type SendMail = ReturnType<typeof vi.fn>;

function fakeTransport(sendMail: SendMail, verify: ReturnType<typeof vi.fn> = vi.fn()) {
  const factory = vi.fn(() => ({ sendMail, verify }) as unknown as Transporter);
  return { factory, verify };
}

const CONFIGURED: MailerConfig = {
  host: 'smtp.test',
  user: 'u',
  pass: 'p',
  from: 'noreply@test.example',
};

const MSG = { to: 'a@b.c', subject: 'S', html: '<p>hi</p>' };

const silentLog = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('createMailer — unconfigured', () => {
  it('throws by default and never constructs a transporter', async () => {
    const { factory } = fakeTransport(vi.fn());
    const mailer = createMailer({ from: 'x@y.z', createTransport: factory, log: silentLog });
    expect(mailer.isConfigured()).toBe(false);
    await expect(mailer.send(MSG)).rejects.toThrow(/not configured/);
    expect(factory).not.toHaveBeenCalled();
  });

  it('with onUnconfigured: callback gets the message, send resolves false', async () => {
    const onUnconfigured = vi.fn();
    const mailer = createMailer({ from: 'x@y.z', onUnconfigured, log: silentLog });
    await expect(mailer.send(MSG)).resolves.toBe(false);
    expect(onUnconfigured).toHaveBeenCalledWith(MSG);
  });

  it('canSend is false without touching verify', async () => {
    const { factory, verify } = fakeTransport(vi.fn());
    const mailer = createMailer({ from: 'x@y.z', createTransport: factory, log: silentLog });
    await expect(mailer.canSend()).resolves.toBe(false);
    expect(verify).not.toHaveBeenCalled();
  });
});

describe('createMailer — retry', () => {
  it('transient twice then success: resolves true after 3 calls with 800/1600ms backoff', async () => {
    vi.useFakeTimers();
    const sendMail = vi
      .fn()
      .mockRejectedValueOnce({ responseCode: 454 })
      .mockRejectedValueOnce({ code: 'ECONNRESET' })
      .mockResolvedValueOnce({ messageId: 'm3' });
    const { factory } = fakeTransport(sendMail);
    const mailer = createMailer({ ...CONFIGURED, createTransport: factory, log: silentLog });

    const p = mailer.send(MSG);
    // Lower bounds too: retries must NOT fire before the full delay elapses —
    // a shortened/removed backoff hammers a recovering relay.
    await vi.advanceTimersByTimeAsync(799);
    expect(sendMail).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1); // 800ms → attempt 2
    expect(sendMail).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1599);
    expect(sendMail).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1); // 1600ms → attempt 3
    await expect(p).resolves.toBe(true);
    expect(sendMail).toHaveBeenCalledTimes(3);
  });

  it('permanent 550 throws on attempt 1, no retry', async () => {
    const sendMail = vi.fn().mockRejectedValue({ responseCode: 550 });
    const { factory } = fakeTransport(sendMail);
    const mailer = createMailer({ ...CONFIGURED, createTransport: factory, log: silentLog });
    await expect(mailer.send(MSG)).rejects.toEqual({ responseCode: 550 });
    expect(sendMail).toHaveBeenCalledTimes(1);
  });

  it('transient three times rethrows after the final attempt', async () => {
    vi.useFakeTimers();
    const sendMail = vi.fn().mockRejectedValue({ responseCode: 454 });
    const { factory } = fakeTransport(sendMail);
    const mailer = createMailer({ ...CONFIGURED, createTransport: factory, log: silentLog });

    const p = mailer.send(MSG);
    const expectation = expect(p).rejects.toEqual({ responseCode: 454 });
    await vi.advanceTimersByTimeAsync(800 + 1600);
    await expectation;
    expect(sendMail).toHaveBeenCalledTimes(3);
  });
});

describe('createMailer — envelope and transport options', () => {
  it('fromName renders as {name, address}; per-message replyTo beats config', async () => {
    const sendMail = vi.fn().mockResolvedValue({ messageId: 'm' });
    const { factory } = fakeTransport(sendMail);
    const mailer = createMailer({
      ...CONFIGURED,
      fromName: 'Test "Quoted" Name',
      replyTo: 'default@r.pl',
      createTransport: factory,
      log: silentLog,
    });

    await mailer.send({ ...MSG, to: ['a@b.c', 'd@e.f'], text: 'plain', replyTo: 'msg@r.pl' });
    expect(sendMail).toHaveBeenCalledWith({
      from: { name: 'Test "Quoted" Name', address: CONFIGURED.from },
      to: ['a@b.c', 'd@e.f'],
      replyTo: 'msg@r.pl',
      subject: 'S',
      html: '<p>hi</p>',
      text: 'plain',
    });

    await mailer.send(MSG);
    expect(sendMail).toHaveBeenLastCalledWith(
      expect.objectContaining({ replyTo: 'default@r.pl' }),
    );
  });

  it('secure defaults true at 465, false at 2465, overridable; tlsServername lands in options', async () => {
    const cases: Array<[Partial<MailerConfig>, Record<string, unknown>]> = [
      [{}, { port: 465, secure: true }],
      [{ port: 2465 }, { port: 2465, secure: false }],
      [{ port: 2465, secure: true }, { port: 2465, secure: true }],
      [
        { tlsServername: 'mail.zaur.app' },
        { port: 465, secure: true, tls: { servername: 'mail.zaur.app' } },
      ],
    ];
    for (const [overrides, expected] of cases) {
      const sendMail = vi.fn().mockResolvedValue({});
      const { factory } = fakeTransport(sendMail);
      const mailer = createMailer({
        ...CONFIGURED,
        ...overrides,
        createTransport: factory,
        log: silentLog,
      });
      await mailer.send(MSG);
      expect(factory).toHaveBeenCalledWith(expect.objectContaining(expected));
    }
  });

  it('constructs the transporter exactly once across sends', async () => {
    const sendMail = vi.fn().mockResolvedValue({});
    const { factory } = fakeTransport(sendMail);
    const mailer = createMailer({ ...CONFIGURED, createTransport: factory, log: silentLog });
    await mailer.send(MSG);
    await mailer.send(MSG);
    expect(factory).toHaveBeenCalledTimes(1);
  });
});

describe('createMailer — canSend cache', () => {
  it('verify-ok is cached within the 60s TTL, re-verified after expiry', async () => {
    vi.useFakeTimers();
    const verify = vi.fn().mockResolvedValue(true);
    const { factory } = fakeTransport(vi.fn(), verify);
    const mailer = createMailer({ ...CONFIGURED, createTransport: factory, log: silentLog });

    await expect(mailer.canSend()).resolves.toBe(true);
    await expect(mailer.canSend()).resolves.toBe(true);
    expect(verify).toHaveBeenCalledTimes(1); // cached

    await vi.advanceTimersByTimeAsync(61_000);
    await expect(mailer.canSend()).resolves.toBe(true);
    expect(verify).toHaveBeenCalledTimes(2); // TTL expired → re-verified
  });

  it('verify failure is cached as false', async () => {
    vi.useFakeTimers();
    const verify = vi.fn().mockRejectedValue(new Error('down'));
    const { factory } = fakeTransport(vi.fn(), verify);
    const mailer = createMailer({ ...CONFIGURED, createTransport: factory, log: silentLog });

    await expect(mailer.canSend()).resolves.toBe(false);
    await expect(mailer.canSend()).resolves.toBe(false);
    expect(verify).toHaveBeenCalledTimes(1);
  });
});
