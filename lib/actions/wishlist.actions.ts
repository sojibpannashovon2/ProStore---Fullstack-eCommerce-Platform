"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { prisma } from "@/db/prisma"
import { assertRole } from "@/lib/auth-guard"
import { writeAudit } from "@/lib/audit"
import { convertToPlainObject } from "@/lib/utils"

export async function toggleWishlistItem(productId: string) {
  const customer = await assertRole("customer")
  const id = z.string().uuid().parse(productId)

  const product = await prisma.product.findFirst({
    where: { id, isDeleted: false },
    select: { id: true },
  })
  if (!product) throw new Error("Product not found")

  const wishlist = await prisma.wishlist.upsert({
    where: { userId: customer.id },
    create: { userId: customer.id },
    update: {},
    select: { id: true },
  })
  const key = {
    wishlistId_productId: { wishlistId: wishlist.id, productId: id },
  }
  const existing = await prisma.wishlistItem.findUnique({
    where: key,
    select: { id: true, isDeleted: true },
  })

  if (existing && !existing.isDeleted) {
    await prisma.wishlistItem.update({
      where: { id: existing.id },
      data: { isDeleted: true, deletedAt: new Date(), deletedBy: customer.id },
    })
    await writeAudit({
      actorId: customer.id,
      actorRole: customer.role,
      action: "delete",
      targetType: "wishlist_item",
      targetId: existing.id,
      oldValue: { isDeleted: false },
      newValue: { isDeleted: true },
    })
  } else if (existing) {
    await prisma.wishlistItem.update({
      where: { id: existing.id },
      data: { isDeleted: false, deletedAt: null, deletedBy: null },
    })
  } else {
    await prisma.wishlistItem.create({
      data: { wishlistId: wishlist.id, productId: id },
    })
  }

  revalidatePath("/user/wishlist")
  return { isWishlisted: !(existing && !existing.isDeleted) }
}

export async function getMyWishlist() {
  const customer = await assertRole("customer")
  const wishlist = await prisma.wishlist.findUnique({
    where: { userId: customer.id },
    select: {
      items: {
        where: { isDeleted: false, product: { isDeleted: false } },
        orderBy: { createdAt: "desc" },
        select: { product: true },
      },
    },
  })

  return convertToPlainObject(wishlist?.items.map((item) => item.product) ?? [])
}

export async function isProductWishlisted(productId: string) {
  const customer = await assertRole("customer")
  const id = z.string().uuid().parse(productId)
  const item = await prisma.wishlistItem.findFirst({
    where: { wishlist: { userId: customer.id }, productId: id, isDeleted: false },
    select: { productId: true },
  })
  return Boolean(item)
}