import { Response } from 'express';
import { prisma } from '../db';
import { formatZodError, isPrismaNotFound } from '../utils/errors';
import { AuthRequest } from '../middleware/auth.middleware';
import { z } from 'zod';

const recordSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.string().min(1),
  date: z.string().datetime(),
  notes: z.string().optional(),
});

const partialRecordSchema = recordSchema.partial();

export const createRecord = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = recordSchema.parse(req.body);
    const userId = req.user!.id;

    const record = await prisma.record.create({
      data: { ...data, userId },
    });

    res.status(201).json({ message: 'Record created successfully', record });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: formatZodError(error) });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const getRecords = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type, category, startDate, endDate, search } = req.query as {
      type?: string;
      category?: string;
      startDate?: string;
      endDate?: string;
      search?: string;
    };

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const whereClause: any = { isDeleted: false };
    if (type) whereClause.type = type;
    if (category) whereClause.category = category;
    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date.gte = new Date(startDate);
      if (endDate) whereClause.date.lte = new Date(endDate);
    }
    if (search) {
      whereClause.OR = [
        { category: { contains: search } },
        { notes: { contains: search } },
      ];
    }

    const [records, totalCount] = await Promise.all([
      prisma.record.findMany({
        where: whereClause,
        orderBy: { date: 'desc' },
        skip,
        take: limit,
        include: { user: { select: { id: true, email: true } } },
      }),
      prisma.record.count({ where: whereClause }),
    ]);

    res.json({
      records,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getRecordById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const record = await prisma.record.findFirst({
      where: { id, isDeleted: false },
      include: { user: { select: { id: true, email: true } } },
    });

    if (!record) {
      res.status(404).json({ error: 'Record not found' });
      return;
    }

    res.json({ record });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateRecord = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const data = partialRecordSchema.parse(req.body);

    const existing = await prisma.record.findFirst({ where: { id, isDeleted: false } });
    if (!existing) {
      res.status(404).json({ error: 'Record not found' });
      return;
    }

    const record = await prisma.record.update({
      where: { id },
      data,
    });

    res.json({ message: 'Record updated successfully', record });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: formatZodError(error) });
    } else if (isPrismaNotFound(error)) {
      res.status(404).json({ error: 'Record not found' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const deleteRecord = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.record.findFirst({ where: { id, isDeleted: false } });
    if (!existing) {
      res.status(404).json({ error: 'Record not found' });
      return;
    }

    await prisma.record.update({
      where: { id },
      data: { isDeleted: true },
    });

    res.json({ message: 'Record deleted successfully' });
  } catch (error) {
    if (isPrismaNotFound(error)) {
      res.status(404).json({ error: 'Record not found' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};
