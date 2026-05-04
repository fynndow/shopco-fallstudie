const { AppError } = require('../middleware/errorHandler');

function ensureStock(items) {
  if (!Array.isArray(items)) {
    throw new AppError('INVALID_ITEMS', 'items must be an array', 400);
  }
  for (const item of items) {
    if (!item) continue;
    if (typeof item.stock === 'number' && item.stock <= 0) {
      const err = new Error('OUT_OF_STOCK');
      err.code = 'OUT_OF_STOCK';
      err.statusCode = 409;
      throw err;
    }
    const qty = item.qty ?? item.quantity;
    if (typeof item.stock === 'number' && typeof qty === 'number' && qty > item.stock) {
      const err = new Error('OUT_OF_STOCK');
      err.code = 'OUT_OF_STOCK';
      err.statusCode = 409;
      throw err;
    }
  }
}

function hasSufficientStock(product, requestedQty) {
  if (!product || typeof product.stock !== 'number') return false;
  if (typeof requestedQty !== 'number' || requestedQty <= 0) return false;
  return product.stock >= requestedQty;
}

function reserveStock(product, qty) {
  if (!hasSufficientStock(product, qty)) {
    const err = new Error('OUT_OF_STOCK');
    err.code = 'OUT_OF_STOCK';
    err.statusCode = 409;
    throw err;
  }
  return { ...product, stock: product.stock - qty };
}

module.exports = { ensureStock, hasSufficientStock, reserveStock };
