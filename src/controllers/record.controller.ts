import { Request, Response } from 'express';
import { prisma } from '../db';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';

const recordSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.string().min(1),
  date: z.string().datetime(), // ISO 8601 string
  notes: z.string().optional(),
});

const partialRecordSchema = recordSchema.partial();

export const createRecord = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = recordSchema.parse(req.body);
    const userId = req.user!.id; // from auth middleware

    const record = await prisma.record.create({
      data: {
        ...data,
        userId,
      },
    });

    res.status(201).json({ message: 'Record created successfully', record });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: (error as any).errors });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const getRecords = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type, category, startDate, endDate } = req.query as {
      type?: string;
      category?: string;
      startDate?: string;
      endDate?: string;
    };

    const whereClause: any = {};
    if (type) whereClause.type = type;
    if (category) whereClause.category = category;
    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date.gte = new Date(startDate);
      if (endDate) whereClause.date.lte = new Date(endDate);
    }

    const records = await prisma.record.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
      include: { user: { select: { id: true, email: true } } }
    });

    res.json({ records });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getRecordById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const record = await prisma.record.findUnique({
      where: { id },
      include: { user: { select: { id: true, email: true } } }
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

    const record = await prisma.record.update({
      where: { id },
      data,
    });

    res.json({ message: 'Record updated successfully', record });
  } catch (error) {
    // Handling Prisma not found error gracefully would use error.code === 'P2025'
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: (error as any).errors });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const deleteRecord = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    await prisma.record.delete({
      where: { id },
    });

    res.json({ message: 'Record deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
