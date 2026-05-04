const { listProducts, getProduct, listCategories } = require('./productService');

function parseNumber(val) {
  if (val === undefined || val === null || val === '') return undefined;
  const n = Number(val);
  return Number.isFinite(n) ? n : undefined;
}

async function getList(req, res, next) {
  try {
    const q = req.query || {};
    const result = await listProducts({
      query: q.q,
      category: q.category,
      minPrice: parseNumber(q.minPrice),
      maxPrice: parseNumber(q.maxPrice),
      sortBy: q.sortBy,
      direction: q.direction,
      page: parseNumber(q.page) || 1,
      limit: parseNumber(q.limit) || 20
    });
    res.status(200).json(result);
  } catch (err) { next(err); }
}

async function getById(req, res, next) {
  try {
    const product = await getProduct(req.params.id);
    res.status(200).json(product);
  } catch (err) { next(err); }
}

async function getCategories(_req, res, next) {
  try {
    const categories = await listCategories();
    res.status(200).json({ categories });
  } catch (err) { next(err); }
}

module.exports = { getList, getById, getCategories };
