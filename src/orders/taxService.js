const DEFAULT_RATE = 0.19;
const REDUCED_RATE = 0.07;
const REDUCED_CATEGORIES = new Set(['buch', 'lebensmittel']);

function rateForCategory(category) {
  if (typeof category !== 'string') return DEFAULT_RATE;
  return REDUCED_CATEGORIES.has(category) ? REDUCED_RATE : DEFAULT_RATE;
}

function calculateTax(amount, rate = DEFAULT_RATE) {
  if (typeof amount !== 'number' || amount <= 0) return 0;
  if (typeof rate !== 'number' || rate < 0) return 0;
  return Math.round(amount * rate);
}

function calculateTaxForItems(items) {
  if (!Array.isArray(items) || items.length === 0) return 0;
  let tax = 0;
  for (const item of items) {
    if (!item || typeof item.price !== 'number') continue;
    const qty = item.qty ?? item.quantity ?? 1;
    const lineTotal = item.price * qty;
    tax += calculateTax(lineTotal, rateForCategory(item.category));
  }
  return tax;
}

module.exports = { calculateTax, calculateTaxForItems, rateForCategory, DEFAULT_RATE, REDUCED_RATE };
