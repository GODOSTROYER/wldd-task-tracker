# Architecture

- Express API with layered architecture:
  - **Routes**: HTTP wiring only
  - **Controllers**: business logic
  - **Models**: Sequelize/Postgres entities
  - **Middleware**: auth, validation, centralized error handling
- Task tenancy enforced by `ownerId` checks in every task query.
- JWT Bearer auth protects task/workspace endpoints.
- Input validation via Zod request middleware.
