import { round2 } from "@/lib/utils"

type CouponPricingInput = {
  discountType: "percentage" | "fixed"
  discountValue: { toString(): string } | number | string
  minimumAmount: { toString(): string } | number | string | null
  startsAt: Date | null
  expiresAt: Date | null
  isActive: boolean
}

export function calculateCouponDiscount(
  coupon: CouponPricingInput,
  itemsPrice: number,
  now = new Date(),
) {
  if (!coupon.isActive) throw new Error("This coupon is not active")
  if (coupon.startsAt && coupon.startsAt > now) {
    throw new Error("This coupon is not active yet")
  }
  if (coupon.expiresAt && coupon.expiresAt < now) {
    throw new Error("This coupon has expired")
  }
  if (
    coupon.minimumAmount &&
    itemsPrice < Number(coupon.minimumAmount.toString())
  ) {
    throw new Error("Your cart does not meet the coupon minimum")
  }

  const value = Number(coupon.discountValue.toString())
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("This coupon has an invalid discount")
  }
  if (coupon.discountType === "percentage" && value > 100) {
    throw new Error("This coupon has an invalid percentage")
  }

  return round2(
    Math.min(
      itemsPrice,
      coupon.discountType === "percentage" ? (itemsPrice * value) / 100 : value,
    ),
  )
}
