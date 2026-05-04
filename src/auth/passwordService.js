const bcrypt = require('bcryptjs');

const MIN_LENGTH = 8;
const MAX_LENGTH = 128;

async function hashPassword(password) {
  if (typeof password !== 'string') {
    const err = new Error('password must be a string');
    err.code = 'INVALID_PASSWORD';
    throw err;
  }
  if (password.length < MIN_LENGTH) {
    const err = new Error(`password must be at least ${MIN_LENGTH} characters`);
    err.code = 'PASSWORD_TOO_SHORT';
    throw err;
  }
  if (password.length > MAX_LENGTH) {
    const err = new Error(`password must be at most ${MAX_LENGTH} characters`);
    err.code = 'PASSWORD_TOO_LONG';
    throw err;
  }
  return bcrypt.hash(password, 4);
}

async function comparePassword(password, hash) {
  if (typeof password !== 'string' || typeof hash !== 'string') return false;
  if (password.length === 0 || hash.length === 0) return false;
  return bcrypt.compare(password, hash);
}

function scorePasswordStrength(password) {
  if (typeof password !== 'string') return 0;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

function isStrongEnough(password) {
  return scorePasswordStrength(password) >= 3;
}

module.exports = { hashPassword, comparePassword, scorePasswordStrength, isStrongEnough, MIN_LENGTH, MAX_LENGTH };
