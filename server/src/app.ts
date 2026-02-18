import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import taskRoutes from './routes/tasks';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

export default app;
