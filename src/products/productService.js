const prisma = require('../db/prisma');
const { performSearch } = require('./searchHelper');
const { AppError } = require('../middleware/errorHandler');

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

function filterByCategory(products, category) {
  if (!Array.isArray(products)) return [];
  if (!category) return [...products];
  return products.filter((p) => p.category === category);
}

function filterByPriceRange(products, min, max) {
  if (!Array.isArray(products)) return [];
  const hasMin = typeof min === 'number' && !Number.isNaN(min);
  const hasMax = typeof max === 'number' && !Number.isNaN(max);
  return products.filter((p) => {
    if (hasMin && p.price < min) return false;
    if (hasMax && p.price > max) return false;
    return true;
  });
}

function filterActive(products) {
  if (!Array.isArray(products)) return [];
  return products.filter((p) => p.active !== false);
}

function sortProducts(products, sortBy = 'name', direction = 'asc') {
  if (!Array.isArray(products)) return [];
  const dir = direction === 'desc' ? -1 : 1;
  const copy = [...products];
  copy.sort((a, b) => {
    if (sortBy === 'price') return (a.price - b.price) * dir;
    if (sortBy === 'stock') return (a.stock - b.stock) * dir;
    const an = (a.name || '').toLowerCase();
    const bn = (b.name || '').toLowerCase();
    if (an < bn) return -1 * dir;
    if (an > bn) return 1 * dir;
    return 0;
  });
  return copy;
}

function paginate(products, page = 1, limit = DEFAULT_LIMIT) {
  if (!Array.isArray(products)) return { items: [], page: 1, limit: DEFAULT_LIMIT, total: 0 };
  const safePage = Math.max(1, Math.floor(page) || 1);
  const safeLimit = Math.min(MAX_LIMIT, Math.max(1, Math.floor(limit) || DEFAULT_LIMIT));
  const start = (safePage - 1) * safeLimit;
  const end = start + safeLimit;
  return {
    items: products.slice(start, end),
    page: safePage,
    limit: safeLimit,
    total: products.length
  };
}

function aggregateReviewRating(reviews) {
  if (!Array.isArray(reviews) || reviews.length === 0) return { avg: 0, count: 0 };
  const sum = reviews.reduce((acc, r) => acc + (typeof r.rating === 'number' ? r.rating : 0), 0);
  return { avg: Math.round((sum / reviews.length) * 10) / 10, count: reviews.length };
}

function applyQuery(products, { query, category, minPrice, maxPrice, sortBy, direction, page, limit }) {
  let list = filterActive(products);
  list = filterByCategory(list, category);
  list = filterByPriceRange(list, minPrice, maxPrice);
  if (query) list = performSearch(query, list);
  list = sortProducts(list, sortBy, direction);
  return paginate(list, page, limit);
}

async function listProducts(params = {}) {
  const products = await prisma.product.findMany({ where: { active: true } });
  return applyQuery(products, params);
}

async function getProduct(id) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { reviews: true }
  });
  if (!product) throw new AppError('PRODUCT_NOT_FOUND', 'product not found', 404);
  const rating = aggregateReviewRating(product.reviews);
  return { ...product, rating };
}

async function listCategories() {
  const rows = await prisma.product.findMany({
    where: { active: true },
    select: { category: true },
    distinct: ['category']
  });
  return rows.map((r) => r.category).sort();
}

module.exports = {
  filterByCategory,
  filterByPriceRange,
  filterActive,
  sortProducts,
  paginate,
  aggregateReviewRating,
  applyQuery,
  listProducts,
  getProduct,
  listCategories,
  MAX_LIMIT,
  DEFAULT_LIMIT
};
