const crypto = require('crypto');
const prisma = require('../db/prisma');
const { hashPassword, comparePassword } = require('./passwordService');
const { generateToken } = require('./tokenService');
const { normalizeEmail, validateRegistration, validateLogin } = require('./validators');
const { sendPasswordResetEmail } = require('../email/emailService');
const { AppError } = require('../middleware/errorHandler');
const config = require('../config/env');

async function registerUser(input) {
  const { ok, errors } = validateRegistration(input);
  if (!ok) throw new AppError('VALIDATION_ERROR', JSON.stringify(errors), 400);

  const email = normalizeEmail(input.email);
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError('EMAIL_EXISTS', 'email already registered', 409);

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: { email, passwordHash, name: input.name.trim() }
  });
  const token = generateToken({ id: user.id, email: user.email });
  return { user: { id: user.id, email: user.email, name: user.name }, token };
}

async function loginUser(input) {
  const { ok } = validateLogin(input);
  if (!ok) throw new AppError('INVALID_CREDENTIALS', 'invalid credentials', 401);

  const email = normalizeEmail(input.email);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError('INVALID_CREDENTIALS', 'invalid credentials', 401);

  const matches = await comparePassword(input.password, user.passwordHash);
  if (!matches) throw new AppError('INVALID_CREDENTIALS', 'invalid credentials', 401);

  const token = generateToken({ id: user.id, email: user.email });
  return { user: { id: user.id, email: user.email, name: user.name }, token };
}

function hashToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function computeResetExpiry(now = new Date()) {
  const m = String(config.resetTokenExpiresIn).match(/^(\d+)([smhd])$/);
  let seconds = 900;
  if (m) {
    const n = Number(m[1]);
    const unit = m[2];
    if (unit === 's') seconds = n;
    else if (unit === 'm') seconds = n * 60;
    else if (unit === 'h') seconds = n * 3600;
    else if (unit === 'd') seconds = n * 86400;
  }
  return new Date(now.getTime() + seconds * 1000);
}

async function requestPasswordReset(emailInput) {
  const email = normalizeEmail(emailInput);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { ok: true };

  const raw = crypto.randomBytes(24).toString('hex');
  const tokenHash = hashToken(raw);
  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt: computeResetExpiry() }
  });
  await sendPasswordResetEmail({ to: email, resetUrl: `https://shopco.de/reset?token=${raw}` });
  return { ok: true };
}

async function confirmPasswordReset({ token, newPassword }) {
  if (typeof token !== 'string' || token.length < 10) {
    throw new AppError('INVALID_RESET_TOKEN', 'invalid token', 400);
  }
  const tokenHash = hashToken(token);
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!record || record.usedAt) throw new AppError('INVALID_RESET_TOKEN', 'invalid token', 400);
  if (record.expiresAt < new Date()) throw new AppError('RESET_TOKEN_EXPIRED', 'expired', 400);

  const passwordHash = await hashPassword(newPassword);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } })
  ]);
  return { ok: true };
}

module.exports = { registerUser, loginUser, requestPasswordReset, confirmPasswordReset, hashToken, computeResetExpiry };
