const prisma = require('./prisma');

async function resetTestDatabase() {
  await prisma.$transaction([
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.cartItem.deleteMany(),
    prisma.cart.deleteMany(),
    prisma.review.deleteMany(),
    prisma.passwordResetToken.deleteMany(),
    prisma.user.deleteMany(),
    prisma.product.deleteMany()
  ]);
}

async function seedBaseline() {
  const bcrypt = require('bcryptjs');
  const passwordHash = await bcrypt.hash('password123', 4);

  const user = await prisma.user.create({
    data: { email: 'test@shopco.de', passwordHash, name: 'Testkunde' }
  });

  const products = await prisma.$transaction([
    prisma.product.create({ data: { sku: 'SKU-A-001', name: 'Produkt A', category: 'elektronik', price: 9999, stock: 50, description: 'A' } }),
    prisma.product.create({ data: { sku: 'SKU-B-002', name: 'Produkt B', category: 'elektronik', price: 14999, stock: 30, description: 'B' } }),
    prisma.product.create({ data: { sku: 'SKU-C-003', name: 'Produkt C', category: 'kleidung', price: 2999, stock: 100, description: 'C' } }),
    prisma.product.create({ data: { sku: 'SKU-D-004', name: 'Produkt D', category: 'kleidung', price: 4999, stock: 0, description: 'D' } }),
    prisma.product.create({ data: { sku: 'SKU-E-005', name: 'Produkt E', category: 'buch', price: 1999, stock: 200, description: 'E' } })
  ]);

  return { user, products };
}

module.exports = { resetTestDatabase, seedBaseline };
