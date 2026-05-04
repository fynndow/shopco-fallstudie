const { AppError } = require('../middleware/errorHandler');

const COUPONS = {
  WELCOME10: { type: 'percent', value: 10 },
  SPRING20: { type: 'percent', value: 20 },
  FIVEOFF: { type: 'fixed', value: 500 }
};

function isValidDiscount(discount) {
  if (!discount || typeof discount !== 'object') return false;
  if (discount.type !== 'percent' && discount.type !== 'fixed') return false;
  if (typeof discount.value !== 'number' || discount.value < 0) return false;
  if (discount.type === 'percent' && discount.value > 100) return false;
  return true;
}

function resolveCoupon(code) {
  if (typeof code !== 'string') return null;
  const upper = code.trim().toUpperCase();
  if (!upper) return null;
  return COUPONS[upper] || null;
}

function applyDiscount(subtotal, discount) {
  if (typeof subtotal !== 'number' || subtotal < 0) {
    throw new AppError('INVALID_SUBTOTAL', 'subtotal must be a non-negative number', 400);
  }
  if (!discount) return 0;
  if (!isValidDiscount(discount)) {
    throw new AppError('INVALID_DISCOUNT', 'discount payload invalid', 400);
  }
  if (discount.type === 'percent') {
    return Math.round(subtotal * (discount.value / 100));
  }
  if (discount.type === 'fixed') {
    return Math.min(discount.value, subtotal);
  }
  return 0;
}

function computeFinalTotal(subtotal, discount) {
  const discountValue = applyDiscount(subtotal, discount);
  return subtotal - discountValue;
}

module.exports = { applyDiscount, computeFinalTotal, isValidDiscount, resolveCoupon, COUPONS };
