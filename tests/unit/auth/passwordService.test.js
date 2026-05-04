const {
  hashPassword,
  comparePassword,
  scorePasswordStrength,
  isStrongEnough
} = require('../../../src/auth/passwordService');

describe('hashPassword', () => {
  it('returns a bcrypt hash with the $2 prefix', async () => {
    const hash = await hashPassword('password123');
    expect(hash.startsWith('$2')).toBe(true);
  });

  it('produces different hashes for the same password (salt)', async () => {
    const h1 = await hashPassword('password123');
    const h2 = await hashPassword('password123');
    expect(h1).not.toBe(h2);
  });

  it('rejects passwords shorter than 8 characters', async () => {
    await expect(hashPassword('short')).rejects.toThrow();
  });

  it('rejects non-string input', async () => {
    await expect(hashPassword(12345678)).rejects.toThrow();
  });

  it('rejects passwords longer than 128 characters', async () => {
    await expect(hashPassword('a'.repeat(129))).rejects.toThrow();
  });
});

describe('comparePassword', () => {
  it('returns true for the matching password', async () => {
    const hash = await hashPassword('password123');
    expect(await comparePassword('password123', hash)).toBe(true);
  });

  it('returns false for a different password', async () => {
    const hash = await hashPassword('password123');
    expect(await comparePassword('different', hash)).toBe(false);
  });

  it('returns false for non-string password', async () => {
    expect(await comparePassword(null, 'hash')).toBe(false);
  });

  it('returns false for empty hash', async () => {
    expect(await comparePassword('pw', '')).toBe(false);
  });
});

describe('scorePasswordStrength / isStrongEnough', () => {
  it('scores 0 for empty input', () => {
    expect(scorePasswordStrength('')).toBe(0);
  });

  it('scores higher for complex passwords', () => {
    expect(scorePasswordStrength('Password1!') > scorePasswordStrength('password')).toBe(true);
  });

  it('isStrongEnough returns true for Password1!', () => {
    expect(isStrongEnough('Password1!')).toBe(true);
  });
});
