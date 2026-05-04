const express = require('express');
const { getList, getById, getCategories } = require('./productController');

const router = express.Router();
router.get('/', getList);
router.get('/categories', getCategories);
router.get('/:id', getById);

module.exports = router;
