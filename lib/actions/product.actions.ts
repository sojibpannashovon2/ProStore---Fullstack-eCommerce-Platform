"use server"

import { revalidatePath, updateTag, unstable_cache } from "next/cache"
import { cache } from "react"
import { z } from "zod"

import { Prisma } from "@prisma/client"

import type {
  ActionReturn,
  InsertProduct,
  Product,
  UpdateProduct,
} from "@/types"

import { prisma } from "@/db/prisma"

import { assertPermission, assertRole } from "@/lib/auth-guard"
import { convertToPlainObject, formatError } from "@/lib/utils"
import { insertProductSchema, updateProductSchema } from "@/lib/validators"

import { LATEST_PRODUCTS_LIMIT, PAGE_SIZE } from "@/constants"

type GetAllProductsOptions = {
  query?: string
  limit?: number
  page: number
  category?: string
  price?: string
  rating?: string
  sort?: string
  sellerId?: string
  includeUnapproved?: boolean
  includeArchived?: boolean
  brand?: string
  availability?: "all" | "in-stock"
}

export async function approveProduct(productId: string) {
  try {
    const actor = await assertPermission("products.manage")
    const id = z.string().uuid().parse(productId)
    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true, isApproved: true, isArchived: true },
    })
    if (!product) throw new Error("Product not found")
    if (product.isArchived) {
      throw new Error("Archived products cannot be approved")
    }
    if (product.isApproved) {
      return { success: true, message: "Product is already approved" }
    }

    await prisma.$transaction([
      prisma.product.update({
        where: { id },
        data: { isApproved: true },
      }),
      prisma.auditLog.create({
        data: {
          actorId: actor.id,
          action: "product.approved",
          targetType: "Product",
          targetId: id,
        },
      }),
    ])
    revalidateProductCaches()
    revalidatePath("/admin/products")
    revalidatePath("/seller/products")
    return { success: true, message: "Product approved" }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

const getAllProductsOptionsSchema = z.object({
  query: z.string().max(120).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  page: z.number().int().positive(),
  category: z.string().max(100).optional(),
  price: z
    .string()
    .regex(/^\d+(?:\.\d+)?-\d+(?:\.\d+)?$/)
    .or(z.literal("all"))
    .optional(),
  rating: z.enum(["all", "1", "2", "3", "4", "5"]).optional(),
  sort: z.enum(["newest", "lowest", "highest", "rating"]).optional(),
  sellerId: z.string().uuid().optional(),
  brand: z.string().max(100).optional(),
  availability: z.enum(["all", "in-stock"]).optional(),
})

//  get the latest products
export const getLatestProducts = unstable_cache(
  async (): Promise<Product[]> => {
    const data = await prisma.product.findMany({
      where: { isApproved: true, isArchived: false },
      take: LATEST_PRODUCTS_LIMIT,
      orderBy: { createdAt: "desc" },
    })

    return convertToPlainObject(data)
  },
  ["getLatestProducts"], // Cache key
  { revalidate: 60, tags: ["getLatestProducts"] },
)

// Get featured products
export const getFeaturedProducts = unstable_cache(
  async (): Promise<Product[]> => {
    const data = await prisma.product.findMany({
      where: { isFeatured: true, isApproved: true, isArchived: false },
      orderBy: { createdAt: "desc" },
      take: 4,
    })

    return convertToPlainObject(data)
  },
  ["getFeaturedProducts"],
  { revalidate: 60, tags: ["getFeaturedProducts"] },
)

// Get single product by it's id
export async function getProductById(id: string) {
  const productId = z.string().uuid().parse(id)
  const product = await prisma.product.findUnique({
    where: { id: productId },
  })

  if (!product) return null

  return convertToPlainObject(product)
}

// Get single product by it's slug
export const getProductBySlug = cache(async (slug: string) => {
  return prisma.product.findFirst({
    where: { slug, isApproved: true, isArchived: false },
    include: {
      seller: {
        select: {
          name: true,
          store: { select: { name: true, slug: true } },
        },
      },
      variants: {
        select: { sku: true },
        take: 1,
      },
    },
  })
})

// Get all products
const getAllProductsCached = unstable_cache(
  async ({
    query,
    limit = PAGE_SIZE,
    page,
    category,
    price,
    rating,
    sort,
    sellerId,
    includeUnapproved = false,
    includeArchived = false,
    brand,
    availability,
  }: GetAllProductsOptions): Promise<{
    data: Product[]
    totalPages: number
  }> => {
    // Query filter
    const queryFilter: Prisma.ProductWhereInput =
      query && query !== "all"
        ? {
            name: {
              contains: query,
              mode: "insensitive",
            } as Prisma.StringFilter,
          }
        : {}

    // Category filter
    const categoryFilter = category && category !== "all" ? { category } : {}

    // Price filter
    const priceFilter: Prisma.ProductWhereInput =
      price && price !== "all"
        ? {
            price: {
              gte: Number(price.split("-")[0]),
              lte: Number(price.split("-")[1]),
            },
          }
        : {}

    // Rating filter
    const ratingFilter =
      rating && rating !== "all"
        ? {
            rating: {
              gte: Number(rating),
            },
          }
        : {}

    const safeLimit = Math.min(100, Math.max(1, Math.trunc(limit)))
    const skip = (page - 1) * safeLimit

    const where: Prisma.ProductWhereInput = {
      ...queryFilter,
      ...categoryFilter,
      ...priceFilter,
      ...ratingFilter,
      ...(sellerId ? { sellerId } : {}),
      ...(brand && brand !== "all" ? { brand } : {}),
      ...(availability === "in-stock" ? { stock: { gt: 0 } } : {}),
      ...(includeUnapproved ? {} : { isApproved: true }),
      ...(includeArchived ? {} : { isArchived: false }),
    }

    const orderBy =
      sort === "lowest"
        ? { price: "asc" as const }
        : sort === "highest"
          ? { price: "desc" as const }
          : sort === "rating"
            ? { rating: "desc" as const }
            : { createdAt: "desc" as const }

    const [data, dataCount]: [Product[], number] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: safeLimit,
      }),
      prisma.product.count({ where }),
    ])

    return {
      data,
      totalPages: Math.ceil(dataCount / safeLimit),
    }
  },
  ["getAllProducts"], // Cache key
  { revalidate: 60, tags: ["getAllProducts"] },
)

export async function getAllProducts(options: GetAllProductsOptions) {
  const parsedOptions = getAllProductsOptionsSchema.parse(options)
  return getAllProductsCached(parsedOptions)
}

export async function getAdminProducts(options: GetAllProductsOptions) {
  await assertPermission("products.manage")
  const parsedOptions = getAllProductsOptionsSchema.parse(options)
  return getAllProductsCached({
    ...parsedOptions,
    includeUnapproved: true,
    includeArchived: true,
  })
}

export async function getSellerProducts(page: number) {
  const seller = await assertPermission("seller.products.manage")
  return getAllProductsCached({
    page: Number.isFinite(page) ? Math.max(1, Math.trunc(page)) : 1,
    sellerId: seller.id,
    includeUnapproved: true,
  })
}

export async function getSellerProductById(id: string) {
  const seller = await assertPermission("seller.products.manage")
  const productId = z.string().uuid().parse(id)
  const product = await prisma.product.findFirst({
    where: { id: productId, sellerId: seller.id },
  })
  return product ? convertToPlainObject(product) : null
}

function revalidateProductCaches() {
  updateTag("getLatestProducts")
  updateTag("getAllProducts")
  updateTag("getFeaturedProducts")
  updateTag("getAllCategories")
  updateTag("getAllBrands")
  revalidatePath("/")
  revalidatePath("/search")
}

// Get all categories with product counts
export const getAllCategories = unstable_cache(
  async (): Promise<
    Array<{ category: string; _count: { category: number } }>
  > => {
    const data = await prisma.product.groupBy({
      by: ["category"],
      where: { isApproved: true, isArchived: false },
      _count: {
        category: true,
      },
    })

    return convertToPlainObject(data) as Array<{
      category: string
      _count: { category: number }
    }>
  },
  ["getAllCategories"],
  { revalidate: 60 * 60, tags: ["getAllCategories"] },
)

export const getAllBrands = unstable_cache(
  async (): Promise<Array<{ brand: string }>> => {
    const data = await prisma.product.groupBy({
      by: ["brand"],
      where: { isApproved: true, isArchived: false },
      orderBy: { brand: "asc" },
    })
    return data.map(({ brand }) => ({ brand }))
  },
  ["getAllBrands"],
  { revalidate: 60 * 60, tags: ["getAllBrands"] },
)

// Delete a product
export async function deleteProduct(id: string) {
  try {
    const actor = await assertRole("admin", "seller")
    await assertPermission(
      actor.role === "seller" ? "seller.products.manage" : "products.manage",
    )
    const productId = z.string().uuid().parse(id)
    const productExists = await getProductById(productId)

    if (!productExists) throw new Error("Product not found")
    if (actor.role === "seller" && productExists.sellerId !== actor.id) {
      throw new Error("You can only manage your own products")
    }

    if (productExists.isArchived) {
      return { success: true, message: "Product is already archived" }
    }

    await prisma.$transaction([
      prisma.product.update({
        where: { id: productId },
        data: { isArchived: true },
      }),
      prisma.auditLog.create({
        data: {
          actorId: actor.id,
          action: "product.archived",
          targetType: "Product",
          targetId: productId,
        },
      }),
    ])

    revalidatePath("/admin/products")
    revalidatePath("/seller/products")
    revalidateProductCaches()

    return {
      success: true,
      message: "Product deleted successfully",
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// Create a product
export async function createProduct(data: InsertProduct): ActionReturn {
  try {
    const actor = await assertRole("admin", "seller")
    await assertPermission(
      actor.role === "seller" ? "seller.products.manage" : "products.manage",
    )
    const product = insertProductSchema.parse(data)
    await prisma.product.create({
      data: {
        ...product,
        sellerId: actor.role === "seller" ? actor.id : null,
        isApproved: actor.role !== "seller",
      },
    })

    revalidatePath("/admin/products")
    revalidatePath("/seller/products")
    revalidateProductCaches()

    return {
      success: true,
      message:
        actor.role === "seller"
          ? "Product submitted for administrator approval"
          : "Product created successfully",
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// Update a product
export async function updateProduct(data: UpdateProduct): ActionReturn {
  try {
    const actor = await assertRole("admin", "seller")
    await assertPermission(
      actor.role === "seller" ? "seller.products.manage" : "products.manage",
    )
    const product = updateProductSchema.parse(data)
    const productExists = await getProductById(product.id)

    if (!productExists) throw new Error("Product not found")
    if (actor.role === "seller" && productExists.sellerId !== actor.id) {
      throw new Error("You can only manage your own products")
    }
    if (productExists.isArchived) {
      throw new Error("Archived products cannot be edited")
    }

    await prisma.product.update({
      where: { id: product.id },
      data: {
        ...product,
        ...(actor.role === "seller" ? { isApproved: false } : {}),
      },
    })

    revalidatePath("/admin/products")
    revalidatePath("/seller/products")
    revalidateProductCaches()

    return {
      success: true,
      message: "Product updated successfully",
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}
