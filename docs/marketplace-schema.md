# Marketplace data model

## Architecture and decisions

The application remains a Next.js modular monolith backed by PostgreSQL and
Prisma. Domain boundaries are implemented as server-only modules and actions;
this avoids duplicating the current authentication, checkout, and deployment
stack in a new NestJS service.

The existing `Order` is the customer checkout (parent order). A checkout that
contains products from multiple sellers creates one `SellerOrder` per seller,
with seller-specific items, fulfillment status, shipment, and commission
records. The parent keeps the customer-facing payment and total; seller views
must query only their seller order and never expose unrelated items or buyer
contact information.

Seller verification requires administrator review and the seller must provide
the selected business-license, government-ID, and tax-document evidence.
Document records keep AES-256-GCM encrypted file bytes in PostgreSQL, plus
review metadata, not public download URLs. The encryption key is derived from
`ENCRYPTION_KEY`; uploads are rejected if it is missing or shorter than 32
characters. Document access must be authorized and audited. Payouts are manual
administrator-recorded entries. No commission percentage has been selected,
so commission configuration must be explicit and payouts must remain blocked
until a valid rate is configured.

Cash on Delivery remains available. bKash and Nagad are offered through the
existing SSLCommerz provider integration; payment-provider code stays behind a
provider boundary. Never store raw card details or trust client-submitted
prices, stock, commission, or payment status.

## Entities and relationships

| Domain | Entities | Relationships and constraints |
| --- | --- | --- |
| Identity and RBAC | `User`, `Role`, `Permission`, `RolePermission` | A user has a base account role. Roles grant named permissions through a join table; only a super administrator can manage administrator accounts and role-permission assignments. Authorization is checked on the server against current database state. |
| Seller onboarding | `SellerApplication`, `SellerDocument`, `Store` | A user can submit seller applications; each application has a review state and private document records. A verified seller owns one store. Approval is an administrator-only action. |
| Catalog | `Category`, `Brand`, `Product`, `ProductImage`, `ProductVariant`, `Inventory` | A product belongs to an optional category and brand record and an optional seller/store. Product images and variants are child records. Each variant has a unique SKU; inventory is tracked per variant. Product approval is required for seller listings; archived products retain their order history. |
| Shopping | `Cart`, `CartItem`, `Wishlist`, `WishlistItem` | A customer owns one active cart and wishlist. Cart quantities reference a product/variant; the server reloads current price and stock during checkout. |
| Orders | `Order`, `SellerOrder`, `OrderItem`, `OrderStatusHistory` | `Order` is the customer checkout/payment group. It has one or more seller orders; each seller order contains only that seller's items and owns fulfillment status and shipping. Order items snapshot product name, SKU, unit price, and quantity so later catalog changes do not rewrite history. |
| Payments and delivery | `Payment`, `Refund`, `Shipment` | A payment belongs to the parent order and records provider references/status. Refunds reference a payment and optionally a seller order/item. A shipment belongs to one seller order. Provider callbacks must be signature-verified and idempotent. |
| Promotions | `Coupon`, `CouponUsage` | Coupons have server-validated dates, limits, and discount rules; usage is recorded transactionally against a customer/order. |
| Customer feedback | `Review` | A review belongs to a customer and product, is optionally tied to a verified purchase, and can be moderated by an authorized administrator. |
| Finance | `Commission`, `SellerPayout` | Commission is calculated from server-owned order item totals and a configured rate. Payout entries are manual, auditable, and cannot exceed the seller's payable balance. |
| Operations | `Notification`, `AuditLog`, `SystemSetting` | Notifications belong to a user. Audit events record actor, action, target, and timestamp without secrets or document contents. Settings hold configuration such as commission rate and payment/shipping policy. |

Use UUID primary keys, foreign keys, unique constraints for natural identifiers
(email, slug, SKU, permission key, coupon code), and indexes for ownership,
status, and time-based listing queries. Use soft deletion only for user-facing
catalog and store records where historical order snapshots must remain intact;
financial and audit records are immutable.

Coupon codes are normalized to uppercase. Percentage discounts are capped at
100%, fixed discounts cannot exceed the item subtotal, and configured minimum
spend, start/expiry dates, global usage limit, and one-use-per-customer checks
are enforced again during order placement. Coupon usage is committed with the
order so failed stock or coupon validation leaves no partial order.

## Transaction boundaries

1. **Checkout:** in one database transaction, validate the customer cart,
   reload product/variant prices, lock or conditionally decrement inventory,
   create the parent order and per-seller orders/items, record coupon usage and
   commission snapshots, and clear the cart. Roll back all changes on any
   stock, pricing, or coupon failure.
2. **Payment:** verify provider signatures outside the write transaction, then
   use an idempotency key and a transaction to update payment/order state.
   Never accept a browser redirect as proof of payment.
3. **Fulfillment:** authorize the seller against each seller order, append
   status history, and update shipment state in one transaction. Parent order
   status is derived from all child seller orders.
4. **Refunds and payouts:** validate remaining refundable/payable balances,
   append immutable ledger records, and update related state atomically.
   Manual payout confirmation records the administrator and external reference.
5. **Seller verification and RBAC:** store application/document review changes
   and audit records together. Only the super administrator may grant
   administrator access or change administrator permissions.

## Migration and compatibility

The current schema is intentionally small: products have a nullable seller,
orders contain all checkout items, and roles are an enum. New tables and
relations should be additive first. Existing orders remain parent orders and
existing order items are assigned to seller orders using the product's current
seller where possible; historical records without an owner must be treated as
unassigned rather than guessed. Keep existing checkout and payment routes
working during backfill, and do not drop legacy fields until all reads and
writes use the new model.

The migration must be reviewed against the live database before deployment.
The first marketplace migration adds the model tables and encrypted document
fields; the following data migration seeds role permissions and backfills
seller orders for existing order items using their current product ownership.
Document bytes are stored encrypted at rest and served only through an
administrator-authorized, audited download route. Database backups must also
be encrypted and the encryption key must be managed separately from the
database.
