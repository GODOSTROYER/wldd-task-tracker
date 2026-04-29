import dotenv from 'dotenv';
import { Sequelize, SyncOptions } from 'sequelize';

dotenv.config();
dotenv.config({ path: 'server/.env' });

// Make the Postgres driver explicit so Vercel's function tracer includes it.
const pg = require('pg');

const databaseUrl = process.env.NODE_ENV === 'test'
  ? process.env.DATABASE_URL_TEST || process.env.DATABASE_URL
  : process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn('DATABASE_URL is not set. Backend will fail to boot until it is provided.');
}

export const sequelize = new Sequelize(databaseUrl || 'postgres://postgres:postgres@localhost:5432/task_tracker', {
  dialect: 'postgres',
  dialectModule: pg,
  logging: false,
  pool: {
    max: 3,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  dialectOptions: databaseUrl?.includes('neon.tech')
    ? { ssl: { require: true, rejectUnauthorized: false } }
    : undefined,
});

let connectionPromise: Promise<void> | null = null;

export async function connectDB(syncOptions: SyncOptions = {}): Promise<void> {
  if (connectionPromise && Object.keys(syncOptions).length === 0) {
    return connectionPromise;
  }

  connectionPromise = initializeDatabase(syncOptions);
  return connectionPromise;
}

async function initializeDatabase(syncOptions: SyncOptions): Promise<void> {
  await import('./models');
  await sequelize.authenticate();
  await sequelize.sync(syncOptions);
  console.log('PostgreSQL connected');
}
