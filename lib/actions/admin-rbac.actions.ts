"use server"

import { revalidatePath, updateTag } from "next/cache"
import { z } from "zod"

import type { AccountStatus } from "@prisma/client"

import { prisma } from "@/db/prisma"
import { assertPermission, assertSuperAdmin } from "@/lib/auth-guard"
import { writeAudit } from "@/lib/audit"
import { canManageUser } from "@/lib/rbac"
import { formatError } from "@/lib/utils"
import type { ActionReturn } from "@/types"

const statusSchema = z.enum(["active", "inactive", "pending", "blocked"])

function revalidateUserViews() {
  revalidatePath("/admin/users")
  revalidatePath("/admin/deleted")
  updateTag("all-users")
}

async function latestAudit(targetType: string, targetId: string) {
  return prisma.auditLog.findFirst({
    where: { targetType, targetId },
    orderBy: { createdAt: "desc" },
    select: { ipAddress: true, location: true, actorRole: true },
  })
}

// ---- Activity summary (Admin + SuperAdmin dashboards) ----
export async function getActivitySummary() {
  await assertPermission("user.status.view")
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const onlineSince = new Date(Date.now() - 5 * 60 * 1000)

  const [total, online, inactive, blocked, newThisWeek] =
    await prisma.$transaction([
      prisma.user.count({ where: { isDeleted: false } }),
      prisma.user.count({
        where: { isDeleted: false, lastActiveAt: { gte: onlineSince } },
      }),
      prisma.user.count({
        where: { isDeleted: false, status: "inactive" },
      }),
      prisma.user.count({ where: { isDeleted: false, status: "blocked" } }),
      prisma.user.count({
        where: { isDeleted: false, createdAt: { gte: weekAgo } },
      }),
    ])

  return { total, online, inactive, blocked, newThisWeek }
}

// ---- Login history for a user ----
export async function getUserLoginHistory(userId: string) {
  await assertPermission("user.loginhistory.view")
  const id = z.string().uuid().parse(userId)
  return prisma.loginHistory.findMany({
    where: { userId: id },
    orderBy: { loginAt: "desc" },
    take: 50,
    select: {
      id: true,
      loginAt: true,
      logoutAt: true,
      ipAddress: true,
      device: true,
      browser: true,
      location: true,
      success: true,
    },
  })
}

// ---- Change account status ----
export async function updateUserStatus(
  userId: string,
  status: string,
): ActionReturn {
  try {
    const actor = await assertPermission("user.status.change")
    const id = z.string().uuid().parse(userId)
    const nextStatus = statusSchema.parse(status) as AccountStatus
    if (actor.id === id) throw new Error("You cannot change your own status")

    const target = await prisma.user.findUnique({
      where: { id },
      select: { role: true, status: true, isDeleted: true },
    })
    if (!target) throw new Error("User not found")
    if (target.isDeleted) throw new Error("Restore the user first")
    if (!canManageUser(actor.role, target.role)) {
      throw new Error("You cannot change the status of this account")
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: {
          status: nextStatus,
          updatedBy: actor.id,
          ...(nextStatus !== "active"
            ? { tokenVersion: { increment: 1 } }
            : {}),
        },
      })
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          actorRole: actor.role,
          action: "status_change",
          targetType: "user",
          targetId: id,
          oldValue: { status: target.status },
          newValue: { status: nextStatus },
        },
      })
    })

    revalidateUserViews()
    return { success: true, message: "User status updated" }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// ---- Restore a soft-deleted user (SuperAdmin) ----
export async function restoreUser(userId: string): ActionReturn {
  try {
    const actor = await assertSuperAdmin()
    const id = z.string().uuid().parse(userId)
    const target = await prisma.user.findUnique({
      where: { id },
      select: { isDeleted: true, deletedAt: true, deletedBy: true },
    })
    if (!target) throw new Error("User not found")
    if (!target.isDeleted) throw new Error("User is not deleted")

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: {
          isDeleted: false,
          deletedAt: null,
          deletedBy: null,
          updatedBy: actor.id,
        },
      })
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          actorRole: actor.role,
          action: "restore",
          targetType: "user",
          targetId: id,
          oldValue: { isDeleted: true },
          newValue: { isDeleted: false },
        },
      })
    })

    revalidateUserViews()
    return { success: true, message: "User restored" }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// ---- Permanent delete a user (SuperAdmin) ----
export async function permanentDeleteUser(
  userId: string,
  reason: string,
): ActionReturn {
  try {
    const actor = await assertSuperAdmin()
    const id = z.string().uuid().parse(userId)
    const safeReason = z.string().min(3).max(300).parse(reason)
    if (actor.id === id) throw new Error("You cannot permanently delete yourself")

    await prisma.$transaction(async (tx) => {
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          actorRole: actor.role,
          action: "permanent_delete",
          targetType: "user",
          targetId: id,
          reason: safeReason,
        },
      })
      await tx.user.delete({ where: { id } })
    })

    revalidateUserViews()
    return { success: true, message: "User permanently deleted" }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// ---- Deleted users list (SuperAdmin) ----
export async function getDeletedUsers() {
  await assertSuperAdmin()
  const users = await prisma.user.findMany({
    where: { isDeleted: true },
    orderBy: { deletedAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      lastLoginAt: true,
      lastActiveAt: true,
      deletedAt: true,
      deletedBy: true,
    },
  })

  const deletedByName = new Map<string, { name: string; role: string }>()
  const actorIds = [...new Set(users.map((u) => u.deletedBy).filter(Boolean))] as string[]
  if (actorIds.length) {
    const actors = await prisma.user.findMany({
      where: { id: { in: actorIds } },
      select: { id: true, name: true, role: true },
    })
    actors.forEach((a) => deletedByName.set(a.id, { name: a.name, role: a.role }))
  }

  return Promise.all(
    users.map(async (u) => {
      const audit = u.deletedBy
        ? await latestAudit("user", u.id)
        : null
      const actor = u.deletedBy ? deletedByName.get(u.deletedBy) : undefined
      return {
        ...u,
        deletedByActor: actor ?? null,
        deletedIp: audit?.ipAddress ?? null,
        deletedLocation: audit?.location ?? null,
      }
    }),
  )
}

// ---- Products: ownership change, restore, permanent, history (SuperAdmin) ----
export async function updateProductOwnership(
  productId: string,
  sellerId: string | null,
  reason: string,
): ActionReturn {
  try {
    const actor = await assertSuperAdmin()
    const id = z.string().uuid().parse(productId)
    const safeReason = z.string().min(3).max(300).parse(reason)
    const nextSeller = sellerId ? z.string().uuid().parse(sellerId) : null

    const target = await prisma.product.findUnique({
      where: { id },
      select: { sellerId: true, isDeleted: true },
    })
    if (!target) throw new Error("Product not found")
    if (target.isDeleted) throw new Error("Restore the product first")

    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: { sellerId: nextSeller, updatedBy: actor.id },
      })
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          actorRole: actor.role,
          action: "ownership_change",
          targetType: "product",
          targetId: id,
          oldValue: { sellerId: target.sellerId },
          newValue: { sellerId: nextSeller },
          reason: safeReason,
        },
      })
    })

    revalidatePath("/admin/products")
    return { success: true, message: "Product ownership updated" }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

export async function getProductHistory(productId: string) {
  await assertPermission("product.history.view")
  const id = z.string().uuid().parse(productId)
  const actor = await assertPermission("user.status.view")
  const product = await prisma.product.findUnique({
    where: { id },
    select: { sellerId: true, isDeleted: true },
  })
  if (!product) throw new Error("Product not found")
  if (actor.role === "seller" && product.sellerId !== actor.id) {
    throw new Error("You can only view your own products")
  }
  const logs = await prisma.auditLog.findMany({
    where: { targetType: "product", targetId: id },
    orderBy: { createdAt: "desc" },
    take: 100,
  })
  if (actor.role !== "super_admin") {
    return logs.slice(0, 1).map((l) => ({
      id: l.id,
      action: l.action,
      createdAt: l.createdAt,
      ipAddress: l.ipAddress,
      location: l.location,
    }))
  }
  return logs
}

export async function restoreProduct(productId: string): ActionReturn {
  try {
    const actor = await assertSuperAdmin()
    const id = z.string().uuid().parse(productId)
    const target = await prisma.product.findUnique({
      where: { id },
      select: { isDeleted: true },
    })
    if (!target?.isDeleted) throw new Error("Product is not deleted")
    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: { isDeleted: false, deletedAt: null, deletedBy: null, updatedBy: actor.id },
      })
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          actorRole: actor.role,
          action: "restore",
          targetType: "product",
          targetId: id,
          oldValue: { isDeleted: true },
          newValue: { isDeleted: false },
        },
      })
    })
    revalidatePath("/admin/products")
    revalidatePath("/admin/deleted")
    return { success: true, message: "Product restored" }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

export async function permanentDeleteProduct(
  productId: string,
  reason: string,
): ActionReturn {
  try {
    const actor = await assertSuperAdmin()
    const id = z.string().uuid().parse(productId)
    const safeReason = z.string().min(3).max(300).parse(reason)
    await prisma.$transaction(async (tx) => {
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          actorRole: actor.role,
          action: "permanent_delete",
          targetType: "product",
          targetId: id,
          reason: safeReason,
        },
      })
      await tx.product.delete({ where: { id } })
    })
    revalidatePath("/admin/deleted")
    return { success: true, message: "Product permanently deleted" }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

export async function getDeletedProducts() {
  await assertSuperAdmin()
  const products = await prisma.product.findMany({
    where: { isDeleted: true },
    orderBy: { deletedAt: "desc" },
    select: {
      id: true,
      name: true,
      images: true,
      description: true,
      price: true,
      stock: true,
      category: true,
      sellerId: true,
      createdAt: true,
      createdBy: true,
      updatedAt: true,
      updatedBy: true,
      deletedAt: true,
      deletedBy: true,
    },
  })
  return Promise.all(
    products.map(async (p) => {
      const audit = await latestAudit("product", p.id)
      return {
        ...p,
        price: p.price.toString(),
        deletedIp: audit?.ipAddress ?? null,
        deletedLocation: audit?.location ?? null,
      }
    }),
  )
}

// ---- Wishlist deletion (SuperAdmin) ----
export async function deleteWishlistItemAny(itemId: string): ActionReturn {
  try {
    const actor = await assertSuperAdmin()
    const id = z.string().uuid().parse(itemId)
    const item = await prisma.wishlistItem.findUnique({
      where: { id },
      select: { isDeleted: true },
    })
    if (!item) throw new Error("Wishlist item not found")
    if (item.isDeleted) throw new Error("Item already deleted")
    await prisma.$transaction(async (tx) => {
      await tx.wishlistItem.update({
        where: { id },
        data: { isDeleted: true, deletedAt: new Date(), deletedBy: actor.id },
      })
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          actorRole: actor.role,
          action: "delete",
          targetType: "wishlist_item",
          targetId: id,
          newValue: { isDeleted: true },
        },
      })
    })
    return { success: true, message: "Wishlist item deleted" }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

export async function permanentDeleteWishlistItem(
  itemId: string,
  reason: string,
): ActionReturn {
  try {
    const actor = await assertSuperAdmin()
    const id = z.string().uuid().parse(itemId)
    const safeReason = z.string().min(3).max(300).parse(reason)
    await prisma.$transaction(async (tx) => {
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          actorRole: actor.role,
          action: "permanent_delete",
          targetType: "wishlist_item",
          targetId: id,
          reason: safeReason,
        },
      })
      await tx.wishlistItem.delete({ where: { id } })
    })
    revalidatePath("/admin/deleted")
    return { success: true, message: "Wishlist item permanently deleted" }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

export async function getDeletedWishlists() {
  await assertSuperAdmin()
  const items = await prisma.wishlistItem.findMany({
    where: { isDeleted: true },
    orderBy: { deletedAt: "desc" },
    include: { product: true, wishlist: { include: { user: true } } },
  })
  return Promise.all(
    items.map(async (i) => {
      const audit = await latestAudit("wishlist_item", i.id)
      return {
        id: i.id,
        ownerName: i.wishlist.user.name,
        ownerEmail: i.wishlist.user.email,
        productName: i.product.name,
        productSlug: i.product.slug,
        price: i.product.price.toString(),
        addedAt: i.createdAt,
        deletedAt: i.deletedAt,
        deletedIp: audit?.ipAddress ?? null,
        deletedLocation: audit?.location ?? null,
      }
    }),
  )
}