import { z } from 'zod';

export const formatZodError = (error: z.ZodError) => {
  return error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
};

export const isPrismaNotFound = (error: unknown): boolean => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as any).code === 'P2025'
  );
};
