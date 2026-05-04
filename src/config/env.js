require('dotenv').config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' });

const config = {
  port: Number(process.env.PORT || 3000),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  resetTokenExpiresIn: process.env.RESET_TOKEN_EXPIRES_IN || '15m',
  paymentProviderUrl: process.env.PAYMENT_PROVIDER_URL || 'https://payment.provider.io',
  emailServiceUrl: process.env.EMAIL_SERVICE_URL || 'https://email.provider.io',
  env: process.env.NODE_ENV || 'development'
};

module.exports = config;
