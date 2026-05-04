const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  if (email.length === 0 || email.length > 254) return false;
  return EMAIL_RE.test(email);
}

function normalizeEmail(email) {
  if (typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

function isValidName(name) {
  if (typeof name !== 'string') return false;
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 80) return false;
  return /^[A-Za-zÀ-ÿ\s'-]+$/.test(trimmed);
}

function isValidPassword(password) {
  if (typeof password !== 'string') return false;
  if (password.length < 8 || password.length > 128) return false;
  return true;
}

function validateRegistration(input) {
  const errors = {};
  if (!isValidEmail(input?.email)) errors.email = 'INVALID_EMAIL';
  if (!isValidPassword(input?.password)) errors.password = 'INVALID_PASSWORD';
  if (!isValidName(input?.name)) errors.name = 'INVALID_NAME';
  return { ok: Object.keys(errors).length === 0, errors };
}

function validateLogin(input) {
  const errors = {};
  if (!isValidEmail(input?.email)) errors.email = 'INVALID_EMAIL';
  if (typeof input?.password !== 'string' || input.password.length === 0) errors.password = 'INVALID_PASSWORD';
  return { ok: Object.keys(errors).length === 0, errors };
}

module.exports = { isValidEmail, normalizeEmail, isValidName, isValidPassword, validateRegistration, validateLogin };
