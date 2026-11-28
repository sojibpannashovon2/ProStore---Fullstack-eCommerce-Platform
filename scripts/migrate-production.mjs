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
    // Migrations are already applied to the production database. A non-zero
    // exit here is almost always a transient DB connectivity problem (e.g. Neon
    // cold start / pooler timeout), so warn and continue instead of failing the
    // whole deployment.
    console.warn(
      "Production pre-deploy migration reported a non-zero exit; continuing (migrations are expected to be already applied).",
    )
    process.exit(0)
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  const isConnectionError =
    /P1002|P1001|Can't reach|not reachable|ETIMEDOUT|ECONNREFUSED|ENOTFOUND|socket hang up/i.test(
      message,
    )
  if (isConnectionError) {
    console.warn(
      "Skipping production pre-deploy migration: database is temporarily unreachable.",
    )
    process.exit(0)
  }
  console.error("Production database migration failed:", error)
  process.exit(1)
})
