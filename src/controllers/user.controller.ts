import { Request, Response } from 'express';
import { prisma } from '../db';
import { z } from 'zod';

export const listUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true, status: true, createdAt: true },
    });
    res.json({ users });
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

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, role: true, status: true },
    });

    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: (error as any).errors });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};
