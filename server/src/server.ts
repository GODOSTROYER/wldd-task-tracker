import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import connectDB from './config/db';
import redis from './config/redis';

const PORT = process.env.PORT || 5000;

async function start(): Promise<void> {
  try {
    await connectDB();
    await redis.connect();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
