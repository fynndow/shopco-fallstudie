const config = require('../config/env');

async function charge({ amount, currency = 'EUR', paymentMethod, idempotencyKey }) {
  if (typeof amount !== 'number' || amount <= 0) {
    const err = new Error('INVALID_AMOUNT');
    err.code = 'INVALID_AMOUNT';
    err.statusCode = 400;
    throw err;
  }
  if (process.env.PAYMENT_MOCK === 'true') {
    return { status: 'approved', txId: 'mock-tx-' + Date.now() };
  }
  const res = await fetch(`${config.paymentProviderUrl}/charge`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(idempotencyKey ? { 'idempotency-key': idempotencyKey } : {})
    },
    body: JSON.stringify({ amount, currency, paymentMethod })
  });
  const body = await res.json().catch(() => ({}));
  if (res.status === 402 || body.status === 'declined') {
    const err = new Error('PAYMENT_DECLINED');
    err.code = 'PAYMENT_DECLINED';
    err.statusCode = 402;
    throw err;
  }
  if (!res.ok) {
    const err = new Error('PAYMENT_PROVIDER_ERROR');
    err.code = 'PAYMENT_PROVIDER_ERROR';
    err.statusCode = 502;
    throw err;
  }
  return { status: body.status || 'approved', txId: body.txId };
}

module.exports = { charge };
