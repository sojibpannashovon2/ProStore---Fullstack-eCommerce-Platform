CREATE TYPE "UserRole" AS ENUM ('admin', 'seller', 'customer');

ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User"
  ALTER COLUMN "role" TYPE "UserRole"
  USING (
    CASE
      WHEN LOWER("role") IN ('admin', 'seller', 'customer') THEN LOWER("role")
      ELSE 'customer'
    END
  )::"UserRole";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'customer';

ALTER TABLE "Product" ADD COLUMN "sellerId" UUID;
ALTER TABLE "Product"
  ADD CONSTRAINT "Product_sellerId_fkey"
  FOREIGN KEY ("sellerId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Product_sellerId_createdAt_idx" ON "Product"("sellerId", "createdAt");
CREATE INDEX "Cart_sessionCartId_idx" ON "Cart"("sessionCartId");
CREATE INDEX "Cart_userId_idx" ON "Cart"("userId");
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");
CREATE INDEX "Order_userId_createdAt_idx" ON "Order"("userId", "createdAt");
CREATE INDEX "OrderItem_productId_orderId_idx" ON "OrderItem"("productId", "orderId");
