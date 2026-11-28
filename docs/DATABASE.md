# Database

PostgreSQL (Neon) via Prisma. Schema: `prisma/schema.prisma`.

## Core models
- `User` — identity, `role`, `status`, activity fields, `tokenVersion`, soft-delete + audit fields.
- `Product` — catalog, `sellerId`, price/stock/rating, `isApproved/isArchived`, soft-delete + `createdBy/updatedBy`.
- `Wishlist` / `WishlistItem` — private per user; items soft-deletable; unique `(wishlistId, productId)`.
- `Order` / `OrderItem` / `SellerOrder` / `OrderStatusHistory` — multi-vendor orders.
- `Payment` / `Refund` / `Shipment` / `Commission` / `SellerPayout`.
- `Review`, `Coupon` / `CouponUsage`, `Notification`.
- `AuditLog` — actor, role, action, target, old/new value, reason, IP, location.
- `LoginHistory` — login/logout, IP, device, browser, location, success.
- `SecurityBlock` — blocked IPs.
- RBAC: `Role`, `Permission`, `RolePermission`.
- `SystemSetting`, `Account`, `Session`, `VerificationToken`, `Cart`/`CartItem`, `Store`, `Category`, `Brand`, `ProductVariant`/`ProductImage`/`Inventory`, `UserAddress`, `SellerApplication`/`SellerDocument`.

## Enums
`UserRole` (super_admin/admin/seller/customer), `AccountStatus` (active/inactive/pending/blocked), plus payment/refund/shipment/coupon/payout/seller statuses.

## Indexes (selected)
`User(isDeleted)`, `User(deletedAt)`, `User(deletedBy)`, `User(status)`, `User(lastActiveAt)`, `Product(isDeleted/deletedAt/deletedBy)`, `WishlistItem(isDeleted)`, `LoginHistory(userId, loginAt)`, `AuditLog(targetType, targetId, createdAt)`, `SecurityBlock(isActive)`.

## Migrations
- Local: `npx prisma migrate dev`.
- Production (Vercel prebuild): `node scripts/migrate-production.mjs` runs `prisma migrate deploy`; it is non-fatal on transient DB connectivity errors (migrations are expected to be already applied).
- Regenerate client after schema changes: `npm run db:generate`.

## Seeding
- `npm run db:seed`, `npm run db:seed-products`.
- `npx tsx db/seed-rbac.ts` seeds permissions, role mappings, and one account per role.