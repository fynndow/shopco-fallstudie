const STOPWORDS = new Set(['der', 'die', 'das', 'und', 'oder', 'the', 'a', 'an']);

function tokenize(query) {
  if (typeof query !== 'string') return [];
  const trimmed = query.trim().toLowerCase();
  if (trimmed.length === 0) return [];
  return trimmed
    .split(/[\s,;.!?]+/)
    .filter((t) => t.length > 0 && !STOPWORDS.has(t));
}

function normalizeText(text) {
  if (typeof text !== 'string') return '';
  return text.toLowerCase().trim();
}

function tokenMatches(token, text) {
  if (!token || !text) return false;
  return normalizeText(text).includes(token);
}

function scoreProduct(product, tokens) {
  if (!product || tokens.length === 0) return 0;
  let score = 0;
  const nameL = normalizeText(product.name);
  const descL = normalizeText(product.description || '');
  const catL = normalizeText(product.category || '');
  for (const token of tokens) {
    if (nameL.includes(token)) score += 3;
    if (descL.includes(token)) score += 1;
    if (catL === token) score += 2;
  }
  return score;
}

function performSearch(query, products) {
  if (!Array.isArray(products)) return [];
  const tokens = tokenize(query);
  if (tokens.length === 0) return [...products];
  const scored = products
    .map((p) => ({ product: p, score: scoreProduct(p, tokens) }))
    .filter((x) => x.score > 0);
  scored.sort((a, b) => b.score - a.score);
  return scored.map((x) => x.product);
}

// --- advanced helpers below are intentionally less-exercised (feature-flagged utilities) ---

function applyStemming(word) {
  if (typeof word !== 'string' || word.length < 4) return word;
  const suffixes = ['ungen', 'ung', 'ern', 'en', 'er', 'es', 'e', 's'];
  for (const suffix of suffixes) {
    if (word.endsWith(suffix) && word.length - suffix.length >= 3) {
      return word.slice(0, word.length - suffix.length);
    }
  }
  return word;
}

function fuzzyMatch(token, word, threshold = 2) {
  if (typeof token !== 'string' || typeof word !== 'string') return false;
  if (token.length < 3) return token === word;
  if (token === word) return true;
  return Math.abs(token.length - word.length) <= threshold;
}

module.exports = {
  tokenize,
  normalizeText,
  tokenMatches,
  scoreProduct,
  performSearch,
  applyStemming,
  fuzzyMatch
};
