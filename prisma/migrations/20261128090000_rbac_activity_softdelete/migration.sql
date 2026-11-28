-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('active', 'inactive', 'pending', 'blocked');

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "actorRole" TEXT,
ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "newValue" JSON,
ADD COLUMN     "oldValue" JSON,
ADD COLUMN     "reason" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "createdBy" UUID,
ADD COLUMN     "deletedAt" TIMESTAMP(6),
ADD COLUMN     "deletedBy" UUID,
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updatedBy" UUID;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "createdBy" UUID,
ADD COLUMN     "deletedAt" TIMESTAMP(6),
ADD COLUMN     "deletedBy" UUID,
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastActiveAt" TIMESTAMP(6),
ADD COLUMN     "lastLoginAt" TIMESTAMP(6),
ADD COLUMN     "lastLoginIp" TEXT,
ADD COLUMN     "lastLoginLocation" TEXT,
ADD COLUMN     "status" "AccountStatus" NOT NULL DEFAULT 'active',
ADD COLUMN     "tokenVersion" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedBy" UUID;

-- AlterTable
ALTER TABLE "WishlistItem" DROP CONSTRAINT "WishlistItem_pkey",
ADD COLUMN     "deletedAt" TIMESTAMP(6),
ADD COLUMN     "deletedBy" UUID,
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD CONSTRAINT "WishlistItem_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "LoginHistory" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "loginAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "logoutAt" TIMESTAMP(6),
    "ipAddress" TEXT,
    "device" TEXT,
    "browser" TEXT,
    "location" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "LoginHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LoginHistory_userId_loginAt_idx" ON "LoginHistory"("userId", "loginAt");

-- CreateIndex
CREATE INDEX "Product_isDeleted_idx" ON "Product"("isDeleted");

-- CreateIndex
CREATE INDEX "Product_deletedAt_idx" ON "Product"("deletedAt");

-- CreateIndex
CREATE INDEX "Product_deletedBy_idx" ON "Product"("deletedBy");

-- CreateIndex
CREATE INDEX "User_isDeleted_idx" ON "User"("isDeleted");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- CreateIndex
CREATE INDEX "User_deletedBy_idx" ON "User"("deletedBy");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "User_lastActiveAt_idx" ON "User"("lastActiveAt");

-- CreateIndex
CREATE INDEX "WishlistItem_isDeleted_idx" ON "WishlistItem"("isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "WishlistItem_wishlistId_productId_key" ON "WishlistItem"("wishlistId", "productId");

-- AddForeignKey
ALTER TABLE "LoginHistory" ADD CONSTRAINT "LoginHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;