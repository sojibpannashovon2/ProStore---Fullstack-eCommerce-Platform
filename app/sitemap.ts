import type { MetadataRoute } from "next"

import { SERVER_URL } from "@/constants"
import { prisma } from "@/db/prisma"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SERVER_URL.replace(/\/$/, "")
  const products = await prisma.product.findMany({
    where: { isApproved: true, isArchived: false },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 50_000,
  })

  return [
    {
      url: baseUrl,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/search`,
      changeFrequency: "daily",
      priority: 0.8,
    },
    ...products.map((product) => ({
      url: `${baseUrl}/product/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ]
}
