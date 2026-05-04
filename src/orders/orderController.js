const { checkoutCart, listOrders, getOrder } = require('./orderService');
const { addToCart, removeFromCart, clearCart, getOrCreateCart } = require('./cartService');

async function getCart(req, res, next) {
  try {
    const cart = await getOrCreateCart(req.user.id);
    res.status(200).json(cart);
  } catch (err) { next(err); }
}

async function addItem(req, res, next) {
  try {
    const { productId, quantity } = req.body || {};
    const cart = await addToCart(req.user.id, {
      productId,
      quantity: Number(quantity)
    });
    res.status(200).json(cart);
  } catch (err) { next(err); }
}

async function removeItem(req, res, next) {
  try {
    const cart = await removeFromCart(req.user.id, req.params.productId);
    res.status(200).json(cart);
  } catch (err) { next(err); }
}

async function emptyCart(req, res, next) {
  try {
    const cart = await clearCart(req.user.id);
    res.status(200).json(cart);
  } catch (err) { next(err); }
}

async function checkout(req, res, next) {
  try {
    const { cartId, paymentMethod, couponCode } = req.body || {};
    const result = await checkoutCart({
      userId: req.user.id,
      cartId,
      paymentMethod,
      couponCode
    });
    res.status(201).json(result);
  } catch (err) { next(err); }
}

async function getAll(req, res, next) {
  try {
    const orders = await listOrders(req.user.id);
    res.status(200).json({ orders });
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const order = await getOrder(req.user.id, req.params.id);
    res.status(200).json(order);
  } catch (err) { next(err); }
}

module.exports = { getCart, addItem, removeItem, emptyCart, checkout, getAll, getOne };
