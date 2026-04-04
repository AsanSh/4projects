# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Project: BuildFlow PropTech Platform

A comprehensive PropTech platform for property and rental management, targeting construction companies and real estate developers in Kazakhstan. Full-stack app with React+Vite frontend, Express 5 backend, PostgreSQL with Drizzle ORM.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec in `lib/api-spec/openapi.yaml`)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite, Tailwind CSS, shadcn/ui, wouter routing, TanStack Query

## Packages

- `artifacts/api-server` — Express 5 API server (port 8080)
- `artifacts/proptech` — React+Vite frontend
- `lib/db` — Drizzle ORM schema + migrations
- `lib/api-spec` — OpenAPI YAML specification
- `lib/api-client-react` — Auto-generated React hooks from OpenAPI spec

## Key Commands

```bash
# Run DB push
pnpm --filter @workspace/db run push

# Run DB seed
cd lib/db && /path/to/tsx src/seed.ts

# Regenerate API client from OpenAPI spec
pnpm --filter @workspace/api-client-react run codegen

# Build API server
pnpm --filter @workspace/api-server run build
```

## Database Schema (15 tables)

- `companies` — Construction companies
- `users` — System users with roles (admin, manager, staff)
- `counterparties` — Buyers/clients (individual or company)
- `properties` — Real estate units (apartment, office, commercial, etc.)
- `contracts` — Sales contracts
- `documents` — Document attachments
- `import_jobs` — Excel import batch jobs
- `tenants` — Rental tenants
- `lease_contracts` — Rental lease contracts
- `accruals` — Monthly rental accruals
- `payments` — Rent payments
- `deposits` — Security deposits
- `expenses` — Property expenses
- `owner_statements` — Owner financial statements
- `activity_log` — System activity log

## Authentication

- Session-based authentication using in-memory Map
- Passwords hashed with SHA-256 + "proptech_salt"
- Default admin: `admin@buildflow.kz` / `admin123`

## API Routes

Registered under `artifacts/api-server/src/routes/`:
- `auth.ts` — Login, logout, current user
- `companies.ts` — CRUD companies
- `users.ts` — CRUD users
- `counterparties.ts` — CRUD counterparties
- `properties.ts` — CRUD properties
- `contracts.ts` — CRUD contracts
- `documents.ts` — CRUD documents
- `import.ts` — Excel import (preview + commit)
- `rental.ts` — Tenants, leases, accruals, payments, deposits, expenses, statements, rental-properties
- `dashboard.ts` — Summary stats, activity feed, rental overview

## Frontend Pages

Under `artifacts/proptech/src/pages/`:
- `login.tsx` — Authentication
- `dashboard.tsx` — Analytics dashboard
- `companies.tsx` — Company management
- `users.tsx` — User management
- `properties.tsx` — Property management
- `counterparties.tsx` — Counterparty/client management
- `rental/tenants.tsx` — Tenant management (CRUD)
- `rental/leases.tsx` — Lease contract management
- `rental/accruals.tsx` — Monthly accruals view
- `rental/payments.tsx` — Payment registration
- `rental/deposits.tsx` — Deposit management
- `rental/expenses.tsx` — Property expense tracking
- `rental/rental-properties.tsx` — Rental property overview

## Seeded Data

- 1 company: BuildFlow KZ
- 1 admin user: admin@buildflow.kz
- 2 counterparties: Иванов Иван Иванович, ТОО "Казстрой Инвест"
- 4 properties: А-101 (available), Б-205 (sold), О-301 (office), В-403 (reserved)
- 2 tenants: Петров Петр Петрович, Садыкова Айгерим Болатовна

## Notes

- All numeric DB fields use `numeric()` type, returned as strings — parse with `parseFloat()` in routes
- Default currency: KZT (Kazakhstan Tenge)
- Frontend uses `wouter` for routing with `import.meta.env.BASE_URL` base path
- API server listens on port 8080 (set via `PORT` env var)
