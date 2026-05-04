const {
  applyDiscount,
  computeFinalTotal,
  isValidDiscount,
  resolveCoupon,
  COUPONS
} = require('../../../src/orders/discountService');

describe('isValidDiscount', () => {
  it('accepts valid percent discount', () => {
    expect(isValidDiscount({ type: 'percent', value: 10 })).toBe(true);
  });

  it('accepts valid fixed discount', () => {
    expect(isValidDiscount({ type: 'fixed', value: 500 })).toBe(true);
  });

  it('rejects null', () => {
    expect(isValidDiscount(null)).toBe(false);
  });

  it('rejects unknown type', () => {
    expect(isValidDiscount({ type: 'free', value: 1 })).toBe(false);
  });

  it('rejects negative value', () => {
    expect(isValidDiscount({ type: 'percent', value: -5 })).toBe(false);
  });

  it('rejects percent > 100', () => {
    expect(isValidDiscount({ type: 'percent', value: 150 })).toBe(false);
  });
});

describe('applyDiscount', () => {
  it('returns 0 when no discount is provided', () => {
    expect(applyDiscount(250, null)).toBe(0);
  });

  it('applies a 10% discount correctly (250 -> 25)', () => {
    expect(applyDiscount(250, { type: 'percent', value: 10 })).toBe(25);
  });

  it('rounds to the nearest cent', () => {
    expect(applyDiscount(333, { type: 'percent', value: 10 })).toBe(33);
  });

  it('applies a fixed discount', () => {
    expect(applyDiscount(1000, { type: 'fixed', value: 500 })).toBe(500);
  });

  it('caps fixed discount at subtotal', () => {
    expect(applyDiscount(300, { type: 'fixed', value: 500 })).toBe(300);
  });

  it('throws for invalid subtotal', () => {
    expect(() => applyDiscount(-1, { type: 'percent', value: 10 })).toThrow();
  });

  it('throws for invalid discount payload', () => {
    expect(() => applyDiscount(100, { type: 'x', value: 1 })).toThrow();
  });
});

describe('computeFinalTotal', () => {
  it('matches the case study example: 250 - 10% = 225', () => {
    expect(computeFinalTotal(250, { type: 'percent', value: 10 })).toBe(225);
  });

  it('returns subtotal when no discount is applied', () => {
    expect(computeFinalTotal(250, null)).toBe(250);
  });
});

describe('resolveCoupon', () => {
  it('resolves known coupon codes', () => {
    expect(resolveCoupon('WELCOME10')).toEqual(COUPONS.WELCOME10);
  });

  it('resolves codes case-insensitively', () => {
    expect(resolveCoupon('welcome10')).toEqual(COUPONS.WELCOME10);
  });

  it('returns null for unknown codes', () => {
    expect(resolveCoupon('NOPE')).toBeNull();
  });

  it('returns null for non-strings', () => {
    expect(resolveCoupon(null)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(resolveCoupon('')).toBeNull();
  });
});
