process.env.JWT_SECRET ||= 'test_secret';
process.env.SMTP_HOST ||= 'smtp.example.com';
process.env.SMTP_PORT ||= '587';
process.env.SMTP_USER ||= 'test@example.com';
process.env.SMTP_PASS ||= 'test-password';
process.env.FROM_EMAIL ||= 'test@example.com';
process.env.FRONTEND_URL ||= 'http://localhost:3000';

jest.setTimeout(60000);

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-message-id' }),
  }),
}));

import { sequelize } from '../config';
import Task from '../models/Task';
import Workspace from '../models/Workspace';
import User from '../models/User';
import '../models';

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterEach(async () => {
  await sequelize.query('TRUNCATE TABLE "tasks", "workspaces", "users" RESTART IDENTITY CASCADE');
});

afterAll(async () => {
  await sequelize.close();
});
