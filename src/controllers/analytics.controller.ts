import { Response } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth.middleware';

export const getDashboardSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const incomeAgg = await prisma.record.aggregate({
      _sum: { amount: true },
      where: { type: 'INCOME' },
    });

    const expenseAgg = await prisma.record.aggregate({
      _sum: { amount: true },
      where: { type: 'EXPENSE' },
    });

    const totalIncome = incomeAgg._sum.amount || 0;
    const totalExpenses = expenseAgg._sum.amount || 0;
    const netBalance = totalIncome - totalExpenses;

    const categoryBreakdownData = await prisma.record.groupBy({
      by: ['category', 'type'],
      _sum: { amount: true },
    });

    const categoryBreakdown = categoryBreakdownData.map((item) => ({
      category: item.category,
      type: item.type,
      total: item._sum.amount || 0,
    }));

    res.json({
      totalIncome,
      totalExpenses,
      netBalance,
      categoryBreakdown,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getRecentActivity = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const recentActivity = await prisma.record.findMany({
      orderBy: { date: 'desc' },
      take: 10,
      select: {
        id: true,
        amount: true,
        type: true,
        category: true,
        date: true,
      },
    });

    res.json({ recentActivity });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
