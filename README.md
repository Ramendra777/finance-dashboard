# Finance Data Processing and Access Control Backend

A Node.js backend built with Express, TypeScript, Prisma ORM, and SQLite — designed to process financial data securely through Role-Based Access Control (RBAC).

## Features

- **JWT Authentication**: Stateless token-based auth with password hashing via bcrypt.
- **Role-Based Access Control**: Three roles (`VIEWER`, `ANALYST`, `ADMIN`) enforced at middleware level.
- **Financial Records CRUD**: Create, read, update, and soft-delete records with Zod validation.
- **Filtering & Pagination**: Query records by type, category, and date range with page/limit controls.
- **Dashboard Analytics**: Aggregated summaries, category breakdowns, recent activity, and monthly trends.
- **Soft Delete**: Records are marked as deleted rather than permanently removed.
- **Search Support**: Full-text search across categories and notes.
- **Rate Limiting**: Protection against brute-force attacks and abuse.
- **Test Suite**: Comprehensive automated integration tests using Jest and Supertest.
- **Seed Script**: Pre-populates the database with realistic demo data for evaluation.

## RBAC Matrix

| Action | VIEWER | ANALYST | ADMIN |
|---|:---:|:---:|:---:|
| View dashboard & trends | ✅ | ✅ | ✅ |
| View own profile (`/me`) | ✅ | ✅ | ✅ |
| Read financial records | ❌ | ✅ | ✅ |
| Create/update/delete records | ❌ | ❌ | ✅ |
| Manage users & roles | ❌ | ❌ | ✅ |

## Getting Started

### Prerequisites
- Node.js v18+
- npm

### Installation

```bash
npm install
npx prisma generate
npx prisma db push
npm run seed
npm run dev
```

The server starts at `http://localhost:3000`.

### Environment Variables

Copy `.env.example` to `.env`. Defaults work out of the box:

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | `file:./dev.db` | SQLite database path |
| `JWT_SECRET` | (set in .env) | Token signing secret |
| `PORT` | `3000` | Server port |

### Seed Data

Running `npm run seed` creates:

| Email | Password | Role |
|---|---|---|
| admin@finance.com | password123 | ADMIN |
| analyst@finance.com | password123 | ANALYST |
| viewer@finance.com | password123 | VIEWER |
| inactive@finance.com | password123 | VIEWER (INACTIVE) |

Plus 14 financial records spanning January–April 2026 across categories like Salary, Rent, Freelance, Utilities, Groceries, and Insurance.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start with hot-reload |
| `npm run build` | Compile TypeScript |
| `npm start` | Run compiled output |
| `npm run seed` | Populate demo data |
| `npm run test` | Run automated test suite |

## API Endpoints

Base URL: `http://localhost:3000/api`

### Authentication

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | None | Register (always assigns VIEWER role) |
| POST | `/auth/login` | None | Login and receive JWT |
| GET | `/auth/me` | Any | Get current user profile |

### Users (ADMIN only)

| Method | Path | Description |
|---|---|---|
| GET | `/users` | List all users |
| GET | `/users/:id` | Get user by ID |
| PATCH | `/users/:id` | Update role or status |

### Financial Records

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/records` | ADMIN, ANALYST | List with filters and pagination |
| GET | `/records/:id` | ADMIN, ANALYST | Get single record |
| POST | `/records` | ADMIN | Create record |
| PATCH | `/records/:id` | ADMIN | Update record |
| DELETE | `/records/:id` | ADMIN | Soft-delete record |

**Query parameters for `GET /records`:**
- `type` — Filter by `INCOME` or `EXPENSE`
- `category` — Filter by category name
- `startDate` / `endDate` — ISO date range filter
- `search` — Full-text search across categories and notes
- `page` — Page number (default: 1)
- `limit` — Records per page (default: 20, max: 100)

### Dashboard (All authenticated users)

| Method | Path | Description |
|---|---|---|
| GET | `/dashboard/summary` | Total income, expenses, net balance, category breakdown |
| GET | `/dashboard/recent` | Last 10 transactions |
| GET | `/dashboard/trends` | Monthly income/expense/net for last 6 months |

## Project Structure

```
src/
├── controllers/          # Request handlers
│   ├── auth.controller.ts
│   ├── user.controller.ts
│   ├── record.controller.ts
│   └── analytics.controller.ts
├── middleware/            # Auth guards and error handling
│   ├── auth.middleware.ts
│   └── error.middleware.ts
├── routes/               # Route definitions
│   ├── auth.routes.ts
│   ├── user.routes.ts
│   ├── record.routes.ts
│   └── analytics.routes.ts
├── utils/                # Shared helpers
│   ├── auth.ts
│   └── errors.ts
├── db.ts                 # Prisma client instance
├── app.ts                # Express app configuration
└── server.ts             # Entry point
prisma/
├── schema.prisma         # Database schema
└── seed.ts               # Demo data seeder
```

## Design Decisions

- **SQLite + Prisma**: Chosen for zero-config portability. Switching to PostgreSQL requires only changing the `provider` in `schema.prisma` and the connection string.
- **Zod validation**: Input validation happens inside controllers using Zod schemas, providing both runtime checks and TypeScript type inference in a single declaration.
- **Soft delete**: Records set `isDeleted: true` instead of being removed, preserving audit trails. All queries automatically exclude soft-deleted records.
- **Role security**: Registration always assigns `VIEWER`. Only admins can escalate roles via `PATCH /users/:id`. This prevents privilege escalation attacks.
- **Separation of concerns**: Routes define access rules, controllers handle request/response logic, Prisma handles data access. No business logic leaks across layers.

## Error Response Format

All errors follow a consistent structure:

```json
{
  "error": "Human-readable message",
  "details": [{ "field": "amount", "message": "Expected number, received string" }]
}
```

Status codes used: `200`, `201`, `400`, `401`, `403`, `404`, `409`, `500`.
