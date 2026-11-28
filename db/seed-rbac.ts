import "dotenv/config"

import { PrismaClient, type UserRole } from "@prisma/client"
import { hash } from "bcrypt-ts-edge"

const prisma = new PrismaClient()

const MATRIX: Record<UserRole, string[]> = {
  customer: [
    "order.place.own",
    "order.cancel.own",
    "review.create",
    "wishlist.view.own",
    "wishlist.remove.own",
  ],
  seller: [
    "product.create",
    "product.update.own",
    "product.delete.own",
    "product.history.view.own",
    "seller.products.manage",
    "seller.orders.view",
    "order.process.own",
    "dashboard.view",
    "sellerApplications.manage",
  ],
  admin: [
    "dashboard.view",
    "products.manage",
    "product.create",
    "product.update.any",
    "product.delete",
    "product.history.view.latest",
    "orders.manage",
    "coupons.manage",
    "users.view",
    "users.manage",
    "user.status.view",
    "user.status.change",
    "user.activity.view",
    "user.loginhistory.view",
    "user.role.change",
    "user.delete",
    "sellerApplications.manage",
  ],
  super_admin: [],
}

const ACCOUNTS: { name: string; email: string; role: UserRole; password: string }[] = [
  { name: "Customer One", email: "customer@kinora.com", role: "customer", password: "Customer@2026" },
  { name: "Seller One", email: "seller@kinora.com", role: "seller", password: "Seller@2026" },
  { name: "Admin One", email: "admin@kinora.com", role: "admin", password: "Admin@2026" },
  { name: "Super Admin", email: "superadmin@kinora.com", role: "super_admin", password: "Kinora@2026Super!" },
]

async function main() {
  const allKeys = [...new Set(Object.values(MATRIX).flat())]
  for (const key of allKeys) {
    await prisma.permission.upsert({
      where: { key },
      update: {},
      create: { key, description: key },
    })
  }

  for (const role of Object.keys(MATRIX) as UserRole[]) {
    const roleRecord = await prisma.role.upsert({
      where: { key: role },
      update: {},
      create: { key: role, name: role },
    })
    await prisma.rolePermission.deleteMany({ where: { roleId: roleRecord.id } })
    const perms = await prisma.permission.findMany({
      where: { key: { in: MATRIX[role] } },
      select: { id: true },
    })
    if (perms.length) {
      await prisma.rolePermission.createMany({
        data: perms.map((p) => ({ roleId: roleRecord.id, permissionId: p.id })),
      })
    }
  }

  for (const acc of ACCOUNTS) {
    const password = await hash(acc.password, 12)
    const existing = await prisma.user.findUnique({
      where: { email: acc.email },
      select: { id: true },
    })
    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { name: acc.name, role: acc.role, password, status: "active", isDeleted: false },
      })
    } else {
      await prisma.user.create({
        data: { name: acc.name, email: acc.email, role: acc.role, password, status: "active" },
      })
    }
  }

  console.log("RBAC permissions and role accounts seeded.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())