import { PrismaClient } from "@prisma/client"

import demoProducts, {
  CATEGORY_PRODUCT_IMAGES,
  DEMO_CATEGORY_TARGETS,
} from "./demo-products"

async function main() {
  const prisma = new PrismaClient()

  try {
    const currentCounts = await prisma.product.groupBy({
      by: ["category"],
      _count: { _all: true },
    })
    const countsByCategory = new Map(
      currentCounts.map(({ category, _count }) => [category, _count._all]),
    )
    const existingDemoProducts = await prisma.product.findMany({
      where: { slug: { in: demoProducts.map(({ slug }) => slug) } },
      select: { slug: true },
    })
    const existingSlugs = new Set(existingDemoProducts.map(({ slug }) => slug))

    const productsToAdd = Object.entries(DEMO_CATEGORY_TARGETS).flatMap(
      ([category, target]) => {
        const needed = Math.max(
          0,
          target - (countsByCategory.get(category) ?? 0),
        )
        const candidates = demoProducts.filter(
          (product) =>
            product.category === category && !existingSlugs.has(product.slug),
        )

        if (candidates.length < needed) {
          throw new Error(
            `Not enough demo products to reach ${target} products in ${category}.`,
          )
        }

        return candidates.slice(0, needed)
      },
    )
    const result = await prisma.product.createMany({
      data: productsToAdd,
      skipDuplicates: true,
    })

    await prisma.$transaction(
      [
        ...demoProducts.map((product) =>
          prisma.product.updateMany({
            where: { slug: product.slug },
            data: {
              images: product.images,
              price: product.price,
            },
          }),
        ),
        ...Object.entries(CATEGORY_PRODUCT_IMAGES).map(([category, image]) =>
          prisma.product.updateMany({
            where: { category },
            data: { images: [image] },
          }),
        ),
      ],
    )

    const finalCounts = await prisma.product.groupBy({
      by: ["category"],
      _count: { _all: true },
    })
    const finalCountsByCategory = new Map(
      finalCounts.map(({ category, _count }) => [category, _count._all]),
    )
    const incompleteCategories = Object.entries(DEMO_CATEGORY_TARGETS).filter(
      ([category, target]) =>
        (finalCountsByCategory.get(category) ?? 0) < target,
    )

    if (incompleteCategories.length > 0) {
      throw new Error(
        `Unable to reach 20 products in: ${incompleteCategories
          .map(
            ([category, target]) =>
              `${category} (${finalCountsByCategory.get(category) ?? 0}/${target})`,
          )
          .join(", ")}.`,
      )
    }

    const productsWithIncorrectImages = await prisma.product.findMany({
      where: { category: { in: Object.keys(CATEGORY_PRODUCT_IMAGES) } },
      select: { category: true, images: true },
    })
    const incorrectImageCategories = new Set(
      productsWithIncorrectImages
        .filter(
          ({ category, images }) =>
            images[0] !==
            CATEGORY_PRODUCT_IMAGES[
              category as keyof typeof CATEGORY_PRODUCT_IMAGES
            ],
        )
        .map(({ category }) => category),
    )

    if (incorrectImageCategories.size > 0) {
      throw new Error(
        `Incorrect product images remain in: ${[...incorrectImageCategories].join(", ")}.`,
      )
    }

    console.log(`Added ${result.count} demo products.`)
    for (const [category, target] of Object.entries(DEMO_CATEGORY_TARGETS)) {
      console.log(
        `${category}: ${finalCountsByCategory.get(category) ?? 0}/${target}, image verified`,
      )
    }
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error: unknown) => {
  console.error("Failed to seed demo products:", error)
  process.exitCode = 1
})
