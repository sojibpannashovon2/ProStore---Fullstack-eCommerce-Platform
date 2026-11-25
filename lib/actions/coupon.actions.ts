"use server"

import { revalidatePath } from "next/cache"

import { z } from "zod"

import type { ActionReturn } from "@/types"

import { prisma } from "@/db/prisma"

import { assertPermission } from "@/lib/auth-guard"
import { formatError } from "@/lib/utils"

const couponInputSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3)
      .max(40)
      .regex(/^[A-Za-z0-9_-]+$/)
      .transform((value) => value.toUpperCase()),
    discountType: z.enum(["percentage", "fixed"]),
    discountValue: z.coerce.number().positive().max(100000000),
    minimumAmount: z.preprocess(
      (value) => (value === "" || value == null ? undefined : value),
      z.coerce.number().nonnegative().optional(),
    ),
    usageLimit: z.preprocess(
      (value) => (value === "" || value == null ? undefined : value),
      z.coerce.number().int().positive().optional(),
    ),
    startsAt: z.string().optional(),
    expiresAt: z.string().optional(),
  })
  .refine(
    (coupon) =>
      coupon.discountType !== "percentage" || coupon.discountValue <= 100,
    {
      message: "Percentage discounts cannot exceed 100%",
      path: ["discountValue"],
    },
  )

export async function createCoupon(input: unknown): ActionReturn {
  try {
    const actor = await assertPermission("coupons.manage")
    const coupon = couponInputSchema.parse(input)
    const startsAt = coupon.startsAt ? new Date(coupon.startsAt) : null
    const expiresAt = coupon.expiresAt ? new Date(coupon.expiresAt) : null
    if (startsAt && !Number.isFinite(startsAt.getTime())) {
      throw new Error("Invalid coupon start date")
    }
    if (expiresAt && !Number.isFinite(expiresAt.getTime())) {
      throw new Error("Invalid coupon expiry date")
    }
    if (startsAt && expiresAt && startsAt >= expiresAt) {
      throw new Error("Coupon expiry must be after its start date")
    }

    await prisma.coupon.create({
      data: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue.toFixed(2),
        minimumAmount: coupon.minimumAmount?.toFixed(2),
        usageLimit: coupon.usageLimit,
        startsAt,
        expiresAt,
      },
    })
    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        action: "coupon.created",
        targetType: "Coupon",
        targetId: coupon.code,
        metadata: { discountType: coupon.discountType },
      },
    })
    revalidatePath("/admin/coupons")
    return { success: true, message: "Coupon created" }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

export async function setCouponActive(
  id: string,
  isActive: boolean,
): ActionReturn {
  try {
    const actor = await assertPermission("coupons.manage")
    const couponId = z.string().uuid().parse(id)
    const active = z.boolean().parse(isActive)
    const coupon = await prisma.coupon.update({
      where: { id: couponId },
      data: { isActive: active },
      select: { code: true },
    })
    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        action: active ? "coupon.activated" : "coupon.deactivated",
        targetType: "Coupon",
        targetId: couponId,
        metadata: { code: coupon.code },
      },
    })
    revalidatePath("/admin/coupons")
    return {
      success: true,
      message: active ? "Coupon activated" : "Coupon deactivated",
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}
