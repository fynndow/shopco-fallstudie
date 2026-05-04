const request = require('supertest');
const createApp = require('../../src/app');
const prisma = require('../../src/db/prisma');
const { resetDatabase, seedBaselineProducts } = require('../setup/testDatabase');

const app = createApp();

beforeAll(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  await resetDatabase();
  await seedBaselineProducts();
});

describe('GET /api/products', () => {
  it('returns HTTP 200 with all active products', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  it('only returns active products', async () => {
    await prisma.product.create({ data: { sku: 'INACTIVE', name: 'Inactive', category: 'buch', price: 100, stock: 1, active: false, description: 'inactive' } });
    const res = await request(app).get('/api/products');
    expect(res.body.items.find((p) => p.sku === 'INACTIVE')).toBeUndefined();
  });

  it('filters by category=X and returns HTTP 200', async () => {
    const res = await request(app).get('/api/products?category=elektronik');
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);
    expect(res.body.items.every((p) => p.category === 'elektronik')).toBe(true);
  });

  it('returns HTTP 200 with empty array for unknown category', async () => {
    const res = await request(app).get('/api/products?category=unknown');
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
  });

  it('filters by price range (min/max)', async () => {
    const res = await request(app).get('/api/products?minPrice=2000&maxPrice=5000');
    expect(res.status).toBe(200);
    expect(res.body.items.every((p) => p.price >= 2000 && p.price <= 5000)).toBe(true);
  });

  it('search query (q) filters by name', async () => {
    const res = await request(app).get('/api/products?q=Produkt%20A');
    expect(res.status).toBe(200);
    expect(res.body.items[0].name).toBe('Produkt A');
  });

  it('paginates results', async () => {
    const res = await request(app).get('/api/products?page=1&limit=2');
    expect(res.body.items.length).toBe(2);
    expect(res.body.page).toBe(1);
  });

  it('supports sorting by price desc', async () => {
    const res = await request(app).get('/api/products?sortBy=price&direction=desc');
    expect(res.body.items[0].price).toBeGreaterThanOrEqual(res.body.items[1].price);
  });

  it('returns total count metadata', async () => {
    const res = await request(app).get('/api/products');
    expect(typeof res.body.total).toBe('number');
  });
});

describe('GET /api/products/:id', () => {
  it('returns the product detail with rating', async () => {
    const product = await prisma.product.findFirst();
    const res = await request(app).get(`/api/products/${product.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(product.id);
    expect(res.body.rating).toBeDefined();
  });

  it('returns 404 for unknown product id', async () => {
    const res = await request(app).get('/api/products/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('PRODUCT_NOT_FOUND');
  });

  it('includes reviews in rating aggregation', async () => {
    const bcrypt = require('bcryptjs');
    const user = await prisma.user.create({ data: { email: 'rev@shopco.de', passwordHash: await bcrypt.hash('p', 4), name: 'Rev' } });
    const product = await prisma.product.findFirst();
    await prisma.review.create({ data: { userId: user.id, productId: product.id, rating: 5 } });
    const res = await request(app).get(`/api/products/${product.id}`);
    expect(res.body.rating.count).toBe(1);
  });
});

describe('GET /api/products/categories', () => {
  it('returns a distinct sorted list of categories', async () => {
    const res = await request(app).get('/api/products/categories');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.categories)).toBe(true);
    const sorted = [...res.body.categories].sort();
    expect(res.body.categories).toEqual(sorted);
  });

  it('only returns categories from active products', async () => {
    await prisma.product.create({ data: { sku: 'INACTIVE-2', name: 'X', category: 'verborgen', price: 100, stock: 1, active: false, description: 'x' } });
    const res = await request(app).get('/api/products/categories');
    expect(res.body.categories.includes('verborgen')).toBe(false);
  });
});
