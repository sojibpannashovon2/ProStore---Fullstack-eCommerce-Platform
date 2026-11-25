"use server"

import { revalidatePath, updateTag } from "next/cache"
import { z } from "zod"

import { prisma } from "@/db/prisma"
import { assertSuperAdmin } from "@/lib/auth-guard"
import { formatError } from "@/lib/utils"

const userRoleSchema = z.enum(["admin", "customer"])
const permissionKeysSchema = z
  .array(z.string().min(1).max(100))
  .max(50)
  .refine((keys) => new Set(keys).size === keys.length)

export async function getAdminRoleConfiguration() {
  await assertSuperAdmin()
  const [adminRole, permissions, users] = await prisma.$transaction([
    prisma.role.findUnique({
      where: { key: "admin" },
      include: { permissions: { include: { permission: true } } },
    }),
    prisma.permission.findMany({
      where: { key: { not: "rbac.manage" } },
      orderBy: { key: "asc" },
      select: { key: true, description: true },
    }),
    prisma.user.findMany({
      where: { role: { in: ["admin", "seller", "customer"] } },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, role: true },
    }),
  ])

  return {
    permissions,
    adminPermissions:
      adminRole?.permissions.map(({ permission }) => permission.key) ?? [],
    users,
  }
}

export async function setAdminRolePermissions(input: unknown) {
  try {
    const actor = await assertSuperAdmin()
    const permissionKeys = permissionKeysSchema.parse(input)
    if (permissionKeys.includes("rbac.manage")) {
      throw new Error("Administrator roles cannot receive rbac.manage")
    }

    await prisma.$transaction(async (tx) => {
      const [role, permissions] = await Promise.all([
        tx.role.findUnique({ where: { key: "admin" }, select: { id: true } }),
        tx.permission.findMany({
          where: { key: { in: permissionKeys } },
          select: { id: true, key: true },
        }),
      ])
      if (!role) throw new Error("Administrator role is not configured")
      if (permissions.length !== permissionKeys.length) {
        throw new Error("One or more permissions are invalid")
      }

      await tx.rolePermission.deleteMany({ where: { roleId: role.id } })
      if (permissions.length > 0) {
        await tx.rolePermission.createMany({
          data: permissions.map((permission) => ({
            roleId: role.id,
            permissionId: permission.id,
          })),
        })
      }
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: "rbac.admin_permissions.updated",
          targetType: "Role",
          targetId: role.id,
          metadata: { permissions: permissionKeys },
        },
      })
    })

    revalidatePath("/admin")
    return { success: true, message: "Administrator permissions updated" }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

export async function setManagedUserRole(input: {
  userId: string
  role: string
}) {
  try {
    const actor = await assertSuperAdmin()
    const userId = z.string().uuid().parse(input.userId)
    const role = userRoleSchema.parse(input.role)
    if (actor.id === userId) {
      throw new Error("Use a different super administrator to change your role")
    }
    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })
    if (!target) throw new Error("User not found")
    if (target.role === "super_admin") {
      throw new Error("Super administrator accounts cannot be changed here")
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: { role } })
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: "rbac.user_role.updated",
          targetType: "User",
          targetId: userId,
          metadata: { from: target.role, to: role },
        },
      })
    })

    updateTag("all-users")
    revalidatePath("/admin/permissions")
    revalidatePath("/admin/users")
    return { success: true, message: "User role updated" }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}
