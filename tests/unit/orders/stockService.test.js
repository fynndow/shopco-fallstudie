const { ensureStock, hasSufficientStock, reserveStock } = require('../../../src/orders/stockService');

describe('ensureStock', () => {
  it('does not throw for items with positive stock', () => {
    expect(() => ensureStock([{ price: 100, qty: 1, stock: 5 }])).not.toThrow();
  });

  it('throws OUT_OF_STOCK when stock is 0', () => {
    expect(() => ensureStock([{ price: 100, qty: 1, stock: 0 }])).toThrow('OUT_OF_STOCK');
  });

  it('throws OUT_OF_STOCK when qty exceeds stock', () => {
    expect(() => ensureStock([{ price: 100, qty: 10, stock: 5 }])).toThrow('OUT_OF_STOCK');
  });

  it('accepts quantity as an alias for qty', () => {
    expect(() => ensureStock([{ price: 100, quantity: 10, stock: 5 }])).toThrow('OUT_OF_STOCK');
  });

  it('throws on non-array input', () => {
    expect(() => ensureStock(null)).toThrow();
  });

  it('sets code=OUT_OF_STOCK on the thrown error', () => {
    try { ensureStock([{ stock: 0 }]); } catch (err) { expect(err.code).toBe('OUT_OF_STOCK'); }
  });

  it('ignores items without stock field', () => {
    expect(() => ensureStock([{ price: 100, qty: 1 }])).not.toThrow();
  });
});

describe('hasSufficientStock', () => {
  it('returns true when stock covers qty', () => {
    expect(hasSufficientStock({ stock: 5 }, 3)).toBe(true);
  });

  it('returns false when stock is insufficient', () => {
    expect(hasSufficientStock({ stock: 2 }, 5)).toBe(false);
  });

  it('returns false for invalid product', () => {
    expect(hasSufficientStock(null, 1)).toBe(false);
  });

  it('returns false for non-positive qty', () => {
    expect(hasSufficientStock({ stock: 5 }, 0)).toBe(false);
  });
});

describe('reserveStock', () => {
  it('decreases the stock by the given qty', () => {
    const reserved = reserveStock({ stock: 10 }, 3);
    expect(reserved.stock).toBe(7);
  });
});
