import { NextFunction, Request, Response } from 'express';

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) { super(message); this.statusCode = statusCode; }
}

export const asyncHandler = (fn: any) => (req: Request, res: Response, next: NextFunction) => Promise.resolve(fn(req, res, next)).catch(next);

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const status = err?.statusCode || 500;
  res.status(status).json({ message: err.message || 'Server error' });
}
