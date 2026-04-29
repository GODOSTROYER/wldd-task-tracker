import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import authRoutes from './routes/auth';
import taskRoutes from './routes/tasks';
import workspaceRoutes from './routes/workspaces';
import { errorHandler } from './middleware/errorHandler';
import { connectDB } from './config';

const app = express();
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(helmet());

if (process.env.NODE_ENV !== 'test') {
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 100 }));
}

app.use(async (_req, _res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use(errorHandler);

export default app;
