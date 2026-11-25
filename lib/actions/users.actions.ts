"use server"

import { revalidatePath, unstable_cache, updateTag } from "next/cache"

import { Prisma, type User } from "@prisma/client"
import { z } from "zod"

import type {
  ActionReturn,
  PaymentMethod,
  ShippingAddress,
  UpdateUser,
} from "@/types"

import { prisma } from "@/db/prisma"

import {
  assertPermission,
  assertRole,
  isAdminRole,
} from "@/lib/auth-guard"
import { formatError } from "@/lib/utils"
import {
  paymentMethodSchema,
  shippingAddressSchema,
  updateProfileSchema,
  updateUserSchema,
} from "@/lib/validators"

import { PAGE_SIZE } from "@/constants"

// Get user by the ID
export async function getUserById(userId?: string) {
  const actor = await assertRole("admin", "seller", "customer")
  const targetId = userId ?? actor.id
  if (!isAdminRole(actor.role) && targetId !== actor.id) {
    throw new Error("Unauthorized action")
  }

  const user = await prisma.user.findUnique({
    where: { id: targetId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      address: true,
      paymentMethod: true,
      createdAt: true,
    },
  })
  if (!user) throw new Error("User not found")
  return user
}

// Update the user's address
export async function updateUserAddress(data: ShippingAddress): ActionReturn {
  try {
    const currentUser = await assertRole("admin", "seller", "customer")

    const address = shippingAddressSchema.parse(data)

    await prisma.user.update({
      where: { id: currentUser.id },
      data: { address },
    })

    return {
      success: true,
      message: "User updated successfully",
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// Update user's payment method
export async function updateUserPaymentMethod(
  data: PaymentMethod,
): ActionReturn {
  try {
    const currentUser = await assertRole("admin", "seller", "customer")

    const paymentMethod = paymentMethodSchema.parse(data)

    await prisma.user.update({
      where: { id: currentUser.id },
      data: { paymentMethod: paymentMethod.type },
    })

    return {
      success: true,
      message: "User updated successfully",
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// Update the user profile
export async function updateProfile(user: {
  name: string
  email: string
}): ActionReturn {
  try {
    const currentUser = await assertRole("admin", "seller", "customer")
    const profile = updateProfileSchema.parse(user)

    await prisma.user.update({
      where: {
        id: currentUser.id,
      },
      data: {
        name: profile.name,
      },
    })

    return {
      success: true,
      message: "User updated successfully",
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

type AdminUser = Pick<User, "id" | "name" | "email" | "role" | "createdAt">

const getAllUsersCached = unstable_cache(
  async ({
    limit = PAGE_SIZE,
    page,
    query,
  }: {
    limit?: number
    page: number
    query: string
  }): Promise<{ data: AdminUser[]; totalPages: number }> => {
    const safeLimit = Math.min(100, Math.max(1, Math.trunc(limit)))
    const safePage = Math.max(1, Math.trunc(page))
    const queryFilter: Prisma.UserWhereInput =
      query && query !== "all"
        ? {
            name: {
              contains: query,
              mode: "insensitive",
            } as Prisma.StringFilter,
          }
        : {}

    const data: AdminUser[] = await prisma.user.findMany({
      where: {
        ...queryFilter,
      },
      orderBy: { createdAt: "desc" },
      take: safeLimit,
      skip: (safePage - 1) * safeLimit,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    const dataCount = await prisma.user.count({
      where: {
        ...queryFilter,
      },
    })

    return {
      data,
      totalPages: Math.ceil(dataCount / safeLimit),
    }
  },
  ["getAllUsers"], // Cache key
  { revalidate: 60 * 60, tags: ["all-users"] },
)

// Get all users - admin
export async function getAllUsers(params: {
  limit?: number
  page: number
  query: string
}) {
  await assertPermission("users.view")
  const safePage = Number.isFinite(params.page)
    ? Math.max(1, Math.trunc(params.page))
    : 1
  const safeLimit =
    params.limit === undefined
      ? PAGE_SIZE
      : Number.isFinite(params.limit)
        ? Math.min(100, Math.max(1, Math.trunc(params.limit)))
        : PAGE_SIZE
  const query = z.string().max(120).parse(params.query)
  return getAllUsersCached({ ...params, limit: safeLimit, page: safePage, query })
}

// Delete a user
export async function deleteUser(id: string) {
  try {
    const actor = await assertPermission("users.manage")
    const targetId = z.string().uuid().parse(id)
    if (actor.id === targetId) {
      throw new Error("You cannot delete your own account")
    }

    const target = await prisma.user.findUnique({
      where: { id: targetId },
      select: { role: true },
    })
    if (!target) throw new Error("User not found")
    if (actor.role !== "super_admin" && isAdminRole(target.role)) {
      throw new Error("Only a super administrator can delete administrators")
    }

    await prisma.user.delete({ where: { id: targetId } })

    revalidatePath("/admin/users")
    updateTag("all-users")

    return {
      success: true,
      message: "User deleted successfully",
    }
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    }
  }
}

// Update a user
export async function updateUser(user: UpdateUser) {
  try {
    const actor = await assertPermission("users.manage")
    const parsedUser = updateUserSchema.parse(user)
    if (actor.id === parsedUser.id && actor.role !== parsedUser.role) {
      throw new Error("You cannot change your own role")
    }

    const target = await prisma.user.findUnique({
      where: { id: parsedUser.id },
      select: { role: true },
    })
    if (!target) throw new Error("User not found")
    if (
      actor.role !== "super_admin" &&
      (isAdminRole(target.role) || parsedUser.role === "admin")
    ) {
      throw new Error("Only a super administrator can manage administrator roles")
    }
    if (target.role !== "seller" && parsedUser.role === "seller") {
      throw new Error("Seller access is granted only after application approval")
    }

    await prisma.user.update({
      where: { id: parsedUser.id },
      data: {
        name: parsedUser.name,
        role: parsedUser.role,
      },
    })

    revalidatePath("/admin/users")
    updateTag("all-users")

    return {
      success: true,
      message: "User updated successfully",
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}
