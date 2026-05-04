const FREE_SHIPPING_THRESHOLD = 5000;
const RATES = {
  standard: 499,
  express: 999,
  overnight: 1999
};

function calculateShipping(subtotal, method = 'standard') {
  if (typeof subtotal !== 'number' || subtotal < 0) return 0;
  if (subtotal >= FREE_SHIPPING_THRESHOLD && method === 'standard') return 0;
  const rate = RATES[method];
  if (typeof rate !== 'number') return RATES.standard;
  return rate;
}

function isEligibleForFreeShipping(subtotal) {
  return typeof subtotal === 'number' && subtotal >= FREE_SHIPPING_THRESHOLD;
}

module.exports = { calculateShipping, isEligibleForFreeShipping, FREE_SHIPPING_THRESHOLD, RATES };
