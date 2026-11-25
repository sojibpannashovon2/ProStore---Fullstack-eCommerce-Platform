import { spawnSync } from "node:child_process"

import { PrismaClient } from "@prisma/client"

async function main() {
  if (process.env.VERCEL !== "1" || process.env.VERCEL_ENV !== "production") {
    return
  }

  const prisma = new PrismaClient()

  try {
    const [roleMigration] = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1
        FROM "_prisma_migrations"
        WHERE "migration_name" = '20261125144200_add_seller_roles_and_backend_indexes'
          AND "finished_at" IS NOT NULL
          AND "rolled_back_at" IS NULL
      ) AS applied
    `

    if (!roleMigration.applied) {
      const [unexpectedRoles] = await prisma.$queryRaw`
        SELECT COUNT(*)::int AS count
        FROM "User"
        WHERE "role"::text NOT IN ('admin', 'seller', 'customer')
      `

      if (unexpectedRoles.count > 0) {
        throw new Error(
          "Existing user roles would be downgraded by the production role migration. Review them before deploying.",
        )
      }
    }
  } finally {
    await prisma.$disconnect()
  }

  const result = spawnSync(
    process.execPath,
    ["node_modules/prisma/build/index.js", "migrate", "deploy"],
    {
      stdio: "inherit",
    },
  )

  if (result.error) {
    throw result.error
  }
  if (result.status !== 0) {
    process.exitCode = result.status ?? 1
  }
}

main().catch((error) => {
  console.error("Production database migration failed:", error)
  process.exitCode = 1
})
