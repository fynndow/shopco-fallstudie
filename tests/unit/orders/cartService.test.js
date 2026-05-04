const {
  lineTotal,
  sumItems,
  countItems,
  mergeCartItem,
  removeCartItem,
  updateCartItemQuantity
} = require('../../../src/orders/cartService');

describe('lineTotal', () => {
  it('multiplies price by qty', () => {
    expect(lineTotal({ price: 100, qty: 3 })).toBe(300);
  });

  it('accepts quantity as alias', () => {
    expect(lineTotal({ price: 100, quantity: 2 })).toBe(200);
  });

  it('returns 0 for missing item', () => {
    expect(lineTotal(null)).toBe(0);
  });

  it('returns 0 for missing price', () => {
    expect(lineTotal({ qty: 2 })).toBe(0);
  });
});

describe('sumItems', () => {
  it('sums line totals', () => {
    const items = [{ price: 100, qty: 2 }, { price: 50, qty: 1 }];
    expect(sumItems(items)).toBe(250);
  });

  it('returns 0 for empty array', () => {
    expect(sumItems([])).toBe(0);
  });

  it('returns 0 for non-array', () => {
    expect(sumItems(null)).toBe(0);
  });
});

describe('countItems', () => {
  it('sums quantities', () => {
    expect(countItems([{ qty: 2 }, { qty: 3 }])).toBe(5);
  });

  it('returns 0 for empty array', () => {
    expect(countItems([])).toBe(0);
  });

  it('returns 0 for non-array', () => {
    expect(countItems(undefined)).toBe(0);
  });
});

describe('mergeCartItem', () => {
  it('adds a new item to empty cart', () => {
    const res = mergeCartItem([], { productId: 'p1', price: 100, quantity: 1 });
    expect(res).toEqual([{ productId: 'p1', price: 100, quantity: 1 }]);
  });

  it('increases quantity for existing product', () => {
    const res = mergeCartItem([{ productId: 'p1', price: 100, quantity: 1 }], { productId: 'p1', price: 100, quantity: 2 });
    expect(res[0].quantity).toBe(3);
  });

  it('preserves other items', () => {
    const res = mergeCartItem([{ productId: 'p2', price: 50, quantity: 1 }], { productId: 'p1', price: 100, quantity: 1 });
    expect(res.length).toBe(2);
  });
});

describe('removeCartItem', () => {
  it('removes the item by productId', () => {
    const res = removeCartItem([{ productId: 'p1', quantity: 1 }], 'p1');
    expect(res.length).toBe(0);
  });

  it('is a no-op for missing productId', () => {
    const res = removeCartItem([{ productId: 'p1', quantity: 1 }], 'p2');
    expect(res.length).toBe(1);
  });

  it('returns [] for non-array', () => {
    expect(removeCartItem(null, 'p1')).toEqual([]);
  });
});

describe('updateCartItemQuantity', () => {
  it('updates the quantity', () => {
    const res = updateCartItemQuantity([{ productId: 'p1', quantity: 1 }], 'p1', 5);
    expect(res[0].quantity).toBe(5);
  });

  it('removes the item when quantity <= 0', () => {
    const res = updateCartItemQuantity([{ productId: 'p1', quantity: 1 }], 'p1', 0);
    expect(res.length).toBe(0);
  });

  it('returns [] for non-array input', () => {
    expect(updateCartItemQuantity(null, 'p1', 1)).toEqual([]);
  });
});
