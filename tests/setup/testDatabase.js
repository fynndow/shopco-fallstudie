const { execSync } = require('child_process');
const prisma = require('../../src/db/prisma');

let migrated = false;

function applyMigrations() {
  if (migrated) return;
  execSync('npx prisma migrate deploy', {
    stdio: 'ignore',
    env: { ...process.env }
  });
  migrated = true;
}

async function resetDatabase() {
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

async function seedBaselineProducts() {
  await prisma.product.createMany({
    data: [
      { sku: 'SKU-A-001', name: 'Produkt A', category: 'elektronik', price: 9999, stock: 50, description: 'A' },
      { sku: 'SKU-B-002', name: 'Produkt B', category: 'elektronik', price: 14999, stock: 30, description: 'B' },
      { sku: 'SKU-C-003', name: 'Produkt C', category: 'kleidung', price: 2999, stock: 100, description: 'C' },
      { sku: 'SKU-D-004', name: 'Produkt D', category: 'kleidung', price: 4999, stock: 0, description: 'D' },
      { sku: 'SKU-E-005', name: 'Produkt E', category: 'buch', price: 1999, stock: 200, description: 'E' }
    ]
  });
  const products = await prisma.product.findMany({ orderBy: { sku: 'asc' } });
  return products;
}

async function createTestUser({ email = 'test@shopco.de', password = 'password123', name = 'Testkunde' } = {}) {
  const bcrypt = require('bcryptjs');
  const passwordHash = await bcrypt.hash(password, 4);
  return prisma.user.create({ data: { email, passwordHash, name } });
}

module.exports = { applyMigrations, resetDatabase, seedBaselineProducts, createTestUser };
