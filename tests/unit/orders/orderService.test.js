const { calculateOrderTotal, buildOrderSummary } = require('../../../src/orders/orderService');

describe('calculateOrderTotal', () => {
  it('sums items without a discount', () => {
    const items = [{ price: 100, qty: 2 }, { price: 50, qty: 1 }];
    expect(calculateOrderTotal(items)).toBe(250);
  });

  it('applies percentage discount correctly', () => {
    const items = [{ price: 100, qty: 2 }, { price: 50, qty: 1 }];
    const result = calculateOrderTotal(items, { type: 'percent', value: 10 });
    expect(result).toBe(225);
  });

  it('applies a fixed discount', () => {
    const items = [{ price: 100, qty: 2 }];
    expect(calculateOrderTotal(items, { type: 'fixed', value: 50 })).toBe(150);
  });

  it('caps fixed discount at subtotal', () => {
    const items = [{ price: 100, qty: 1 }];
    expect(calculateOrderTotal(items, { type: 'fixed', value: 500 })).toBe(0);
  });

  it('rejects order when stock is 0', () => {
    const items = [{ price: 100, qty: 1, stock: 0 }];
    expect(() => calculateOrderTotal(items)).toThrow('OUT_OF_STOCK');
  });

  it('rejects order when qty exceeds stock', () => {
    const items = [{ price: 100, qty: 5, stock: 2 }];
    expect(() => calculateOrderTotal(items)).toThrow('OUT_OF_STOCK');
  });

  it('throws on non-array input', () => {
    expect(() => calculateOrderTotal(null)).toThrow();
  });

  it('returns 0 for empty items list', () => {
    expect(calculateOrderTotal([])).toBe(0);
  });

  it('handles multiple items with different prices', () => {
    const items = [
      { price: 1999, qty: 2 },
      { price: 999, qty: 3 },
      { price: 500, qty: 1 }
    ];
    expect(calculateOrderTotal(items)).toBe(2 * 1999 + 3 * 999 + 500);
  });

  it('treats undefined discount as no discount', () => {
    expect(calculateOrderTotal([{ price: 100, qty: 1 }], undefined)).toBe(100);
  });
});

describe('buildOrderSummary', () => {
  const items = [{ price: 1000, qty: 3 }];

  it('returns subtotal, discountValue, shipping and total', () => {
    const summary = buildOrderSummary(items);
    expect(summary.subtotal).toBe(3000);
    expect(summary.discountValue).toBe(0);
    expect(summary.total).toBe(summary.subtotal + summary.shipping);
  });

  it('applies percentage discount', () => {
    const summary = buildOrderSummary(items, { discount: { type: 'percent', value: 10 } });
    expect(summary.discountValue).toBe(300);
  });

  it('uses standard shipping by default', () => {
    const summary = buildOrderSummary([{ price: 1000, qty: 1 }]);
    expect(summary.shipping).toBeGreaterThan(0);
  });

  it('offers free shipping at threshold', () => {
    const summary = buildOrderSummary([{ price: 5000, qty: 2 }]);
    expect(summary.shipping).toBe(0);
  });

  it('supports express shipping', () => {
    const summary = buildOrderSummary([{ price: 1000, qty: 1 }], { shippingMethod: 'express' });
    expect(summary.shipping).toBe(999);
  });

  it('discount reduces total', () => {
    const summary = buildOrderSummary([{ price: 1000, qty: 2 }], { discount: { type: 'percent', value: 50 } });
    expect(summary.total).toBeLessThan(2000);
  });

  it('throws OUT_OF_STOCK when applicable', () => {
    expect(() => buildOrderSummary([{ price: 100, qty: 1, stock: 0 }])).toThrow('OUT_OF_STOCK');
  });

  it('rounds discount to the nearest cent', () => {
    const summary = buildOrderSummary([{ price: 333, qty: 1 }], { discount: { type: 'percent', value: 10 } });
    expect(summary.discountValue).toBe(33);
  });
});
