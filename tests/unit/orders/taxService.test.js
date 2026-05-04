const {
  calculateTax,
  calculateTaxForItems,
  rateForCategory,
  DEFAULT_RATE,
  REDUCED_RATE
} = require('../../../src/orders/taxService');

describe('rateForCategory', () => {
  it('returns reduced rate for books', () => {
    expect(rateForCategory('buch')).toBe(REDUCED_RATE);
  });

  it('returns reduced rate for groceries', () => {
    expect(rateForCategory('lebensmittel')).toBe(REDUCED_RATE);
  });

  it('returns default rate for unknown categories', () => {
    expect(rateForCategory('elektronik')).toBe(DEFAULT_RATE);
  });

  it('returns default rate for non-string input', () => {
    expect(rateForCategory(null)).toBe(DEFAULT_RATE);
  });
});

describe('calculateTax', () => {
  it('calculates tax at default rate', () => {
    expect(calculateTax(10000)).toBe(1900);
  });

  it('rounds tax to integer cents', () => {
    expect(calculateTax(333, 0.19)).toBe(63);
  });

  it('returns 0 for zero amount', () => {
    expect(calculateTax(0)).toBe(0);
  });

  it('returns 0 for negative amount', () => {
    expect(calculateTax(-100)).toBe(0);
  });

  it('returns 0 for negative rate', () => {
    expect(calculateTax(100, -0.1)).toBe(0);
  });
});

describe('calculateTaxForItems', () => {
  it('returns 0 for empty list', () => {
    expect(calculateTaxForItems([])).toBe(0);
  });

  it('sums tax across items', () => {
    const items = [
      { price: 1000, quantity: 1, category: 'elektronik' },
      { price: 500, quantity: 2, category: 'kleidung' }
    ];
    expect(calculateTaxForItems(items)).toBe(190 + 190);
  });
});
