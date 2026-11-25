import "dotenv/config"

import { PrismaClient } from "@prisma/client"

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase()
  if (!email) {
    throw new Error("Set SUPER_ADMIN_EMAIL to an existing account before running this command")
  }

  const prisma = new PrismaClient()
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true },
    })
    if (!user) {
      throw new Error("The configured super administrator account does not exist")
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { role: "super_admin" },
      })
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "rbac.super_admin.bootstrapped",
          targetType: "User",
          targetId: user.id,
          metadata: { previousRole: user.role },
        },
      })
    })
    console.log("Super administrator access configured for the supplied account.")
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error("Could not configure super administrator access:", error)
  process.exitCode = 1
})
