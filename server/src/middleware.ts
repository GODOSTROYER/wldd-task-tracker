/**
 * @file middleware.ts — Authentication and Redis caching middleware
 *
 * Exports:
 *   authMiddleware         — Express middleware that verifies JWT Bearer tokens
 *   AuthRequest            — Extended Request type with `user.id` populated by auth
 *   getCachedTasks(userId) — Read cached task list from Redis
 *   setCachedTasks(userId) — Write task list to Redis (TTL: 5 min)
 *   invalidateCache(userId)— Delete cached task list from Redis
 *
 * Cache functions are designed to fail silently — a Redis outage should
 * never break an API request, it just bypasses caching.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import redis from './config';

// ─── Auth Middleware ──────────────────────────────────────────────────────────

/** Extended Express Request with authenticated user payload. */
export interface AuthRequest extends Request {
  user?: { id: string };
}

/** Verify JWT Bearer token and attach `req.user`. Returns 401 on failure. */
function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
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
}

export default authMiddleware;

// ─── Redis Cache Helpers ──────────────────────────────────────────────────────

const CACHE_TTL = 300; // 5 minutes

/** Read cached tasks JSON for a user, or null on miss/error. */
export async function getCachedTasks(userId: string): Promise<string | null> {
  try {
    return await redis.get(`tasks:user:${userId}`);
  } catch {
    return null;
  }
}

/** Write tasks JSON to Redis with a 5-minute TTL. */
export async function setCachedTasks(userId: string, data: string): Promise<void> {
  try {
    await redis.setex(`tasks:user:${userId}`, CACHE_TTL, data);
  } catch {
    // Caching failure should not break the request
  }
}

/** Delete cached tasks for a user (called after any write operation). */
export async function invalidateCache(userId: string): Promise<void> {
  try {
    await redis.del(`tasks:user:${userId}`);
  } catch {
    // Invalidation failure should not break the request
  }
}
