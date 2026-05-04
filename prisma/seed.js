const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  await prisma.user.upsert({
    where: { email: 'test@shopco.de' },
    update: {},
    create: {
      email: 'test@shopco.de',
      passwordHash,
      name: 'Testkunde'
    }
  });

  const products = [
    { sku: 'SKU-A-001', name: 'Produkt A', category: 'elektronik', price: 9999, stock: 50, description: 'Elektronikartikel A' },
    { sku: 'SKU-B-002', name: 'Produkt B', category: 'elektronik', price: 14999, stock: 30, description: 'Elektronikartikel B' },
    { sku: 'SKU-C-003', name: 'Produkt C', category: 'kleidung', price: 2999, stock: 100, description: 'Kleidung C' },
    { sku: 'SKU-D-004', name: 'Produkt D', category: 'kleidung', price: 4999, stock: 0, description: 'Kleidung D (ausverkauft)' },
    { sku: 'SKU-E-005', name: 'Produkt E', category: 'buch', price: 1999, stock: 200, description: 'Buch E' }
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: p
    });
  }

  console.log('Seed done.');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
