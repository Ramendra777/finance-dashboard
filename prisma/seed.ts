import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  await prisma.record.deleteMany();
  await prisma.user.deleteMany();

  const hash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: { email: 'admin@finance.com', password: hash, role: 'ADMIN', status: 'ACTIVE' },
  });

  const analyst = await prisma.user.create({
    data: { email: 'analyst@finance.com', password: hash, role: 'ANALYST', status: 'ACTIVE' },
  });

  await prisma.user.create({
    data: { email: 'viewer@finance.com', password: hash, role: 'VIEWER', status: 'ACTIVE' },
  });

  await prisma.user.create({
    data: { email: 'inactive@finance.com', password: hash, role: 'VIEWER', status: 'INACTIVE' },
  });

  const seedRecords = [
    { amount: 5000, type: 'INCOME', category: 'Salary', date: new Date('2026-01-15'), notes: 'January salary', userId: admin.id },
    { amount: 1200, type: 'EXPENSE', category: 'Rent', date: new Date('2026-01-05'), notes: 'January rent', userId: admin.id },
    { amount: 150, type: 'EXPENSE', category: 'Utilities', date: new Date('2026-01-10'), userId: admin.id },
    { amount: 5000, type: 'INCOME', category: 'Salary', date: new Date('2026-02-15'), notes: 'February salary', userId: admin.id },
    { amount: 1200, type: 'EXPENSE', category: 'Rent', date: new Date('2026-02-05'), userId: admin.id },
    { amount: 300, type: 'EXPENSE', category: 'Groceries', date: new Date('2026-02-12'), userId: admin.id },
    { amount: 2000, type: 'INCOME', category: 'Freelance', date: new Date('2026-02-20'), notes: 'Web project', userId: analyst.id },
    { amount: 5000, type: 'INCOME', category: 'Salary', date: new Date('2026-03-15'), notes: 'March salary', userId: admin.id },
    { amount: 1200, type: 'EXPENSE', category: 'Rent', date: new Date('2026-03-05'), userId: admin.id },
    { amount: 450, type: 'EXPENSE', category: 'Utilities', date: new Date('2026-03-10'), userId: admin.id },
    { amount: 800, type: 'EXPENSE', category: 'Insurance', date: new Date('2026-03-18'), notes: 'Health insurance', userId: admin.id },
    { amount: 3500, type: 'INCOME', category: 'Freelance', date: new Date('2026-03-25'), notes: 'Mobile app project', userId: analyst.id },
    { amount: 5000, type: 'INCOME', category: 'Salary', date: new Date('2026-04-01'), notes: 'April salary', userId: admin.id },
    { amount: 250, type: 'EXPENSE', category: 'Groceries', date: new Date('2026-04-03'), userId: admin.id },
  ];

  for (const record of seedRecords) {
    await prisma.record.create({ data: record });
  }

  console.log('Seed completed:');
  console.log('  Users: 4 (admin, analyst, viewer, inactive)');
  console.log('  Records: 14');
  console.log('  Login with email: admin@finance.com / password: password123');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
