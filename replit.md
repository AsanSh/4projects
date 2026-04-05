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

## Authentication & Multi-Tenancy (SaaS)

- **Registration**: `POST /auth/register` creates company + admin user atomically; returns JWT token
- Session-based auth using in-memory Map; token → userId → companyId
- Passwords hashed with SHA-256 + "proptech_salt"
- Default admin: `admin@buildflow.kz` / `admin123`
- **Middleware**: `requireAuth` — validates token, sets req.userId/companyId/userRole; `requireRole("admin")` — role guard
- **Tenant isolation**: ALL data routes filter by `companyId` from session; users can only see their own org's data
- **Roles**: admin (full CRUD + user management), manager/staff (read + limited write)

## API Routes

All routes require `Authorization: Bearer <token>` (via `requireAuth` middleware).
Registered under `artifacts/api-server/src/routes/`:
- `auth.ts` — Login, logout, register (create org+admin), /auth/me
- `companies.ts` — GET/PATCH /companies/my (org settings); cross-tenant access forbidden
- `users.ts` — Org-scoped user management; admin-only create/update/delete
- `counterparties.ts` — CRUD, filtered by companyId
- `properties.ts` — CRUD, filtered by companyId
- `contracts.ts` — CRUD, filtered by companyId
- `documents.ts` — CRUD, filtered by companyId
- `import.ts` — Excel import (preview + commit), filtered by companyId
- `rental.ts` — Tenants, leases, accruals, payments, deposits, expenses, statements, rental-properties — all filtered by companyId
- `dashboard.ts` — Summary stats, activity feed, rental overview — filtered by companyId
- `activity.ts` — Activity log (GET/POST), filtered by companyId

## Frontend Pages

Under `artifacts/proptech/src/pages/`:
- `login.tsx` — Authentication (with "Зарегистрировать компанию" link)
- `register.tsx` — 2-step SaaS registration (org data → admin data)
- `settings.tsx` — Org settings (admin: edit company; any user: view profile)
- `dashboard.tsx` — Main analytics dashboard (KPI + AI recommendations + recent ops)
- `companies.tsx` — Company management
- `users.tsx` — User management (admin-only create/edit/delete)
- `properties.tsx` — Property management (реестр объектов)
- `counterparties.tsx` — Counterparty/client management (full CRUD)
- `import-center.tsx` — Excel Import Center (XLSX upload, preview, validate, commit, history)
- `activity-log.tsx` — System activity log (grouped by date, filterable)
- `rental/rental-dashboard.tsx` — Rental-specific dashboard (KPI + pending accruals + recent payments)
- `rental/tenants.tsx` — Tenant management (CRUD)
- `rental/leases.tsx` — Lease contract management
- `rental/accruals.tsx` — Monthly accruals (approve/cancel)
- `rental/payments.tsx` — Payment registration
- `rental/deposits.tsx` — Deposit management
- `rental/expenses.tsx` — Property expense tracking
- `rental/rental-properties.tsx` — Rental property overview
- `rental/statements.tsx` — Owner statements (generate + list)

## Sidebar Navigation Groups

- (ungrouped): Главный дашборд
- Аренда: Дашборд аренды, Объекты, Арендаторы, Договоры аренды
- Финансы: Начисления, Платежи, Депозиты, Расходы, Акты собственников
- Справочники: Контрагенты, Компании, Сотрудники, Объекты (реестр)
- Система: Центр импорта, Лог активности, Настройки

## Seeded Data

- 1 company: BuildFlow KZ
- 1 admin user: admin@buildflow.kz
- 2 counterparties: Иванов Иван Иванович, ТОО "Казстрой Инвест"
- 4 properties: А-101 (available), Б-205 (sold), О-301 (office), В-403 (reserved)
- 2 tenants: Петров Петр Петрович, Садыкова Айгерим Болатовна

## Notes

- All numeric DB fields use `numeric()` type, returned as strings — parse with `parseFloat()` in routes
- Default currency: KGS (Kyrgyz Som) — formatCurrency uses ru-KG locale
- Frontend uses `wouter` for routing with `import.meta.env.BASE_URL` base path
- API server listens on port 8080 (set via `PORT` env var)
