const express = require('express');
const { authRequired } = require('../middleware/authMiddleware');
const {
  getCart,
  addItem,
  removeItem,
  emptyCart,
  checkout,
  getAll,
  getOne
} = require('./orderController');

const router = express.Router();

router.get('/cart', authRequired, getCart);
router.post('/cart/items', authRequired, addItem);
router.delete('/cart/items/:productId', authRequired, removeItem);
router.delete('/cart', authRequired, emptyCart);
router.post('/checkout', authRequired, checkout);
router.get('/', authRequired, getAll);
router.get('/:id', authRequired, getOne);

module.exports = router;
