const {
  isValidEmail,
  normalizeEmail,
  isValidName,
  isValidPassword,
  validateRegistration,
  validateLogin
} = require('../../../src/auth/validators');

describe('isValidEmail', () => {
  it('accepts a standard email', () => {
    expect(isValidEmail('test@shopco.de')).toBe(true);
  });

  it('rejects missing @', () => {
    expect(isValidEmail('plainstring')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidEmail('')).toBe(false);
  });

  it('rejects null', () => {
    expect(isValidEmail(null)).toBe(false);
  });

  it('rejects numbers', () => {
    expect(isValidEmail(123)).toBe(false);
  });

  it('rejects missing TLD', () => {
    expect(isValidEmail('user@shopco')).toBe(false);
  });
});

describe('normalizeEmail', () => {
  it('lowercases the address', () => {
    expect(normalizeEmail('Test@Shopco.de')).toBe('test@shopco.de');
  });

  it('trims whitespace', () => {
    expect(normalizeEmail('  a@b.de  ')).toBe('a@b.de');
  });

  it('returns empty string for non-string input', () => {
    expect(normalizeEmail(null)).toBe('');
  });
});

describe('isValidName', () => {
  it('accepts Latin names', () => {
    expect(isValidName('Max Mustermann')).toBe(true);
  });

  it('accepts umlauts', () => {
    expect(isValidName('Jürgen Müller')).toBe(true);
  });

  it('rejects single-character names', () => {
    expect(isValidName('J')).toBe(false);
  });

  it('rejects names with digits', () => {
    expect(isValidName('Max1')).toBe(false);
  });
});

describe('isValidPassword', () => {
  it('accepts 8-char passwords', () => {
    expect(isValidPassword('12345678')).toBe(true);
  });

  it('rejects 7-char passwords', () => {
    expect(isValidPassword('1234567')).toBe(false);
  });

  it('rejects non-string', () => {
    expect(isValidPassword(12345678)).toBe(false);
  });

  it('rejects very long passwords', () => {
    expect(isValidPassword('a'.repeat(200))).toBe(false);
  });
});

describe('validateRegistration', () => {
  it('passes for valid payload', () => {
    const res = validateRegistration({ email: 'a@b.de', password: 'password123', name: 'Max' });
    expect(res.ok).toBe(true);
  });

  it('fails for missing email', () => {
    const res = validateRegistration({ password: 'password123', name: 'Max' });
    expect(res.errors.email).toBe('INVALID_EMAIL');
  });

  it('fails for short password', () => {
    const res = validateRegistration({ email: 'a@b.de', password: '123', name: 'Max' });
    expect(res.errors.password).toBe('INVALID_PASSWORD');
  });

  it('fails for invalid name', () => {
    const res = validateRegistration({ email: 'a@b.de', password: 'password123', name: '' });
    expect(res.errors.name).toBe('INVALID_NAME');
  });
});

describe('validateLogin', () => {
  it('passes for valid payload', () => {
    expect(validateLogin({ email: 'a@b.de', password: 'x' }).ok).toBe(true);
  });

  it('fails for invalid email', () => {
    expect(validateLogin({ email: 'nope', password: 'x' }).ok).toBe(false);
  });

  it('fails for missing password', () => {
    expect(validateLogin({ email: 'a@b.de' }).ok).toBe(false);
  });

  it('fails for null input', () => {
    expect(validateLogin(null).ok).toBe(false);
  });
});
