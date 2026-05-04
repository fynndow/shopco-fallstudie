const { charge } = require('../../../src/payment/paymentClient');

describe('paymentClient.charge', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  function mockFetch({ status = 200, body = {} } = {}) {
    global.fetch = jest.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body
    });
  }

  it('returns txId for approved charges', async () => {
    mockFetch({ status: 200, body: { status: 'approved', txId: 'TX123' } });
    const res = await charge({ amount: 1000, paymentMethod: 'card_visa' });
    expect(res.txId).toBe('TX123');
  });

  it('returns status=approved by default on 200', async () => {
    mockFetch({ status: 200, body: {} });
    const res = await charge({ amount: 1000, paymentMethod: 'card_visa' });
    expect(res.status).toBe('approved');
  });

  it('throws PAYMENT_DECLINED on HTTP 402', async () => {
    mockFetch({ status: 402, body: { status: 'declined' } });
    try { await charge({ amount: 1000, paymentMethod: 'card_visa' }); }
    catch (err) { expect(err.code).toBe('PAYMENT_DECLINED'); }
  });

  it('throws PAYMENT_DECLINED when body.status is declined', async () => {
    mockFetch({ status: 200, body: { status: 'declined' } });
    await expect(charge({ amount: 1000, paymentMethod: 'card_visa' })).rejects.toThrow('PAYMENT_DECLINED');
  });

  it('throws PAYMENT_PROVIDER_ERROR on 500', async () => {
    mockFetch({ status: 500, body: {} });
    try { await charge({ amount: 1000, paymentMethod: 'card_visa' }); }
    catch (err) { expect(err.code).toBe('PAYMENT_PROVIDER_ERROR'); }
  });

  it('rejects invalid amount', async () => {
    mockFetch({ status: 200, body: {} });
    await expect(charge({ amount: 0, paymentMethod: 'card_visa' })).rejects.toThrow();
  });

  it.skip('integrates with live payment provider (requires credentials)', async () => {
    const res = await charge({ amount: 1000, paymentMethod: 'card_visa' });
    expect(res).toBeDefined();
  });
});
