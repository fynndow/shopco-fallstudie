const request = require('supertest');
const createApp = require('../../src/app');
const prisma = require('../../src/db/prisma');
const { resetDatabase, createTestUser } = require('../setup/testDatabase');
const { enableFetchMocking, resetFetchMocks, disableFetchMocking, mockPost } = require('../setup/mockFetch');
const config = require('../../src/config/env');

const app = createApp();

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
});

describe('POST /api/auth/register', () => {
  it('registers a new user and returns 201 with token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'neu@shopco.de', password: 'password123', name: 'Neu' });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('neu@shopco.de');
  });

  it('returns 409 EMAIL_EXISTS for duplicate email', async () => {
    await createTestUser({ email: 'dup@shopco.de' });
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'dup@shopco.de', password: 'password123', name: 'Dup' });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('EMAIL_EXISTS');
  });

  it('rejects invalid email with 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'password123', name: 'Max' });
    expect(res.status).toBe(400);
  });

  it('rejects short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'x@y.de', password: 'short', name: 'Max' });
    expect(res.status).toBe(400);
  });

  it('persists the user in the database', async () => {
    await request(app).post('/api/auth/register').send({ email: 'saved@shopco.de', password: 'password123', name: 'Max' });
    const user = await prisma.user.findUnique({ where: { email: 'saved@shopco.de' } });
    expect(user).not.toBeNull();
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await createTestUser({ email: 'login@shopco.de' });
  });

  it('returns 200 and JWT for valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@shopco.de', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('returns 401 INVALID_CREDENTIALS for wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@shopco.de', password: 'wrong-password' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('INVALID_CREDENTIALS');
  });

  it('returns 401 for unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@shopco.de', password: 'password123' });
    expect(res.status).toBe(401);
  });

  it('returns 401 for malformed email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'not-an-email', password: 'password123' });
    expect(res.status).toBe(401);
  });

  it('treats email case-insensitively', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'LOGIN@shopco.de', password: 'password123' });
    expect(res.status).toBe(200);
  });
});

describe('GET /api/auth/me', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 with malformed token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer not-a-jwt');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('INVALID_TOKEN');
  });

  it('returns 401 TOKEN_EXPIRED with expired token', async () => {
    const jwt = require('jsonwebtoken');
    const expiredToken = jwt.sign({ sub: 'u-1' }, config.jwtSecret, { expiresIn: -1 });
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('TOKEN_EXPIRED');
  });

  it('returns 200 with user payload for valid token', async () => {
    await createTestUser({ email: 'me@shopco.de' });
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'me@shopco.de', password: 'password123' });
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loginRes.body.token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('me@shopco.de');
  });
});

describe('POST /api/auth/forgot-password', () => {
  it('returns 202 and calls the email service', async () => {
    await createTestUser({ email: 'reset@shopco.de' });
    mockPost(config.emailServiceUrl, '/send', { status: 200, body: { messageId: 'email-1' } });
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'reset@shopco.de' });
    expect(res.status).toBe(202);
  });

  it('returns 202 for unknown email (no leak)', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'unknown@shopco.de' });
    expect(res.status).toBe(202);
  });

  it('creates a reset token record', async () => {
    const user = await createTestUser({ email: 'reset2@shopco.de' });
    mockPost(config.emailServiceUrl, '/send', { status: 200, body: { ok: true } });
    await request(app).post('/api/auth/forgot-password').send({ email: 'reset2@shopco.de' });
    const tokens = await prisma.passwordResetToken.findMany({ where: { userId: user.id } });
    expect(tokens.length).toBe(1);
  });
});

describe('POST /api/auth/reset-password', () => {
  it('rejects invalid reset token', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'invalid-token-xxxx', newPassword: 'new-password-123' });
    expect(res.status).toBe(400);
  });

  it('rejects expired reset token', async () => {
    const user = await createTestUser({ email: 'exp@shopco.de' });
    const crypto = require('crypto');
    const raw = 'raw-token-1234567890';
    const tokenHash = crypto.createHash('sha256').update(raw).digest('hex');
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() - 1000)
      }
    });
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: raw, newPassword: 'new-password-123' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('RESET_TOKEN_EXPIRED');
  });

  it('succeeds with a valid token', async () => {
    const user = await createTestUser({ email: 'ok@shopco.de' });
    const crypto = require('crypto');
    const raw = 'valid-token-1234567890';
    const tokenHash = crypto.createHash('sha256').update(raw).digest('hex');
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 60_000)
      }
    });
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: raw, newPassword: 'new-password-123' });
    expect(res.status).toBe(200);
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ok@shopco.de', password: 'new-password-123' });
    expect(login.status).toBe(200);
  });
});
