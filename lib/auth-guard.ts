import { redirect } from "next/navigation"

import { auth } from "@/auth"
import { prisma } from "@/db/prisma"

export type AppRole = "super_admin" | "admin" | "seller" | "customer"

export function isAdminRole(role: AppRole) {
  return role === "admin" || role === "super_admin"
}

export async function getCurrentUser() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return null

  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  })
}

export async function assertRole(...roles: AppRole[]) {
  const user = await getCurrentUser()
  const allowed =
    !!user &&
    (roles.includes(user.role) ||
      (user.role === "super_admin" && roles.includes("admin")))
  if (!allowed) {
    throw new Error("Unauthorized action")
  }
  return user
}

export async function requireRole(...roles: AppRole[]) {
  const user = await getCurrentUser()
  const allowed =
    !!user &&
    (roles.includes(user.role) ||
      (user.role === "super_admin" && roles.includes("admin")))
  if (!allowed) {
    redirect("/unauthorized")
  }

  return user
}

export async function requireAdmin() {
  return requireRole("admin", "super_admin")
}

export async function requireSeller() {
  return requireRole("seller")
}

export async function assertPermission(permissionKey: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized action")
  if (user.role === "super_admin") return user

  const permission = await prisma.rolePermission.findFirst({
    where: {
      role: { key: user.role },
      permission: { key: permissionKey },
    },
    select: { roleId: true },
  })

  if (!permission) throw new Error("Unauthorized action")
  return user
}

export async function requirePermission(permissionKey: string) {
  const user = await getCurrentUser()
  if (!user) redirect("/unauthorized")
  if (user.role === "super_admin") return user

  const permission = await prisma.rolePermission.findFirst({
    where: {
      role: { key: user.role },
      permission: { key: permissionKey },
    },
    select: { roleId: true },
  })

  if (!permission) redirect("/unauthorized")
  return user
}

export async function assertSuperAdmin() {
  return assertRole("super_admin")
}
