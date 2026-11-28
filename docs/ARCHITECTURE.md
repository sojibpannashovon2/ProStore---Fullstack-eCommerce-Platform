# Architecture

## Runtime

- **Framework:** Next.js 16 App Router with Turbopack. Server Components by default; `"use client"` for interactive widgets.
- **Auth:** Auth.js (NextAuth v5) with a credentials provider and JWT sessions, backed by database role/status checks.
- **Data:** Prisma ORM over PostgreSQL (Neon). Server Actions and Route Handlers for mutations.
- **Styling/UI:** TailwindCSS v4 + ShadCN components. Toasts via `sonner`.

## Request flow

1. `proxy.ts` (NextAuth middleware) protects routes and seeds a `sessionCartId` cookie.
2. Server Components call `requireAdmin()` / `requirePermission()` from `lib/auth-guard.ts`.
3. `getCurrentUser()` loads the DB user, rejects deleted/non-active users, and validates `tokenVersion` (instant session invalidation). It also throttles `last_active_at` updates.
4. Mutations run as Server Actions (`lib/actions/*`) or Route Handlers (`app/api/*`), validate input with Zod, enforce permissions, write `audit_logs`, and revalidate caches.

## Key modules

| Path | Responsibility |
|---|---|
| `auth.ts` / `auth.config.ts` | NextAuth config, authorize, jwt/session callbacks |
| `lib/auth-guard.ts` | Role/permission guards, current user, session invalidation |
| `lib/rbac.ts` | Permission matrix, role hierarchy helpers |
| `lib/audit.ts` | `writeAudit()` with IP/location |
| `lib/activity.ts` | Online status, throttled activity, login history, brute-force alerts |
| `lib/security/*` | IP blocklist, rate limit, request metadata, email alerts |
| `lib/ai/custom-shopping-agent.ts` | Bilingual AI shopping agent |
| `lib/actions/*` | Server actions |
| `proxy.ts` | Route protection middleware |

## Multi-vendor model

Products belong to a seller (`sellerId`). Orders split into per-seller `SellerOrder` records with their own status, commission, shipment, and payout. Buyers see their own orders; sellers see only their own items.