import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: { id: string };
}

const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  const token = header.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET || 'change_me_to_a_strong_secret';
    const decoded = jwt.verify(token, secret) as { id: string };
    req.user = { id: decoded.id };
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export default authMiddleware;
