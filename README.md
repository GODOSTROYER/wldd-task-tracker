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
- Multi-user tasks: task rows owned by `ownerId`; all reads/writes filtered by owner
- Validation: Zod-based `validate` middleware
- Error handling: centralized `errorHandler`
- DB schema: PostgreSQL tables for users, tasks, workspaces

## Environment variables
### Backend (`server/.env`)
- `PORT=5000`
- `DATABASE_URL=postgresql://<user>:<password>@<host>/<db>?sslmode=require`
- `JWT_SECRET=<strong-secret>`
- `REDIS_URL=redis://localhost:6379`

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
2. Copy pooled connection string to `DATABASE_URL`.
3. Start backend; Sequelize auto-syncs tables on boot.
