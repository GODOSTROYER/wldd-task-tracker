import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

// Mock ioredis with ioredis-mock before any imports that use it
jest.mock('ioredis', () => {
  const RedisMock = require('ioredis-mock');
  return RedisMock;
});

// Mock Resend so tests don't send real emails
jest.mock('resend', () => {
  return {
    Resend: jest.fn().mockImplementation(() => ({
      emails: {
        send: jest.fn().mockResolvedValue({ id: 'mock-email-id' }),
      },
    })),
  };
});

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterEach(async () => {
  // Clear all collections between tests
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }

  // Clear redis mock
  const Redis = require('ioredis');
  const redis = new Redis();
  await redis.flushall();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});
