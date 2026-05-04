const config = require('../config/env');

async function sendPasswordResetEmail({ to, resetUrl }) {
  const res = await fetch(`${config.emailServiceUrl}/send`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      to,
      template: 'password-reset',
      variables: { resetUrl }
    })
  });
  if (!res.ok) {
    const err = new Error('email service failed');
    err.code = 'EMAIL_FAILED';
    err.statusCode = 502;
    throw err;
  }
  return res.json();
}

async function sendOrderConfirmation({ to, orderId, total }) {
  const res = await fetch(`${config.emailServiceUrl}/send`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      to,
      template: 'order-confirmation',
      variables: { orderId, total }
    })
  });
  if (!res.ok) {
    const err = new Error('email service failed');
    err.code = 'EMAIL_FAILED';
    err.statusCode = 502;
    throw err;
  }
  return res.json();
}

module.exports = { sendPasswordResetEmail, sendOrderConfirmation };
