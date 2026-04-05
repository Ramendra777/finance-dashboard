import { Response } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth.middleware';

export const getDashboardSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const activeFilter = { isDeleted: false };

    const incomeAgg = await prisma.record.aggregate({
      _sum: { amount: true },
      where: { type: 'INCOME', ...activeFilter },
    });

    const expenseAgg = await prisma.record.aggregate({
      _sum: { amount: true },
      where: { type: 'EXPENSE', ...activeFilter },
    });

    const totalIncome = incomeAgg._sum.amount || 0;
    const totalExpenses = expenseAgg._sum.amount || 0;
    const netBalance = totalIncome - totalExpenses;

    const categoryBreakdownData = await prisma.record.groupBy({
      by: ['category', 'type'],
      _sum: { amount: true },
      where: activeFilter,
    });

    const categoryBreakdown = categoryBreakdownData.map((item) => ({
      category: item.category,
      type: item.type,
      total: item._sum.amount || 0,
    }));

    const recordCount = await prisma.record.count({ where: activeFilter });

    res.json({
      totalIncome,
      totalExpenses,
      netBalance,
      recordCount,
      categoryBreakdown,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getRecentActivity = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const recentActivity = await prisma.record.findMany({
      where: { isDeleted: false },
      orderBy: { date: 'desc' },
      take: 10,
      select: {
        id: true,
        amount: true,
        type: true,
        category: true,
        date: true,
        notes: true,
      },
    });

    res.json({ recentActivity });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMonthlyTrends = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const records = await prisma.record.findMany({
      where: {
        isDeleted: false,
        date: { gte: sixMonthsAgo },
      },
      select: { amount: true, type: true, date: true },
      orderBy: { date: 'asc' },
    });

    const trendMap: Record<string, { income: number; expense: number }> = {};

    for (const record of records) {
      const monthKey = `${record.date.getFullYear()}-${String(record.date.getMonth() + 1).padStart(2, '0')}`;
      if (!trendMap[monthKey]) {
        trendMap[monthKey] = { income: 0, expense: 0 };
      }
      if (record.type === 'INCOME') {
        trendMap[monthKey].income += record.amount;
      } else {
        trendMap[monthKey].expense += record.amount;
      }
    }

    const trends = Object.entries(trendMap).map(([month, data]) => ({
      month,
      income: data.income,
      expense: data.expense,
      net: data.income - data.expense,
    }));

    res.json({ trends });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
