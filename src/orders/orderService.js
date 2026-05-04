const prisma = require('../db/prisma');
const { AppError } = require('../middleware/errorHandler');
const { applyDiscount, computeFinalTotal, resolveCoupon } = require('./discountService');
const { ensureStock } = require('./stockService');
const { calculateShipping } = require('./shippingService');
const { sumItems } = require('./cartService');
const { charge } = require('../payment/paymentClient');
const { sendOrderConfirmation } = require('../email/emailService');
const { v4: uuidv4 } = require('uuid');

function calculateOrderTotal(items, discount) {
  ensureStock(items);
  const subtotal = sumItems(items);
  return computeFinalTotal(subtotal, discount);
}

function buildOrderSummary(items, options = {}) {
  ensureStock(items);
  const subtotal = sumItems(items);
  const discountValue = options.discount ? applyDiscount(subtotal, options.discount) : 0;
  const discountedSubtotal = subtotal - discountValue;
  const shipping = calculateShipping(discountedSubtotal, options.shippingMethod || 'standard');
  const total = discountedSubtotal + shipping;
  return { subtotal, discountValue, shipping, total };
}

async function checkoutCart({ userId, cartId, paymentMethod, couponCode }) {
  if (!paymentMethod) {
    throw new AppError('INVALID_PAYMENT_METHOD', 'paymentMethod is required', 400);
  }

  const cart = await prisma.cart.findFirst({
    where: cartId ? { id: cartId, userId } : { userId },
    include: { items: { include: { product: true } } }
  });
  if (!cart || !cart.items || cart.items.length === 0) {
    throw new AppError('EMPTY_CART', 'cart is empty', 400);
  }

  const normalizedItems = cart.items.map((ci) => ({
    productId: ci.productId,
    name: ci.product.name,
    price: ci.product.price,
    quantity: ci.quantity,
    qty: ci.quantity,
    stock: ci.product.stock
  }));

  const discount = resolveCoupon(couponCode);
  const summary = buildOrderSummary(normalizedItems, { discount });

  let payment;
  try {
    payment = await charge({
      amount: summary.total,
      paymentMethod,
      idempotencyKey: uuidv4()
    });
  } catch (err) {
    throw err;
  }

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        userId,
        status: 'paid',
        subtotal: summary.subtotal,
        discountValue: summary.discountValue,
        shipping: summary.shipping,
        tax: 0,
        total: summary.total,
        paymentTxId: payment.txId || null,
        items: {
          create: normalizedItems.map((i) => ({
            productId: i.productId,
            name: i.name,
            price: i.price,
            quantity: i.quantity
          }))
        }
      },
      include: { items: true }
    });

    for (const item of normalizedItems) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } }
      });
    }

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    return created;
  });

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      await sendOrderConfirmation({ to: user.email, orderId: order.id, total: summary.total });
    }
  } catch (_e) {
    // non-fatal
  }

  return { orderId: order.id, total: order.total, status: order.status };
}

async function listOrders(userId) {
  return prisma.order.findMany({
    where: { userId },
    include: { items: true },
    orderBy: { createdAt: 'desc' }
  });
}

async function getOrder(userId, orderId) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { items: true }
  });
  if (!order) throw new AppError('ORDER_NOT_FOUND', 'order not found', 404);
  return order;
}

module.exports = { calculateOrderTotal, buildOrderSummary, checkoutCart, listOrders, getOrder };
