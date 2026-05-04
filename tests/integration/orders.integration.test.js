const request = require('supertest');
const createApp = require('../../src/app');
const prisma = require('../../src/db/prisma');
const { resetDatabase, seedBaselineProducts, createTestUser } = require('../setup/testDatabase');
const { enableFetchMocking, resetFetchMocks, disableFetchMocking, mockPost } = require('../setup/mockFetch');
const { generateToken } = require('../../src/auth/tokenService');
const config = require('../../src/config/env');

const app = createApp();

let testUser;
let testToken;
let productA;
let productD; // stock: 0

beforeAll(() => {
  enableFetchMocking();
});

afterAll(async () => {
  disableFetchMocking();
  await prisma.$disconnect();
});

beforeEach(async () => {
  resetFetchMocks();
  await resetDatabase();
  const products = await seedBaselineProducts();
  productA = products.find((p) => p.sku === 'SKU-A-001');
  productD = products.find((p) => p.sku === 'SKU-D-004');
  testUser = await createTestUser({ email: 'buyer@shopco.de' });
  testToken = generateToken({ id: testUser.id, email: testUser.email });
});

function authHeader() {
  return { Authorization: `Bearer ${testToken}` };
}

function mockPaymentApproved(times = 1) {
  for (let i = 0; i < times; i++) {
    mockPost(config.paymentProviderUrl, '/charge', {
      status: 200,
      body: { status: 'approved', txId: `TX-${Date.now()}-${i}` }
    });
  }
}

function mockPaymentDeclined() {
  mockPost(config.paymentProviderUrl, '/charge', {
    status: 402,
    body: { status: 'declined' }
  });
}

function mockEmail(times = 1) {
  for (let i = 0; i < times; i++) {
    mockPost(config.emailServiceUrl, '/send', { status: 200, body: { ok: true } });
  }
}

describe('GET /api/orders/cart', () => {
  it('returns an empty cart for a new user', async () => {
    const res = await request(app).get('/api/orders/cart').set(authHeader());
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/orders/cart');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/orders/cart/items', () => {
  it('adds a product to the cart', async () => {
    const res = await request(app)
      .post('/api/orders/cart/items')
      .set(authHeader())
      .send({ productId: productA.id, quantity: 2 });
    expect(res.status).toBe(200);
    expect(res.body.items[0].quantity).toBe(2);
  });

  it('merges quantity when adding the same product twice', async () => {
    await request(app).post('/api/orders/cart/items').set(authHeader()).send({ productId: productA.id, quantity: 1 });
    const res = await request(app).post('/api/orders/cart/items').set(authHeader()).send({ productId: productA.id, quantity: 2 });
    expect(res.body.items[0].quantity).toBe(3);
  });

  it('returns 409 OUT_OF_STOCK when product is out of stock', async () => {
    const res = await request(app)
      .post('/api/orders/cart/items')
      .set(authHeader())
      .send({ productId: productD.id, quantity: 1 });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('OUT_OF_STOCK');
  });

  it('returns 404 for unknown product', async () => {
    const res = await request(app)
      .post('/api/orders/cart/items')
      .set(authHeader())
      .send({ productId: '00000000-0000-0000-0000-000000000000', quantity: 1 });
    expect(res.status).toBe(404);
  });

  it('rejects non-positive quantity', async () => {
    const res = await request(app)
      .post('/api/orders/cart/items')
      .set(authHeader())
      .send({ productId: productA.id, quantity: 0 });
    expect(res.status).toBe(400);
  });

  it('returns 409 when requested qty exceeds stock', async () => {
    const res = await request(app)
      .post('/api/orders/cart/items')
      .set(authHeader())
      .send({ productId: productA.id, quantity: 9999 });
    expect(res.status).toBe(409);
  });
});

describe('DELETE /api/orders/cart', () => {
  it('clears all items from the cart', async () => {
    await request(app).post('/api/orders/cart/items').set(authHeader()).send({ productId: productA.id, quantity: 2 });
    const res = await request(app).delete('/api/orders/cart').set(authHeader());
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
  });

  it('is idempotent on an empty cart', async () => {
    const res = await request(app).delete('/api/orders/cart').set(authHeader());
    expect(res.status).toBe(200);
  });
});

describe('POST /api/orders/checkout', () => {
  async function addToCart(productId, quantity) {
    await request(app).post('/api/orders/cart/items').set(authHeader()).send({ productId, quantity });
  }

  it('returns 201 and orderId on success (matches fallstudie)', async () => {
    mockPaymentApproved();
    mockEmail();
    await addToCart(productA.id, 1);
    const res = await request(app)
      .post('/api/orders/checkout')
      .set(authHeader())
      .send({ paymentMethod: 'card_visa' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('orderId');
  });

  it('returns 402 PAYMENT_DECLINED when payment is declined', async () => {
    mockPaymentDeclined();
    await addToCart(productA.id, 1);
    const res = await request(app)
      .post('/api/orders/checkout')
      .set(authHeader())
      .send({ paymentMethod: 'card_visa' });
    expect(res.status).toBe(402);
    expect(res.body.error).toBe('PAYMENT_DECLINED');
  });

  it('persists the order in the database', async () => {
    mockPaymentApproved();
    mockEmail();
    await addToCart(productA.id, 2);
    const res = await request(app).post('/api/orders/checkout').set(authHeader()).send({ paymentMethod: 'card_visa' });
    const order = await prisma.order.findUnique({ where: { id: res.body.orderId }, include: { items: true } });
    expect(order.items.length).toBe(1);
    expect(order.items[0].quantity).toBe(2);
  });

  it('decrements product stock after checkout', async () => {
    mockPaymentApproved();
    mockEmail();
    const before = (await prisma.product.findUnique({ where: { id: productA.id } })).stock;
    await addToCart(productA.id, 3);
    await request(app).post('/api/orders/checkout').set(authHeader()).send({ paymentMethod: 'card_visa' });
    const after = (await prisma.product.findUnique({ where: { id: productA.id } })).stock;
    expect(after).toBe(before - 3);
  });

  it('clears the cart after successful checkout', async () => {
    mockPaymentApproved();
    mockEmail();
    await addToCart(productA.id, 1);
    await request(app).post('/api/orders/checkout').set(authHeader()).send({ paymentMethod: 'card_visa' });
    const cartRes = await request(app).get('/api/orders/cart').set(authHeader());
    expect(cartRes.body.items).toEqual([]);
  });

  it('does not create an order when payment fails', async () => {
    mockPaymentDeclined();
    await addToCart(productA.id, 1);
    await request(app).post('/api/orders/checkout').set(authHeader()).send({ paymentMethod: 'card_visa' });
    const orders = await prisma.order.findMany({ where: { userId: testUser.id } });
    expect(orders.length).toBe(0);
  });

  it('rejects checkout with empty cart', async () => {
    const res = await request(app).post('/api/orders/checkout').set(authHeader()).send({ paymentMethod: 'card_visa' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('EMPTY_CART');
  });

  it('rejects checkout without paymentMethod', async () => {
    await addToCart(productA.id, 1);
    const res = await request(app).post('/api/orders/checkout').set(authHeader()).send({});
    expect(res.status).toBe(400);
  });

  it('applies a valid coupon code', async () => {
    mockPaymentApproved();
    mockEmail();
    await addToCart(productA.id, 1);
    const res = await request(app)
      .post('/api/orders/checkout')
      .set(authHeader())
      .send({ paymentMethod: 'card_visa', couponCode: 'WELCOME10' });
    expect(res.status).toBe(201);
    const order = await prisma.order.findUnique({ where: { id: res.body.orderId } });
    expect(order.discountValue).toBeGreaterThan(0);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).post('/api/orders/checkout').send({ paymentMethod: 'card_visa' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/orders', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/orders');
    expect(res.status).toBe(401);
  });

  it('returns an empty list for new users', async () => {
    const res = await request(app).get('/api/orders').set(authHeader());
    expect(res.status).toBe(200);
    expect(res.body.orders).toEqual([]);
  });

  it('lists orders after a successful checkout', async () => {
    mockPaymentApproved();
    mockEmail();
    await request(app).post('/api/orders/cart/items').set(authHeader()).send({ productId: productA.id, quantity: 1 });
    await request(app).post('/api/orders/checkout').set(authHeader()).send({ paymentMethod: 'card_visa' });
    const res = await request(app).get('/api/orders').set(authHeader());
    expect(res.body.orders.length).toBe(1);
  });

  it('sorts orders by most recent first', async () => {
    mockPaymentApproved(2);
    mockEmail(2);
    await request(app).post('/api/orders/cart/items').set(authHeader()).send({ productId: productA.id, quantity: 1 });
    await request(app).post('/api/orders/checkout').set(authHeader()).send({ paymentMethod: 'card_visa' });
    await new Promise((r) => setTimeout(r, 10));
    await request(app).post('/api/orders/cart/items').set(authHeader()).send({ productId: productA.id, quantity: 1 });
    await request(app).post('/api/orders/checkout').set(authHeader()).send({ paymentMethod: 'card_visa' });
    const res = await request(app).get('/api/orders').set(authHeader());
    const dates = res.body.orders.map((o) => new Date(o.createdAt).getTime());
    expect(dates[0]).toBeGreaterThanOrEqual(dates[1]);
  });
});

describe('GET /api/orders/:id', () => {
  it('returns 404 for unknown order id', async () => {
    const res = await request(app).get('/api/orders/00000000-0000-0000-0000-000000000000').set(authHeader());
    expect(res.status).toBe(404);
  });

  it('returns the order for its owner', async () => {
    mockPaymentApproved();
    mockEmail();
    await request(app).post('/api/orders/cart/items').set(authHeader()).send({ productId: productA.id, quantity: 1 });
    const checkout = await request(app).post('/api/orders/checkout').set(authHeader()).send({ paymentMethod: 'card_visa' });
    const res = await request(app).get(`/api/orders/${checkout.body.orderId}`).set(authHeader());
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(checkout.body.orderId);
  });

  it('returns 404 if order belongs to a different user', async () => {
    mockPaymentApproved();
    mockEmail();
    await request(app).post('/api/orders/cart/items').set(authHeader()).send({ productId: productA.id, quantity: 1 });
    const checkout = await request(app).post('/api/orders/checkout').set(authHeader()).send({ paymentMethod: 'card_visa' });

    const otherUser = await createTestUser({ email: 'other@shopco.de' });
    const otherToken = generateToken({ id: otherUser.id, email: otherUser.email });
    const res = await request(app).get(`/api/orders/${checkout.body.orderId}`).set('Authorization', `Bearer ${otherToken}`);
    expect(res.status).toBe(404);
  });
});
