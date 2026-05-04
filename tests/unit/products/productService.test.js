const {
  filterByCategory,
  filterByPriceRange,
  filterActive,
  sortProducts,
  paginate,
  aggregateReviewRating,
  applyQuery
} = require('../../../src/products/productService');

const sample = [
  { id: '1', name: 'Laptop', category: 'elektronik', price: 99900, stock: 5, active: true },
  { id: '2', name: 'Smartphone', category: 'elektronik', price: 49900, stock: 10, active: true },
  { id: '3', name: 'T-Shirt', category: 'kleidung', price: 1999, stock: 50, active: true },
  { id: '4', name: 'Buch', category: 'buch', price: 1499, stock: 100, active: true },
  { id: '5', name: 'Stuhl', category: 'moebel', price: 29900, stock: 0, active: false }
];

describe('filterByCategory', () => {
  it('returns only matching category', () => {
    const res = filterByCategory(sample, 'elektronik');
    expect(res.every((p) => p.category === 'elektronik')).toBe(true);
  });

  it('returns all items when no category provided', () => {
    expect(filterByCategory(sample, undefined).length).toBe(sample.length);
  });

  it('returns empty array for unknown category', () => {
    expect(filterByCategory(sample, 'unknown').length).toBe(0);
  });

  it('returns [] on non-array input', () => {
    expect(filterByCategory(null, 'elektronik')).toEqual([]);
  });
});

describe('filterByPriceRange', () => {
  it('returns only products in [min, max]', () => {
    const res = filterByPriceRange(sample, 1000, 5000);
    expect(res.map((p) => p.id).sort()).toEqual(['3', '4']);
  });

  it('applies only min when max is undefined', () => {
    const res = filterByPriceRange(sample, 50000);
    expect(res.map((p) => p.id)).toEqual(['1']);
  });

  it('applies only max when min is undefined', () => {
    const res = filterByPriceRange(sample, undefined, 2000);
    expect(res.map((p) => p.id).sort()).toEqual(['3', '4']);
  });

  it('returns full list with no bounds', () => {
    expect(filterByPriceRange(sample).length).toBe(sample.length);
  });
});

describe('filterActive', () => {
  it('hides inactive products', () => {
    const res = filterActive(sample);
    expect(res.find((p) => p.id === '5')).toBeUndefined();
  });

  it('returns [] on non-array input', () => {
    expect(filterActive(undefined)).toEqual([]);
  });
});

describe('sortProducts', () => {
  it('sorts by name ascending by default', () => {
    const res = sortProducts(sample);
    expect(res[0].name.toLowerCase() <= res[1].name.toLowerCase()).toBe(true);
  });

  it('sorts by price ascending', () => {
    const res = sortProducts(sample, 'price', 'asc');
    expect(res[0].price).toBeLessThanOrEqual(res[1].price);
  });

  it('sorts by price descending', () => {
    const res = sortProducts(sample, 'price', 'desc');
    expect(res[0].price).toBeGreaterThanOrEqual(res[1].price);
  });

  it('sorts by stock', () => {
    const res = sortProducts(sample, 'stock', 'asc');
    expect(res[0].stock).toBeLessThanOrEqual(res[1].stock);
  });
});

describe('paginate', () => {
  it('returns first page by default', () => {
    const res = paginate(sample, 1, 2);
    expect(res.items.length).toBe(2);
    expect(res.page).toBe(1);
  });

  it('returns second page', () => {
    const res = paginate(sample, 2, 2);
    expect(res.items[0].id).toBe('3');
  });

  it('caps limit at MAX_LIMIT', () => {
    const res = paginate(sample, 1, 5000);
    expect(res.limit).toBeLessThanOrEqual(100);
  });

  it('reports total count', () => {
    const res = paginate(sample, 1, 2);
    expect(res.total).toBe(sample.length);
  });
});

describe('aggregateReviewRating', () => {
  it('returns {avg:0, count:0} for empty reviews', () => {
    expect(aggregateReviewRating([])).toEqual({ avg: 0, count: 0 });
  });

  it('computes the average rounded to 1 decimal', () => {
    const res = aggregateReviewRating([{ rating: 5 }, { rating: 4 }, { rating: 4 }]);
    expect(res.avg).toBeCloseTo(4.3, 1);
  });

  it('counts reviews', () => {
    expect(aggregateReviewRating([{ rating: 5 }, { rating: 3 }]).count).toBe(2);
  });
});

describe('applyQuery', () => {
  it('filters, sorts and paginates in one call', () => {
    const res = applyQuery(sample, {
      category: 'elektronik',
      sortBy: 'price',
      direction: 'asc',
      page: 1,
      limit: 10
    });
    expect(res.items.length).toBe(2);
    expect(res.items[0].price).toBeLessThan(res.items[1].price);
  });

  it('applies a text query', () => {
    const res = applyQuery(sample, { query: 'Laptop', page: 1, limit: 10 });
    expect(res.items[0].name).toBe('Laptop');
  });
});
