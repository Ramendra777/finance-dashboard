import { Request, Response } from 'express';
import { prisma } from '../db';
import { formatZodError, isPrismaNotFound } from '../utils/errors';
import { z } from 'zod';

export const listUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true, status: true, createdAt: true },
    });
    res.json({ users, total: users.length });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true, status: true, createdAt: true },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateUserSchema = z.object({
  role: z.enum(['VIEWER', 'ANALYST', 'ADMIN']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const data = updateUserSchema.parse(req.body);

    if (Object.keys(data).length === 0) {
      res.status(400).json({ error: 'At least one field (role or status) is required' });
      return;
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, role: true, status: true },
    });

    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: formatZodError(error) });
    } else if (isPrismaNotFound(error)) {
      res.status(404).json({ error: 'User not found' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};
