"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { prisma } from "@/db/prisma"
import { assertRole } from "@/lib/auth-guard"
import { convertToPlainObject } from "@/lib/utils"

export async function toggleWishlistItem(productId: string) {
  const customer = await assertRole("customer")
  const id = z.string().uuid().parse(productId)

  const product = await prisma.product.findUnique({
    where: { id },
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
    select: { productId: true },
  })

  if (existing) {
    await prisma.wishlistItem.delete({ where: key })
  } else {
    await prisma.wishlistItem.create({
      data: { wishlistId: wishlist.id, productId: id },
    })
  }

  revalidatePath("/user/wishlist")
  return { isWishlisted: !existing }
}

export async function getMyWishlist() {
  const customer = await assertRole("customer")
  const wishlist = await prisma.wishlist.findUnique({
    where: { userId: customer.id },
    select: {
      items: {
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
    where: { wishlist: { userId: customer.id }, productId: id },
    select: { productId: true },
  })
  return Boolean(item)
}
