const jwt = require('jsonwebtoken');
const { generateToken, verifyToken, decodeToken, getExpirySeconds } = require('../../../src/auth/tokenService');
const config = require('../../../src/config/env');

describe('generateToken', () => {
  const user = { id: 'u-1', email: 'a@b.de' };

  it('returns a non-empty JWT string', () => {
    const token = generateToken(user);
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);
  });

  it('encodes the user id as sub claim', () => {
    const token = generateToken(user);
    const decoded = jwt.verify(token, config.jwtSecret);
    expect(decoded.sub).toBe('u-1');
  });

  it('encodes the user email', () => {
    const token = generateToken(user);
    const decoded = jwt.verify(token, config.jwtSecret);
    expect(decoded.email).toBe('a@b.de');
  });

  it('respects custom expiresIn', () => {
    const token = generateToken(user, { expiresIn: '10s' });
    const decoded = jwt.decode(token);
    expect(decoded.exp - decoded.iat).toBe(10);
  });

  it('throws INVALID_USER when user is null', () => {
    expect(() => generateToken(null)).toThrow();
  });

  it('throws INVALID_USER when user.id is missing', () => {
    expect(() => generateToken({ email: 'x@y.de' })).toThrow();
  });

  it('sets the INVALID_USER code on missing id', () => {
    try { generateToken({}); } catch (err) { expect(err.code).toBe('INVALID_USER'); }
  });

  it('is signed with the configured secret', () => {
    const token = generateToken(user);
    expect(() => jwt.verify(token, 'other-secret')).toThrow();
  });
});

describe('verifyToken', () => {
  const user = { id: 'u-2', email: 'b@c.de' };

  it('returns the payload for valid tokens', () => {
    const token = generateToken(user);
    const payload = verifyToken(token);
    expect(payload.sub).toBe('u-2');
  });

  it('throws TOKEN_EXPIRED when token is expired', () => {
    const token = jwt.sign({ sub: 'u-2' }, config.jwtSecret, { expiresIn: -1 });
    try { verifyToken(token); } catch (err) { expect(err.code).toBe('TOKEN_EXPIRED'); }
  });

  it('throws INVALID_TOKEN for malformed tokens', () => {
    try { verifyToken('not-a-jwt'); } catch (err) { expect(err.code).toBe('INVALID_TOKEN'); }
  });

  it('throws INVALID_TOKEN for empty string', () => {
    try { verifyToken(''); } catch (err) { expect(err.code).toBe('INVALID_TOKEN'); }
  });

  it('throws INVALID_TOKEN for null input', () => {
    try { verifyToken(null); } catch (err) { expect(err.code).toBe('INVALID_TOKEN'); }
  });
});

describe('decodeToken / getExpirySeconds', () => {
  it('decodeToken returns null for invalid input', () => {
    expect(decodeToken('')).toBeNull();
  });

  it('getExpirySeconds handles 1h correctly', () => {
    expect(getExpirySeconds('1h')).toBe(3600);
  });
});
