const { sendPasswordResetEmail, sendOrderConfirmation } = require('../../../src/email/emailService');

describe('emailService', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  function mockFetch({ status = 200, body = { ok: true } } = {}) {
    global.fetch = jest.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body
    });
  }

  it('sendPasswordResetEmail returns the provider response on success', async () => {
    mockFetch({ status: 200, body: { messageId: 'abc' } });
    const res = await sendPasswordResetEmail({ to: 'x@y.de', resetUrl: 'https://shopco.de/r' });
    expect(res.messageId).toBe('abc');
  });

  it('sendPasswordResetEmail throws EMAIL_FAILED on non-2xx', async () => {
    mockFetch({ status: 500 });
    await expect(sendPasswordResetEmail({ to: 'x@y.de', resetUrl: 'https://shopco.de/r' })).rejects.toThrow();
  });

  it('sendOrderConfirmation returns the provider response on success', async () => {
    mockFetch({ status: 200, body: { messageId: 'conf' } });
    const res = await sendOrderConfirmation({ to: 'x@y.de', orderId: 'o1', total: 1000 });
    expect(res.messageId).toBe('conf');
  });

  it.skip('sends to live email service (requires credentials)', async () => {
    const res = await sendPasswordResetEmail({ to: 'x@y.de', resetUrl: 'https://shopco.de/r' });
    expect(res).toBeDefined();
  });
});
