-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "sku" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "isApproved" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "Product_isApproved_createdAt_idx" ON "Product"("isApproved", "createdAt");
