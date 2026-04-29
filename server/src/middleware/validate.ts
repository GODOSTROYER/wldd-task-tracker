import { NextFunction, Request, Response } from 'express';
import { z, ZodTypeAny } from 'zod';

export const validate = (schema: ZodTypeAny) => (req: Request, res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ message: 'Validation error', errors: result.error.flatten().fieldErrors });
  req.body = result.data;
  next();
};

export { z };
