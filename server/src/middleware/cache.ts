import redis from '../config/redis';

const CACHE_TTL = 300; // 5 minutes

/**
 * Get cached tasks for a user.
 */
export async function getCachedTasks(userId: string): Promise<string | null> {
  try {
    return await redis.get(`tasks:user:${userId}`);
  } catch {
    return null;
  }
}

/**
 * Set cached tasks for a user.
 */
export async function setCachedTasks(userId: string, data: string): Promise<void> {
  try {
    await redis.setex(`tasks:user:${userId}`, CACHE_TTL, data);
  } catch {
    // Caching failure should not break the request
  }
}

/**
 * Invalidate cached tasks for a user.
 */
export async function invalidateCache(userId: string): Promise<void> {
  try {
    await redis.del(`tasks:user:${userId}`);
  } catch {
    // Invalidation failure should not break the request
  }
}
