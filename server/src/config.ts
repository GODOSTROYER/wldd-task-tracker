/**
 * @file config.ts — Database and Redis connection setup
 *
 * Exports:
 *   connectDB()  — Connects to MongoDB via Mongoose
 *   redis        — Pre-configured ioredis client (lazy connect)
 *
 * Both connections log status on connect/error for observability.
 * Redis uses lazy connect so the caller controls when `.connect()` is called.
 */

import mongoose from 'mongoose';
import Redis from 'ioredis';

// ─── MongoDB ──────────────────────────────────────────────────────────────────

/** Connect to MongoDB using the MONGO_URI env var (falls back to localhost). */
export async function connectDB(): Promise<void> {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/mini-task-tracker';
  await mongoose.connect(uri);
  console.log('MongoDB connected');
}

// ─── Redis ────────────────────────────────────────────────────────────────────

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err.message);
});

redis.on('connect', () => {
  console.log('Redis connected');
});

export default redis;
