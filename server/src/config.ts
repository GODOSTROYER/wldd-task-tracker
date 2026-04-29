import { Sequelize } from 'sequelize';
import Redis from 'ioredis';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn('DATABASE_URL is not set. Backend will fail to boot until it is provided.');
}

export const sequelize = new Sequelize(databaseUrl || 'postgres://postgres:postgres@localhost:5432/task_tracker', {
  dialect: 'postgres',
  logging: false,
  dialectOptions: databaseUrl?.includes('neon.tech')
    ? { ssl: { require: true, rejectUnauthorized: false } }
    : undefined,
});

export async function connectDB(): Promise<void> {
  await sequelize.authenticate();
  await sequelize.sync();
  console.log('PostgreSQL connected');
}

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = new Redis(redisUrl, { maxRetriesPerRequest: 3, lazyConnect: true });
export default redis;
