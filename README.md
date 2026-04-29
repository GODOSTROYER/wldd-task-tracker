# ProductSpace Task Tracker (Screening Branch)

This branch (`productspacescreening`) updates the app to align with the Full Stack Developer Intern screening requirements.

## Stack
- Frontend: Next.js (React) + Tailwind
- Backend: Node.js + Express + TypeScript
- Database: **Neon PostgreSQL** via **Sequelize ORM**
- Auth: bcrypt password hashing + JWT

## Backend architecture
```
server/src
├── controllers/
├── middleware/
├── models/
├── routes/
├── app.ts
└── server.ts
```

## Requirement mapping
- Signup/Login: `/api/auth/signup`, `/api/auth/login`
- Password hashing: Sequelize `User` hooks with bcrypt
- JWT auth + protected routes: `authMiddleware`
- OTP verification: `/api/auth/verify-email`, `/api/auth/resend-otp`
- Multi-user workspaces/tasks: rows owned by `ownerId`; all reads/writes filtered by owner
- Kanban tasks: `todo`, `in-progress`, `in-review`, `completed`, plus priority, due date, and position
- Validation: Zod-based `validate` middleware
- Error handling: centralized `errorHandler`
- DB schema: PostgreSQL tables for users, tasks, workspaces

## Environment variables
### Local backend (`server/.env`)
- `PORT=5000`
- `DATABASE_URL=postgresql://<user>:<password>@<host>/<db>?sslmode=require`
- `JWT_SECRET=<strong-secret>`
- `SMTP_HOST=smtp.gmail.com`
- `SMTP_PORT=587`
- `SMTP_USER=<smtp-user>`
- `SMTP_PASS=<smtp-password>`
- `FROM_EMAIL=<verified-sender>`
- `FROM_NAME=Task Tracker`
- `FRONTEND_URL=http://localhost:3000`

### Frontend (`.env.local`)
- `NEXT_PUBLIC_API_BASE_URL=http://localhost:5000`

In Vercel production, leave `NEXT_PUBLIC_API_BASE_URL` unset so the app uses same-origin `/api`.

## Run
```bash
cd server
npm install
npm run dev

# in root
npm install
npm run dev
```

## Neon setup
1. Create a Neon project/database.
2. Copy the pooled connection string to `DATABASE_URL`.
3. Start backend; Sequelize auto-syncs tables on boot.

## Vercel deployment
- Root project: `task-tracker`
- Project name: `productspace-task-tracker`
- Build command: `npm --prefix server run build && npm run build`
- Install command: `npm install && npm --prefix server install`
