import { PrismaClient } from "@prisma/client"

import demoProducts from "./demo-products"

async function main() {
  const prisma = new PrismaClient()

  try {
    const result = await prisma.product.createMany({
      data: demoProducts,
      skipDuplicates: true,
    })

    console.log(`Added ${result.count} demo products.`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error: unknown) => {
  console.error("Failed to seed demo products:", error)
  process.exitCode = 1
})
