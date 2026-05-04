const {
  calculateShipping,
  isEligibleForFreeShipping,
  FREE_SHIPPING_THRESHOLD,
  RATES
} = require('../../../src/orders/shippingService');

describe('calculateShipping', () => {
  it('returns standard rate for small orders', () => {
    expect(calculateShipping(1000, 'standard')).toBe(RATES.standard);
  });

  it('returns 0 for free-shipping threshold with standard method', () => {
    expect(calculateShipping(FREE_SHIPPING_THRESHOLD, 'standard')).toBe(0);
  });

  it('returns 0 above free-shipping threshold', () => {
    expect(calculateShipping(10000, 'standard')).toBe(0);
  });

  it('returns express rate regardless of threshold', () => {
    expect(calculateShipping(10000, 'express')).toBe(RATES.express);
  });

  it('returns overnight rate', () => {
    expect(calculateShipping(10000, 'overnight')).toBe(RATES.overnight);
  });

  it('returns standard rate for unknown method', () => {
    expect(calculateShipping(1000, 'carrier-pigeon')).toBe(RATES.standard);
  });

  it('returns 0 for negative subtotal', () => {
    expect(calculateShipping(-10, 'standard')).toBe(0);
  });

  it('returns 0 for non-number subtotal', () => {
    expect(calculateShipping('foo', 'standard')).toBe(0);
  });
});

describe('isEligibleForFreeShipping', () => {
  it('returns true at the threshold', () => {
    expect(isEligibleForFreeShipping(FREE_SHIPPING_THRESHOLD)).toBe(true);
  });

  it('returns false below the threshold', () => {
    expect(isEligibleForFreeShipping(FREE_SHIPPING_THRESHOLD - 1)).toBe(false);
  });
});
