"use server"

import { revalidatePath, unstable_cache, updateTag } from "next/cache"
import { isRedirectError } from "next/dist/client/components/redirect-error"

import { Prisma, SellerOrderStatus, type Order } from "@prisma/client"
import { z } from "zod"

import type { ActionReturn, SalesDataType } from "@/types"

import { prisma } from "@/db/prisma"

import { getMyCart } from "@/lib/actions/cart.actions"
import { getUserById } from "@/lib/actions/users.actions"
import {
  assertPermission,
  assertRole,
  isAdminRole,
} from "@/lib/auth-guard"
import { calcCartPrice } from "@/lib/cart/pricing"
import { calculateCouponDiscount } from "@/lib/coupon-pricing"
import { markOrderAsPaid } from "@/lib/orders/mark-order-paid"
import { convertToPlainObject, formatError } from "@/lib/utils"
import { insertOrderSchema } from "@/lib/validators"

import { PAGE_SIZE } from "@/constants"

type CreateOrderReturn = Promise<{
  success: boolean
  message: string
  redirectTo?: string
}>

// Create order and create the order items
export async function createOrder(): CreateOrderReturn {
  try {
    const actor = await assertRole("admin", "seller", "customer")
    const userId = actor.id

    const cart = await getMyCart()

    const user = await getUserById(userId)

    if (!cart || cart.items.length === 0) {
      return {
        success: false,
        message: "Your cart is empty",
        redirectTo: "/cart",
      }
    }

    if (!user.address) {
      return {
        success: false,
        message: "No shipping address",
        redirectTo: "/shipping-address",
      }
    }

    if (!user.paymentMethod) {
      return {
        success: false,
        message: "No payment method",
        redirectTo: "/payment-method",
      }
    }

    const cartItems = cart.items
    const products = await prisma.product.findMany({
      where: { id: { in: cartItems.map((item) => item.productId) } },
      select: {
        id: true,
        name: true,
        slug: true,
        images: true,
        price: true,
        stock: true,
        sellerId: true,
        isApproved: true,
        isArchived: true,
      },
    })
    const productsById = new Map(products.map((product) => [product.id, product]))
    const orderItems = cartItems.map((item) => {
      const product = productsById.get(item.productId)
      if (!product) throw new Error("A product in your cart is no longer available")
      if (!product.isApproved) {
        throw new Error(`${product.name} is pending administrator approval`)
      }
      if (product.isArchived) {
        throw new Error(`${product.name} is no longer available`)
      }
      if (item.qty > product.stock) {
        throw new Error(`Not enough stock for ${product.name}`)
      }
      if (!product.images[0]) {
        throw new Error(`Product image is unavailable for ${product.name}`)
      }

      return {
        productId: product.id,
        name: product.name,
        slug: product.slug,
        image: product.images[0],
        price: product.price.toString(),
        sellerId: product.sellerId,
        qty: item.qty,
      }
    })

    const couponCode = cart.couponCode?.trim().toUpperCase() || null
    const coupon = couponCode
      ? await prisma.coupon.findUnique({ where: { code: couponCode } })
      : null
    if (couponCode && !coupon) throw new Error("Coupon is no longer available")
    const itemsPrice = orderItems.reduce(
      (total, item) => total + Number(item.price) * item.qty,
      0,
    )
    const discount = coupon
      ? calculateCouponDiscount(coupon, itemsPrice)
      : 0

    // Create order object
    const order = insertOrderSchema.parse({
      userId: user.id,
      shippingAddress: user.address,
      paymentMethod: user.paymentMethod,
      couponCode: coupon?.code ?? null,
      ...calcCartPrice(orderItems, discount),
    })

    // Create a transaction to create order and order items in database
    const insertedOrderId = await prisma.$transaction(async (tx) => {
      if (coupon) {
        await tx.$queryRaw<Array<{ id: string }>>`
          SELECT "id" FROM "Coupon" WHERE "id" = ${coupon.id}::uuid FOR UPDATE
        `
        const currentCoupon = await tx.coupon.findUnique({
          where: { id: coupon.id },
        })
        if (!currentCoupon) throw new Error("Coupon is no longer available")

        const currentDiscount = calculateCouponDiscount(
          currentCoupon,
          Number(order.itemsPrice),
        )
        const [totalUses, customerUses] = await Promise.all([
          tx.couponUsage.count({ where: { couponId: currentCoupon.id } }),
          tx.couponUsage.count({
            where: { couponId: currentCoupon.id, userId: user.id },
          }),
        ])
        if (
          currentCoupon.usageLimit !== null &&
          totalUses >= currentCoupon.usageLimit
        ) {
          throw new Error("This coupon has reached its usage limit")
        }
        if (customerUses > 0) {
          throw new Error("You have already used this coupon")
        }
        if (currentDiscount !== Number(order.discountPrice)) {
          throw new Error("Coupon discount changed; please apply it again")
        }
      }

      for (const item of orderItems) {
        const reserved = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.qty } },
          data: { stock: { decrement: item.qty } },
        })
        if (reserved.count !== 1) {
          throw new Error(`Not enough stock for ${item.name}`)
        }
      }

      const insertedOrder = await tx.order.create({ data: order })
      if (coupon) {
        await tx.couponUsage.create({
          data: {
            couponId: coupon.id,
            userId: user.id,
            orderId: insertedOrder.id,
            amount: order.discountPrice,
          },
        })
      }
      const itemsBySeller = new Map<string | null, typeof orderItems>()
      for (const item of orderItems) {
        const group = itemsBySeller.get(item.sellerId) ?? []
        group.push(item)
        itemsBySeller.set(item.sellerId, group)
      }

      for (const [sellerId, items] of itemsBySeller) {
        const itemsPrice = items
          .reduce((total, item) => total + Number(item.price) * item.qty, 0)
          .toFixed(2)
        const sellerOrder = await tx.sellerOrder.create({
          data: {
            orderId: insertedOrder.id,
            sellerId,
            itemsPrice,
            shippingPrice: "0.00",
          },
        })
        await tx.orderItem.createMany({
          data: items.map((item) => ({
            productId: item.productId,
            name: item.name,
            slug: item.slug,
            image: item.image,
            price: item.price,
            qty: item.qty,
            orderId: insertedOrder.id,
            sellerOrderId: sellerOrder.id,
          })),
        })
        await tx.orderStatusHistory.create({
          data: {
            sellerOrderId: sellerOrder.id,
            status: sellerOrder.status,
            note: "Seller order created",
          },
        })
      }

      // Clear cart
      await tx.cart.update({
        where: { id: cart.id },
        data: {
          items: [],
          totalPrice: 0,
          discountPrice: 0,
          couponCode: null,
          taxPrice: 0,
          shippingPrice: 0,
          itemsPrice: 0,
        },
      })

      return insertedOrder.id
    })

    if (!insertedOrderId) throw new Error("Order not created")

    updateTag(`orders-${userId}`) // For getMyOrders cache
    // ✅ Invalidate the cache for `getAllOrders` after creating a new order
    updateTag("all-orders")
    revalidatePath("/seller/orders")

    return {
      success: true,
      message: "Order created",
      redirectTo: `/order/${insertedOrderId}`,
    }
  } catch (error) {
    if (isRedirectError(error)) throw error
    return { success: false, message: formatError(error) }
  }
}

// Get order by id
export async function getOrderById(orderId: string) {
  const actor = await assertRole("admin", "seller", "customer")
  const id = z.string().uuid().parse(orderId)
  const data = await prisma.order.findFirst({
    where: {
      id,
      ...(isAdminRole(actor.role) ? {} : { userId: actor.id }),
    },
    include: {
      orderitems: true,
      user: { select: { name: true, email: true } },
    },
  })

  return convertToPlainObject(data)
}

// Update Cash on Delivery order to paid
export async function updateOrderToPaidCOD(orderId: string) {
  try {
    await assertPermission("orders.manage")
    const id = z.string().uuid().parse(orderId)
    const order = await prisma.order.findUnique({
      where: { id },
      select: { paymentMethod: true },
    })
    if (!order) throw new Error("Order not found")
    if (order.paymentMethod !== "CashOnDelivery") {
      throw new Error("Only Cash On Delivery orders can be marked as paid here")
    }

    await markOrderAsPaid({ orderId: id })

    return { success: true, message: "Order marked as paid" }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// Update order to delivered
export async function deliverOrder(orderId: string) {
  try {
    await assertPermission("orders.manage")
    const order = await getOrderById(orderId)

    if (!order) throw new Error("Order not found")
    if (!order.isPaid) throw new Error("Order is not paid")

    await prisma.order.update({
      where: { id: orderId },
      data: {
        isDelivered: true,
        deliveredAt: new Date(),
      },
    })

    revalidatePath(`/order/${orderId}`)
    // ✅ Invalidate the cache for `getMyOrders` after updating the deliverOrder
    updateTag(`orders-${order.userId}`)
    // ✅ Invalidate the cache for `getAllOrders` after updating the deliverOrder
    updateTag("all-orders")

    return {
      success: true,
      message: "Order has been marked delivered",
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// Get user's orders
export async function getMyOrders({
  limit = PAGE_SIZE,
  page,
}: {
  limit?: number
  page: number
}): Promise<{ data: Order[]; totalPages: number }> {
  const actor = await assertRole("admin", "seller", "customer")
  const safePage = Number.isFinite(page) ? Math.max(1, Math.trunc(page)) : 1
  const safeLimit = Number.isFinite(limit)
    ? Math.min(100, Math.max(1, Math.trunc(limit)))
    : PAGE_SIZE
  const cacheKey = `my-orders-${actor.id}-${safePage}-${safeLimit}`

  const cachedFn = unstable_cache(
    async () => {
      const [data, dataCount] = await prisma.$transaction([
        prisma.order.findMany({
          where: { userId: actor.id },
          orderBy: { createdAt: "desc" },
          take: safeLimit,
          skip: (safePage - 1) * safeLimit,
        }),
        prisma.order.count({
          where: { userId: actor.id },
        }),
      ])

      return {
        data,
        totalPages: Math.ceil(dataCount / safeLimit),
      }
    },
    [cacheKey],
    {
      tags: [`orders-${actor.id}`],
      revalidate: 60 * 30,
    },
  )

  return cachedFn()
}

export async function getSellerOrders({
  limit = PAGE_SIZE,
  page,
}: {
  limit?: number
  page: number
}) {
  const seller = await assertPermission("seller.orders.view")
  const safePage = Number.isFinite(page) ? Math.max(1, Math.trunc(page)) : 1
  const safeLimit = Number.isFinite(limit)
    ? Math.min(100, Math.max(1, Math.trunc(limit)))
    : PAGE_SIZE
  const [orders, totalCount] = await prisma.$transaction([
    prisma.sellerOrder.findMany({
      where: { sellerId: seller.id },
      orderBy: { createdAt: "desc" },
      take: safeLimit,
      skip: (safePage - 1) * safeLimit,
      select: {
        id: true,
        orderId: true,
        createdAt: true,
        status: true,
        itemsPrice: true,
        order: { select: { isPaid: true } },
        items: {
          select: {
            id: true,
            productId: true,
            name: true,
            slug: true,
            qty: true,
            price: true,
          },
        },
      },
    }),
    prisma.sellerOrder.count({ where: { sellerId: seller.id } }),
  ])

  const data = orders.map((order) => {
    const items = order.items.map((item) => ({
      ...item,
      price: Number(item.price),
    }))

    return {
      ...order,
      id: order.orderId,
      sellerOrderId: order.id,
      isPaid: order.order.isPaid,
      isDelivered: order.status === "delivered",
      orderitems: items,
      sellerItemsTotal: Number(order.itemsPrice),
    }
  })

  return {
    data,
    totalPages: Math.ceil(totalCount / safeLimit),
  }
}

export async function updateSellerFulfillment(
  sellerOrderId: string,
  nextStatus: string,
  trackingCode = "",
) {
  try {
    const seller = await assertPermission("seller.orders.view")
    const id = z.string().uuid().parse(sellerOrderId)
    const status = z.nativeEnum(SellerOrderStatus).parse(nextStatus)
    const tracking = z
      .string()
      .trim()
      .max(100)
      .regex(/^[A-Za-z0-9._/-]*$/)
      .parse(trackingCode)

    await prisma.$transaction(async (tx) => {
      const current = await tx.sellerOrder.findFirst({
        where: { id, sellerId: seller.id },
        select: { id: true, orderId: true, status: true },
      })
      if (!current) throw new Error("Seller order not found")

      const transitions: Record<SellerOrderStatus, SellerOrderStatus[]> = {
        pending: [SellerOrderStatus.processing, SellerOrderStatus.cancelled],
        processing: [SellerOrderStatus.shipped, SellerOrderStatus.cancelled],
        shipped: [SellerOrderStatus.delivered],
        delivered: [],
        cancelled: [],
      }
      if (!transitions[current.status].includes(status)) {
        throw new Error("This fulfillment status transition is not allowed")
      }
      if (status === SellerOrderStatus.shipped && !tracking) {
        throw new Error("Add a tracking code before marking the order shipped")
      }

      await tx.sellerOrder.update({
        where: { id: current.id },
        data: { status },
      })
      await tx.shipment.upsert({
        where: { sellerOrderId: current.id },
        create: {
          sellerOrderId: current.id,
          trackingCode: tracking || null,
          status:
            status === SellerOrderStatus.shipped
              ? "shipped"
              : status === SellerOrderStatus.delivered
                ? "delivered"
                : "pending",
          shippedAt:
            status === SellerOrderStatus.shipped ? new Date() : null,
          deliveredAt:
            status === SellerOrderStatus.delivered ? new Date() : null,
        },
        update: {
          trackingCode: tracking || undefined,
          status:
            status === SellerOrderStatus.shipped
              ? "shipped"
              : status === SellerOrderStatus.delivered
                ? "delivered"
                : "pending",
          shippedAt:
            status === SellerOrderStatus.shipped ? new Date() : undefined,
          deliveredAt:
            status === SellerOrderStatus.delivered ? new Date() : undefined,
        },
      })
      await tx.orderStatusHistory.create({
        data: {
          sellerOrderId: current.id,
          status,
          note: "Seller updated fulfillment status",
        },
      })
      await tx.auditLog.create({
        data: {
          actorId: seller.id,
          action: "seller.order.fulfillment.updated",
          targetType: "SellerOrder",
          targetId: current.id,
          metadata: { status },
        },
      })

      if (status === SellerOrderStatus.delivered) {
        const remainingSellerOrders = await tx.sellerOrder.count({
          where: {
            orderId: current.orderId,
            status: { not: SellerOrderStatus.delivered },
          },
        })
        if (remainingSellerOrders === 0) {
          await tx.order.update({
            where: { id: current.orderId },
            data: { isDelivered: true, deliveredAt: new Date() },
          })
        }
      }
    })

    revalidatePath("/seller/orders")
    return { success: true, message: "Fulfillment status updated" }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// Get sales data and order summary
export async function getOrderSummary(): Promise<{
  ordersCount: number
  productsCount: number
  usersCount: number
  totalSales: { _sum: { totalPrice: Prisma.Decimal | null } }
  latestOrders: Array<{
    id: string
    userId: string
    totalPrice: string
    createdAt: Date
    user: { name: string | null } | null
  }>
  salesData: SalesDataType
}> {
  await assertPermission("dashboard.view")

  // Get counts for each resource
  const ordersCount = await prisma.order.count()
  const productsCount = await prisma.product.count()
  const usersCount = await prisma.user.count()
  // Calculate the total sales
  const totalSales = await prisma.order.aggregate({
    _sum: { totalPrice: true },
  })

  // Get monthly sales
  const salesDataRaw = await prisma.$queryRaw<
    Array<{ month: string; totalSales: Prisma.Decimal }>
  >`SELECT to_char("createdAt", 'MM/YY') as "month", sum("totalPrice") as "totalSales" FROM "Order" GROUP BY to_char("createdAt", 'MM/YY')`

  const salesData: SalesDataType = salesDataRaw
    .map((entry: { month: string; totalSales: Prisma.Decimal }) => ({
      month: entry.month,
      totalSales: Number(entry.totalSales),
    }))
    .sort((a: { month: string; totalSales: number }, b: { month: string; totalSales: number }) => {
      // Convert MM/YY to a Date object for proper sorting
      const [aMonth, aYear] = a.month.split("/").map(Number)
      const [bMonth, bYear] = b.month.split("/").map(Number)
      return (
        new Date(aYear, aMonth - 1).getTime() -
        new Date(bYear, bMonth - 1).getTime()
      )
    })

  // Get latest orders
  const latestOrders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true } },
    },
    take: 6,
  })

  return {
    ordersCount,
    productsCount,
    usersCount,
    totalSales,
    latestOrders,
    salesData,
  }
}

// Get all orders
const getAllOrdersCached = unstable_cache(
  async ({
    limit = PAGE_SIZE,
    page,
    query,
  }: {
    limit?: number
    page: number
    query: string
  }): Promise<{
    data: Array<{
      id: string
      createdAt: Date
      totalPrice: string | number
      user: { name: string }
      isPaid: boolean
      paidAt: Date | null
      isDelivered: boolean
      deliveredAt: Date | null
    }>
    totalPages: number
  }> => {
    const safeLimit = Math.min(100, Math.max(1, Math.trunc(limit)))
    const safePage = Math.max(1, Math.trunc(page))
    const queryFilter: Prisma.OrderWhereInput =
      query && query !== "all"
        ? {
            user: {
              name: {
                contains: query,
                mode: "insensitive",
              } as Prisma.StringFilter,
            },
          }
        : {}

    const data = await prisma.order.findMany({
      where: { ...queryFilter },
      orderBy: { createdAt: "desc" },
      take: safeLimit,
      skip: (safePage - 1) * safeLimit,
      include: { user: { select: { name: true } } },
    })

    const dataCount = await prisma.order.count({ where: { ...queryFilter } })

    return {
      data,
      totalPages: Math.ceil(dataCount / safeLimit),
    }
  },
  ["all-orders"], // Dynamic cache key
  { revalidate: 60 * 60, tags: ["all-orders"] }, // Cache for 1 hour
)

export async function getAllOrders(params: {
  limit?: number
  page: number
  query: string
}) {
  await assertPermission("orders.manage")
  const page = Number.isFinite(params.page)
    ? Math.max(1, Math.trunc(params.page))
    : 1
  const limit =
    params.limit === undefined
      ? PAGE_SIZE
      : Number.isFinite(params.limit)
        ? Math.min(100, Math.max(1, Math.trunc(params.limit)))
        : PAGE_SIZE
  const query = z.string().max(120).parse(params.query)
  return getAllOrdersCached({ ...params, limit, page, query })
}

// Delete an order
export async function deleteOrder(id: string): ActionReturn {
  try {
    await assertPermission("orders.manage")
    const selectedOrder = await getOrderById(z.string().uuid().parse(id))
    if (!selectedOrder) throw new Error("No order found to delete.")

    await prisma.order.delete({ where: { id: selectedOrder.id } })

    // ✅ Invalidate the cache for `getMyOrders` after deleting a order
    updateTag(`orders-${selectedOrder.userId}`)
    // ✅ Invalidate the cache for `getAllOrders` after deleting a order
    updateTag("all-orders")

    return {
      success: true,
      message: "Order deleted successfully",
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}
