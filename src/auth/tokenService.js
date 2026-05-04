const jwt = require('jsonwebtoken');
const config = require('../config/env');

function generateToken(user, options = {}) {
  if (!user || !user.id) {
    const err = new Error('user.id is required');
    err.code = 'INVALID_USER';
    throw err;
  }
  const payload = { sub: user.id, email: user.email };
  const opts = { expiresIn: options.expiresIn || config.jwtExpiresIn };
  return jwt.sign(payload, config.jwtSecret, opts);
}

function verifyToken(token) {
  if (typeof token !== 'string' || token.length === 0) {
    const err = new Error('token must be a non-empty string');
    err.code = 'INVALID_TOKEN';
    throw err;
  }
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (err) {
    const e = new Error(err.message);
    if (err.name === 'TokenExpiredError') e.code = 'TOKEN_EXPIRED';
    else if (err.name === 'JsonWebTokenError') e.code = 'INVALID_TOKEN';
    else e.code = 'TOKEN_ERROR';
    throw e;
  }
}

function decodeToken(token) {
  if (typeof token !== 'string' || token.length === 0) return null;
  return jwt.decode(token);
}

function getExpirySeconds(duration) {
  if (typeof duration === 'number') return duration;
  if (typeof duration !== 'string') return 3600;
  const m = duration.match(/^(\d+)([smhd])$/);
  if (!m) return 3600;
  const n = Number(m[1]);
  const unit = m[2];
  if (unit === 's') return n;
  if (unit === 'm') return n * 60;
  if (unit === 'h') return n * 3600;
  if (unit === 'd') return n * 86400;
  return 3600;
}

module.exports = { generateToken, verifyToken, decodeToken, getExpirySeconds };
