const prisma = require('../db/prisma');

async function generateDailySalesReport(date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: start, lt: end }, status: 'paid' },
    include: { items: true }
  });
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const itemsSold = orders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0);
  return {
    date: start.toISOString().slice(0, 10),
    orders: orders.length,
    revenue: totalRevenue,
    itemsSold
  };
}

async function generateTopProductsReport(limit = 10) {
  const items = await prisma.orderItem.findMany({ include: { product: true } });
  const bucket = new Map();
  for (const it of items) {
    const current = bucket.get(it.productId) || { product: it.product, qty: 0, revenue: 0 };
    current.qty += it.quantity;
    current.revenue += it.price * it.quantity;
    bucket.set(it.productId, current);
  }
  const sorted = Array.from(bucket.values()).sort((a, b) => b.qty - a.qty);
  return sorted.slice(0, limit);
}

async function generateUserCohortReport(startDate, endDate) {
  const users = await prisma.user.findMany({
    where: { createdAt: { gte: startDate, lte: endDate } }
  });
  const cohort = new Map();
  for (const user of users) {
    const month = user.createdAt.toISOString().slice(0, 7);
    const group = cohort.get(month) || { users: 0, active: 0 };
    group.users += 1;
    cohort.set(month, group);
  }
  return Array.from(cohort.entries()).map(([month, data]) => ({ month, ...data }));
}

function formatCsvRow(values) {
  return values
    .map((v) => {
      if (v == null) return '';
      const s = String(v);
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    })
    .join(',');
}

function exportOrdersToCsv(orders) {
  const header = formatCsvRow(['id', 'userId', 'status', 'total', 'createdAt']);
  const rows = orders.map((o) => formatCsvRow([o.id, o.userId, o.status, o.total, o.createdAt]));
  return [header, ...rows].join('\n');
}

module.exports = {
  generateDailySalesReport,
  generateTopProductsReport,
  generateUserCohortReport,
  formatCsvRow,
  exportOrdersToCsv
};
