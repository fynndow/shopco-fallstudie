const prisma = require('../db/prisma');
const { AppError } = require('../middleware/errorHandler');

function lineTotal(item) {
  if (!item || typeof item.price !== 'number') return 0;
  const qty = item.qty ?? item.quantity ?? 1;
  if (typeof qty !== 'number' || qty < 0) return 0;
  return item.price * qty;
}

function sumItems(items) {
  if (!Array.isArray(items)) return 0;
  return items.reduce((acc, item) => acc + lineTotal(item), 0);
}

function countItems(items) {
  if (!Array.isArray(items)) return 0;
  return items.reduce((acc, item) => {
    const qty = item?.qty ?? item?.quantity ?? 0;
    return acc + (typeof qty === 'number' ? qty : 0);
  }, 0);
}

function mergeCartItem(items, { productId, price, quantity }) {
  if (!Array.isArray(items)) return [{ productId, price, quantity }];
  const existing = items.find((i) => i.productId === productId);
  if (existing) {
    return items.map((i) =>
      i.productId === productId ? { ...i, quantity: i.quantity + quantity } : i
    );
  }
  return [...items, { productId, price, quantity }];
}

function removeCartItem(items, productId) {
  if (!Array.isArray(items)) return [];
  return items.filter((i) => i.productId !== productId);
}

function updateCartItemQuantity(items, productId, quantity) {
  if (!Array.isArray(items)) return [];
  if (typeof quantity !== 'number' || quantity <= 0) {
    return removeCartItem(items, productId);
  }
  return items.map((i) => (i.productId === productId ? { ...i, quantity } : i));
}

async function getOrCreateCart(userId) {
  let cart = await prisma.cart.findFirst({ where: { userId }, include: { items: { include: { product: true } } } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId }, include: { items: { include: { product: true } } } });
  }
  return cart;
}

async function addToCart(userId, { productId, quantity }) {
  if (typeof quantity !== 'number' || quantity <= 0) {
    throw new AppError('INVALID_QUANTITY', 'quantity must be positive', 400);
  }
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new AppError('PRODUCT_NOT_FOUND', 'product not found', 404);
  if (product.stock <= 0) {
    throw new AppError('OUT_OF_STOCK', 'product is out of stock', 409);
  }
  const cart = await getOrCreateCart(userId);
  const existing = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } }
  });
  if (existing) {
    const newQty = existing.quantity + quantity;
    if (newQty > product.stock) {
      throw new AppError('OUT_OF_STOCK', 'not enough stock', 409);
    }
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: newQty }
    });
  } else {
    if (quantity > product.stock) {
      throw new AppError('OUT_OF_STOCK', 'not enough stock', 409);
    }
    await prisma.cartItem.create({ data: { cartId: cart.id, productId, quantity } });
  }
  return getOrCreateCart(userId);
}

async function removeFromCart(userId, productId) {
  const cart = await getOrCreateCart(userId);
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
  return getOrCreateCart(userId);
}

async function clearCart(userId) {
  const cart = await getOrCreateCart(userId);
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  return getOrCreateCart(userId);
}

module.exports = {
  lineTotal,
  sumItems,
  countItems,
  mergeCartItem,
  removeCartItem,
  updateCartItemQuantity,
  getOrCreateCart,
  addToCart,
  removeFromCart,
  clearCart
};
