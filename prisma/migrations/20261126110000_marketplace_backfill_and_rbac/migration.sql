INSERT INTO "Role" ("id", "key", "name", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'super_admin', 'Super Administrator', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'admin', 'Administrator', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'seller', 'Seller', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'customer', 'Customer', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "Permission" ("id", "key", "description")
VALUES
  (gen_random_uuid(), 'dashboard.view', 'View administrative dashboard'),
  (gen_random_uuid(), 'products.manage', 'Manage the product catalog'),
  (gen_random_uuid(), 'orders.manage', 'Manage customer and seller orders'),
  (gen_random_uuid(), 'users.view', 'View customer accounts'),
  (gen_random_uuid(), 'users.manage', 'Manage customer accounts'),
  (gen_random_uuid(), 'sellerApplications.manage', 'Review seller applications'),
  (gen_random_uuid(), 'reviews.moderate', 'Moderate product reviews'),
  (gen_random_uuid(), 'finance.view', 'View commissions and payouts'),
  (gen_random_uuid(), 'finance.manage', 'Record seller payouts'),
  (gen_random_uuid(), 'rbac.manage', 'Manage roles and administrator permissions'),
  (gen_random_uuid(), 'seller.products.manage', 'Manage owned seller products'),
  (gen_random_uuid(), 'seller.orders.view', 'View owned seller order lines'),
  (gen_random_uuid(), 'seller.store.manage', 'Manage the seller store profile'),
  (gen_random_uuid(), 'seller.finance.view', 'View own commission and payout history'),
  (gen_random_uuid(), 'customer.orders.view', 'View own customer orders'),
  (gen_random_uuid(), 'customer.wishlist.manage', 'Manage own wishlist')
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT role."id", permission."id"
FROM "Role" role
CROSS JOIN "Permission" permission
WHERE role."key" = 'super_admin'
ON CONFLICT DO NOTHING;

INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT role."id", permission."id"
FROM "Role" role
JOIN "Permission" permission
  ON permission."key" IN (
    'dashboard.view',
    'products.manage',
    'orders.manage',
    'users.view',
    'users.manage',
    'sellerApplications.manage',
    'reviews.moderate',
    'finance.view'
  )
WHERE role."key" = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT role."id", permission."id"
FROM "Role" role
JOIN "Permission" permission
  ON permission."key" IN (
    'seller.products.manage',
    'seller.orders.view',
    'seller.store.manage',
    'seller.finance.view'
  )
WHERE role."key" = 'seller'
ON CONFLICT DO NOTHING;

INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT role."id", permission."id"
FROM "Role" role
JOIN "Permission" permission
  ON permission."key" IN (
    'customer.orders.view',
    'customer.wishlist.manage'
  )
WHERE role."key" = 'customer'
ON CONFLICT DO NOTHING;

WITH grouped_items AS (
  SELECT
    order_item."orderId",
    product."sellerId",
    SUM(order_item."price" * order_item."qty") AS "itemsPrice",
    BOOL_OR(customer_order."isDelivered") AS "isDelivered"
  FROM "OrderItem" order_item
  JOIN "Product" product ON product."id" = order_item."productId"
  JOIN "Order" customer_order ON customer_order."id" = order_item."orderId"
  WHERE order_item."sellerOrderId" IS NULL
  GROUP BY order_item."orderId", product."sellerId"
),
created_seller_orders AS (
  INSERT INTO "SellerOrder" (
    "id",
    "orderId",
    "sellerId",
    "status",
    "itemsPrice",
    "shippingPrice",
    "createdAt",
    "updatedAt"
  )
  SELECT
    gen_random_uuid(),
    grouped."orderId",
    grouped."sellerId",
    CASE WHEN grouped."isDelivered" THEN 'delivered'::"SellerOrderStatus"
         ELSE 'pending'::"SellerOrderStatus"
    END,
    grouped."itemsPrice",
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  FROM grouped_items grouped
  RETURNING "id", "orderId", "sellerId"
)
UPDATE "OrderItem" order_item
SET "sellerOrderId" = seller_order."id"
FROM created_seller_orders seller_order, "Product" product
WHERE product."id" = order_item."productId"
  AND seller_order."orderId" = order_item."orderId"
  AND seller_order."sellerId" IS NOT DISTINCT FROM product."sellerId";

INSERT INTO "OrderStatusHistory" ("id", "sellerOrderId", "status", "note", "createdAt")
SELECT
  gen_random_uuid(),
  seller_order."id",
  seller_order."status",
  'Backfilled from existing customer order',
  CURRENT_TIMESTAMP
FROM "SellerOrder" seller_order
WHERE NOT EXISTS (
  SELECT 1
  FROM "OrderStatusHistory" status_history
  WHERE status_history."sellerOrderId" = seller_order."id"
);
