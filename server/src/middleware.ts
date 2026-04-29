import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import redis from './config';

export interface AuthRequest extends Request { user?: { id: string }; }

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return void res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET || 'change_me') as { id: string };
    req.user = { id: decoded.id };
    next();
  } catch { res.status(401).json({ message: 'Invalid or expired token' }); }
}

const CACHE_TTL = 300;
export async function getCachedTasks(userId: string) { try { return await redis.get(`tasks:user:${userId}`); } catch { return null; } }
export async function setCachedTasks(userId: string, data: string) { try { await redis.setex(`tasks:user:${userId}`, CACHE_TTL, data); } catch {} }
export async function invalidateCache(userId: string) { try { await redis.del(`tasks:user:${userId}`); } catch {} }
