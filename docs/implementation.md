# Implementation Details

This document covers the technical implementation details of the frontend, backend, and testing strategies.

## Frontend Implementation

### Framework & Styling

- **Next.js 15 & React 19**: Leverages the App Router (`app/` directory) for clean, component-based routing and server/client component separation.
- **Tailwind CSS & shadcn/ui**: Utilized for rapid UI development and accessible, pre-built components that conform to an established design system.

### State & Optimistic UI

UI state changes (like task toggling or creation) are implemented optimistically. This means the frontend state is updated immediately before the API response completes, providing a snappy user experience. In case of API failure, changes are rolled back.

### Routing Structure

- `/login`, `/signup`, `/verify-email`, `/forgot-password`, `/reset-password`: Authentication flows.
- `/tasks`: Primary dashboard for task management.
- `/workspaces`: For categorizing tasks.
- `/settings`: User preferences.

## Backend Implementation

### Framework

- **Express + TypeScript**: A robust API layer located within the `server/src` directory, typed heavily for developer confidence.
- **Zod Validation**: Payload validation is placed at the route boundary ensuring only strictly typed and validated data reaches the database controllers.

### Data Layer

- **Neon PostgreSQL + Sequelize**: Users, workspaces, and tasks are persisted in Postgres with Sequelize models and ownership indexes.
- **Serverless boot**: The Express app performs an idempotent database initialization before API routes, so local `server.ts` and Vercel Functions share the same app instance safely.

### Security

- **Helmet**: Adds standard security headers.
- **Express-Rate-Limit**: Prevents brute force attacks by limiting the number of requests per IP window.
- **Bcrypt**: For password hashing.
- **JWT**: Stateless token-based authentication mechanism.

### API Structuring

Routing is modularized by entity:

- `server/src/routes/auth.ts`: Registration, login, and email workflows.
- `server/src/routes/tasks.ts`: Core CRUD for tasks with ownership constraints.
- `server/src/routes/workspaces.ts`: Workspace management.

## Testing Strategy

Tests are executed utilizing the Jest framework combined with Supertest for API integration testing.

- **Postgres test database**: Tests use `DATABASE_URL_TEST` when provided, falling back to `DATABASE_URL`.
- **Nodemailer mock**: Email delivery is mocked so OTP and password reset flows can be tested without sending real mail.
- Target coverage is defined at ≥ 70% across all vital metrics (statements, branches, functions, lines).
