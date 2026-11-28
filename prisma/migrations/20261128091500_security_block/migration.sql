-- CreateTable
CREATE TABLE "SecurityBlock" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ip" TEXT NOT NULL,
    "reason" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" UUID,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SecurityBlock_ip_key" ON "SecurityBlock"("ip");

-- CreateIndex
CREATE INDEX "SecurityBlock_isActive_idx" ON "SecurityBlock"("isActive");