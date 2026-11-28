# Kinora — Full-Stack eCommerce Platform

Kinora is a production-grade, multi-vendor eCommerce platform built with **Next.js 16 (App Router, Turbopack)**, **React 19**, **Prisma**, **PostgreSQL (Neon)**, **TailwindCSS v4**, and **Auth.js (NextAuth v5)**. It includes a storefront, customer account area, seller onboarding, admin & SuperAdmin dashboards, role-based access control, audit logging, soft-delete, a custom AI shopping agent, and multiple payment gateways.

**Live:** https://pro-store-fullstack-e-commerce-plat.vercel.app
**Repository:** https://github.com/sojibpannashovon2/ProStore---Fullstack-eCommerce-Platform

> Full documentation lives in [`docs/`](./docs/README.md). This README is the complete overview.

---

## Table of Contents

1. [Features](#features)
2. [Roles & Permissions](#roles--permissions)
3. [Security](#security)
4. [AI Shopping Agent (Kinora)](#ai-shopping-agent-kinora)
5. [Tech Stack](#tech-stack)
6. [Project Structure](#project-structure)
7. [Getting Started](#getting-started)
8. [Environment Variables](#environment-variables)
9. [Database & Migrations](#database--migrations)
10. [Seeded Accounts](#seeded-accounts)
11. [Deployment](#deployment)
12. [Scripts](#scripts)
13. [Documentation Index](#documentation-index)
14. [License](#license)

---

## Features

### Storefront
- Product discovery with search, category/brand/price/rating filters and sorting.
- Rich product pages: image galleries, reviews, stock status, seller info.
- Guest cart that merges into the user cart on login; live price totals.
- 3-step checkout: Shipping → Payment → Review, with order tracking.
- Wishlist (private per user, soft-delete aware).
- AI shopping assistant panel (bilingual English / Bangla).

### Payments
- **PayPal**, **Stripe**, **SSLCommerz** (bKash/Nagad, default), **Cash on Delivery**.
- Server-validated coupons (dates, minimum spend, caps, usage limits).

### Admin Dashboard
- Analytics: revenue, orders, customers, products, sales chart.
- Product management (view/create/edit/soft-delete) with approval workflow.
- Order management, coupons, categories, seller applications.
- User management with activity status, online/offline, login history, status changes.
- **Deleted Items** page (SuperAdmin only) and **Security** page.

### Seller Dashboard
- Create/manage only their own products; stock & price control.
- Process only their own seller orders; view own sales.
- Onboarding via application + encrypted document uploads.

### Bangla (বাংলা) Localization
- Full UI translation (English / Bangla) with a locale switch.
- Currency auto-converts: Bangla → ৳ BDT, English → $ USD (admin + storefront).

---

## Roles & Permissions

Roles: **User (customer)**, **Seller**, **Admin**, **SuperAdmin**. Permissions are enforced **server-side** (see [`lib/rbac.ts`](./lib/rbac.ts) and [`lib/auth-guard.ts`](./lib/auth-guard.ts)).

| Capability | User | Seller | Admin | SuperAdmin |
|---|:--:|:--:|:--:|:--:|
| Browse / cart / checkout / reviews | ✓ | ✓ | ✓ | ✓ |
| Own wishlist (view/add/remove) | ✓ | ✓ | ✓ | ✓ |
| Create product | | ✓ | ✓ | ✓ |
| Update own product | | ✓ | | |
| Update any product | | | ✓ | ✓ |
| Soft-delete product | | own | ✓ | ✓ |
| Restore / permanent delete | | | | ✓ |
| Reassign product ownership (with reason) | | | | ✓ |
| View product edit history | | own (latest) | latest | full |
| Manage users (status, role, delete) | | | users/sellers | everyone |
| Assign Admin/SuperAdmin role | | | | ✓ |
| View activity & login history | own | own | all | all |
| View Deleted Items / restore / permanent | | | | ✓ |
| Wishlist delete (any) | | | | ✓ |
| Security (block IP, alerts) | | | ✓ | ✓ |
| Audit logs | | | | ✓ |

**Role-change rules:** a role may only assign roles below its own; only SuperAdmin can create/change Admin or SuperAdmin; every change is written to `audit_logs`.

---

## Security

- **Credentials auth** with bcrypt password hashing; passwords never returned by any API.
- **Session invalidation**: `tokenVersion` + per-request status re-check — blocked/inactive/deleted users are rejected immediately and existing sessions are invalidated.
- **IP blocking** (`SecurityBlock`) enforced at sign-in.
- **Brute-force detection**: 5+ failed logins in 15 min → audit alert + in-app notification to SuperAdmins + **email alert** (Resend) to the SuperAdmin inbox.
- **Rate limiting** on sign-in (10 / 15 min) and the AI endpoint (20 / min).
- **IDOR protection**: users can only touch their own wishlist; sellers only their own products.
- **Audit logging** with actor, role, old/new values, reason, IP and approximate location for every important action.
- **Soft delete** everywhere (`is_deleted / deleted_at / deleted_by`); only SuperAdmin can view/restore/permanent-delete.

See [`docs/RBAC-AND-SECURITY.md`](./docs/RBAC-AND-SECURITY.md).

---

## AI Shopping Agent (Kinora)

A custom, deterministic bilingual agent (`lib/ai/custom-shopping-agent.ts`) powers the storefront assistant, with an optional local Ollama model when available. It supports 25+ intents including: recommendations, comparisons, budget/price-range, category & brand browse, top-rated, newest, in/out-of-stock, product details, similar items, deals, rating-threshold, category counts, gift finder, shipping/returns, support contact, order status, sort-by-name, cheapest-per-brand, care/how-to, and more.

See [`docs/FEATURES.md`](./docs/FEATURES.md#ai-shopping-agent).

---

## Tech Stack

**Frontend:** Next.js 16 (App Router, Turbopack), React 19, ShadCN/UI, TailwindCSS v4, React Hook Form + Zod.
**Backend:** Prisma ORM, PostgreSQL (Neon), Auth.js (NextAuth v5, JWT + DB role checks), server actions & route handlers.
**Payments:** Stripe, PayPal, SSLCommerz, COD.
**Email:** Resend.
**Storage:** Neon Object Storage (S3-compatible) for product images; local fallback.

---

## Project Structure

```
app/            # App Router: storefront, (auth), admin, seller, user, api
components/     # Shared UI (header, footer, tables, dialogs, admin widgets)
lib/            # Auth, RBAC, audit, activity, security, AI agent, actions, i18n
lib/actions/    # Server actions (auth, users, products, orders, wishlist, security, admin-rbac)
db/             # Prisma client, seeders, promote-super-admin
prisma/         # schema.prisma + migrations
scripts/        # migrate-production.mjs (prebuild)
types/          # Shared types + next-auth augmentation
docs/           # Full documentation
proxy.ts        # NextAuth middleware (route protection)
```

---

## Getting Started

### Prerequisites
- Node.js 18+ (Node 20+ recommended)
- A PostgreSQL database (Neon recommended)
- Optional: Stripe/PayPal/SSLCommerz/Resend/Neon Object Storage credentials

### Install
```bash
git clone https://github.com/sojibpannashovon2/ProStore---Fullstack-eCommerce-Platform.git
cd ProStore---Fullstack-eCommerce-Platform
npm install
cp .env.example .env   # then fill in values
```

### Database
```bash
npm run db:generate        # generate Prisma client
npx prisma migrate dev     # apply migrations (local)
npm run db:seed            # optional sample data
npm run db:seed-products   # optional expanded demo catalog
npx tsx db/seed-rbac.ts    # seed roles, permissions, and one account per role
```

### Run
```bash
npm run dev     # http://localhost:3000
npm run build   # production build (runs prebuild migration)
npm run start   # serve production build
```

---

## Environment Variables

Copy `.env.example` → `.env`. Key variables (full list in [`docs/ENVIRONMENT.md`](./docs/ENVIRONMENT.md)):

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Neon) |
| `AUTH_SECRET` | Token signing secret |
| `AUTH_TRUST_HOST` | `true` to trust host (required on Vercel) |
| `ENCRYPTION_KEY` | ≥32-char secret for encrypting sensitive data |
| `NEXT_PUBLIC_USD_TO_BDT_RATE` | USD→BDT rate (default 123) |
| `PAYMENT_METHODS` / `DEFAULT_PAYMENT_METHOD` | Enabled gateways / default |
| `SSLCOMMERZ_STORE_ID` / `SSLCOMMERZ_STORE_PASSWORD` / `SSLCOMMERZ_SANDBOX` | SSLCommerz |
| `PAYPAL_*`, `STRIPE_*` | PayPal / Stripe |
| `AWS_*` (Neon Object Storage) | Product image storage |
| `RESEND_API_KEY`, `SENDER_EMAIL` | Email + security alerts |
| `SUPER_ADMIN_ALERT_EMAIL`, `ALERT_FROM_EMAIL` | Security alert recipient/from |
| `OLLAMA_BASE_URL`, `OLLAMA_MODEL` | Optional local AI model |

---

## Database & Migrations

Models include `User`, `Product`, `Wishlist`/`WishlistItem`, `Order`, `OrderItem`, `SellerOrder`, `Payment`, `Review`, `AuditLog`, `LoginHistory`, `SecurityBlock`, RBAC tables (`Role`, `Permission`, `RolePermission`), and more. See [`docs/DATABASE.md`](./docs/DATABASE.md).

- Soft-delete + audit fields on users, products, wishlist items.
- Indexes on `is_deleted`, `deleted_at`, `deleted_by`, `users(status)`, `users(last_active_at)`, `login_history(user_id, login_at)`, `audit_logs(target_type, target_id)`.
- On Vercel, `prebuild` runs `prisma migrate deploy` (non-fatal on transient DB connectivity errors).

---

## Seeded Accounts

Created by `db/seed-rbac.ts` (change passwords after first login):

| Role | Email | Password |
|---|---|---|
| SuperAdmin | `mdarifur554@gmail.com` | (your own) |
| Admin | `admin@kinora.com` | `Admin@2026` |
| Seller | `seller@kinora.com` | `Seller@2026` |
| User | `customer@kinora.com` | `Customer@2026` |

---

## Deployment

Deploy to **Vercel** (project already linked). Set environment variables in the Vercel dashboard, then:

```bash
vercel --prod
```

The production build applies pending Prisma migrations before building. See [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md).

---

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build (prebuild migration + `next build`) |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |
| `npm run db:generate` | Prisma client generate |
| `npm run db:studio` | Prisma Studio |
| `npm run db:seed` / `db:seed-products` | Seed data |
| `npm run db:promote-super-admin` | Bootstrap SuperAdmin from `SUPER_ADMIN_EMAIL` |

---

## Documentation Index

- [Overview](./docs/README.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [Features](./docs/FEATURES.md)
- [RBAC & Security](./docs/RBAC-AND-SECURITY.md)
- [Database](./docs/DATABASE.md)
- [Environment](./docs/ENVIRONMENT.md)
- [Deployment](./docs/DEPLOYMENT.md)

---

## License

MIT. See [LICENSE](./LICENSE).