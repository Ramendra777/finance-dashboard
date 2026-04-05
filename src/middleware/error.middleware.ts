import { Request, Response, NextFunction } from 'express';

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({ error: 'Endpoint not found' });
};

export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Error]:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
};
