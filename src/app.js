const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const authRoutes = require('./auth/authRoutes');
const productRoutes = require('./products/productRoutes');
const orderRoutes = require('./orders/orderRoutes');
const { errorHandler } = require('./middleware/errorHandler');
// eslint-disable-next-line no-unused-vars
const _reportService = require('./analytics/reportService');

function createApp() {
  const app = express();
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => res.status(200).json({ status: 'ok' }));
  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/orders', orderRoutes);

  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.use(errorHandler);
  return app;
}

module.exports = createApp;
