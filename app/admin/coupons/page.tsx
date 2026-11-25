import type { Metadata } from "next"

import { prisma } from "@/db/prisma"

import { requirePermission } from "@/lib/auth-guard"

import { CouponManager } from "./_components/coupon-manager"

export const metadata: Metadata = {
  title: "Coupon Management",
}

export default async function AdminCouponsPage() {
  await requirePermission("coupons.manage")
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { _count: { select: { usages: true } } },
  })
  const couponRows = coupons.map((coupon) => ({
    id: coupon.id,
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue.toString(),
    minimumAmount: coupon.minimumAmount?.toString() ?? null,
    usageLimit: coupon.usageLimit,
    expiresAt: coupon.expiresAt?.toISOString() ?? null,
    isActive: coupon.isActive,
    _count: coupon._count,
  }))

  return (
    <div className="space-y-4">
      <h1 className="h2-bold">Coupon management</h1>
      <CouponManager coupons={couponRows} />
    </div>
  )
}
