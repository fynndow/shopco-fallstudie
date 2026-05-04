const {
  tokenize,
  normalizeText,
  tokenMatches,
  performSearch,
  applyStemming
} = require('../../../src/products/searchHelper');

const sample = [
  { id: '1', name: 'Gaming Laptop', description: 'Schneller Laptop', category: 'elektronik' },
  { id: '2', name: 'Smartphone', description: 'Modernes Handy', category: 'elektronik' },
  { id: '3', name: 'T-Shirt', description: 'Bequemes Shirt', category: 'kleidung' }
];

describe('tokenize', () => {
  it('splits on whitespace and lowercases', () => {
    expect(tokenize('Gaming Laptop')).toEqual(['gaming', 'laptop']);
  });

  it('returns [] for empty input', () => {
    expect(tokenize('')).toEqual([]);
  });
});

describe('normalizeText', () => {
  it('lowercases and trims', () => {
    expect(normalizeText('  ABC  ')).toBe('abc');
  });
});

describe('performSearch', () => {
  it('returns products matching the query', () => {
    const res = performSearch('laptop', sample);
    expect(res[0].id).toBe('1');
  });

  it('returns all products for empty query', () => {
    const res = performSearch('', sample);
    expect(res.length).toBe(sample.length);
  });

  it('returns [] for non-array products', () => {
    expect(performSearch('x', null)).toEqual([]);
  });

  it('ranks name matches above description matches', () => {
    const res = performSearch('laptop', sample);
    expect(res[0].name).toContain('Laptop');
  });
});

describe('tokenMatches', () => {
  it('returns true when text contains token', () => {
    expect(tokenMatches('laptop', 'Gaming Laptop')).toBe(true);
  });

  it('returns false for missing token or text', () => {
    expect(tokenMatches('', 'text')).toBe(false);
    expect(tokenMatches('x', '')).toBe(false);
  });
});

describe('applyStemming', () => {
  it('removes common German suffixes', () => {
    expect(applyStemming('Laptops')).toBe('Laptop');
  });
});
