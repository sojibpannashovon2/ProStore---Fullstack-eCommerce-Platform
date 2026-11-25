import "server-only"

import { revalidatePath, revalidateTag } from "next/cache"
import { after } from "next/server"

import type { PaymentResult, ShippingAddress } from "@/types"

import { prisma } from "@/db/prisma"
import { sendPurchaseReceipt } from "@/email"

export async function markOrderAsPaid({
  orderId,
  paymentResult,
}: {
  orderId: string
  paymentResult?: PaymentResult
}) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { orderitems: true },
  })

  if (!order) throw new Error("Order not found")
  if (order.isPaid) return

  const didMarkAsPaid = await prisma.$transaction(async (tx) => {
    const paidOrder = await tx.order.updateMany({
      where: { id: orderId, isPaid: false },
      data: {
        isPaid: true,
        paidAt: new Date(),
        paymentResult,
      },
    })

    if (paidOrder.count !== 1) return false

    for (const item of order.orderitems) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: -item.qty } },
      })
    }

    return true
  })

  if (!didMarkAsPaid) return

  revalidatePath(`/order/${orderId}`)
  revalidateTag("getLatestProducts", "max")
  revalidateTag("getAllProducts", "max")
  revalidateTag("getFeaturedProducts", "max")
  revalidateTag(`orders-${order.userId}`, "max")
  revalidateTag("all-orders", "max")

  const updatedOrder = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      orderitems: true,
      user: { select: { name: true, email: true } },
    },
  })

  if (!updatedOrder) throw new Error("Order not found")

  after(async () => {
    try {
      await sendPurchaseReceipt({
        order: {
          ...updatedOrder,
          itemsPrice: updatedOrder.itemsPrice.toString(),
          discountPrice: updatedOrder.discountPrice.toString(),
          shippingPrice: updatedOrder.shippingPrice.toString(),
          taxPrice: updatedOrder.taxPrice.toString(),
          totalPrice: updatedOrder.totalPrice.toString(),
          shippingAddress: updatedOrder.shippingAddress as ShippingAddress,
          paymentResult: updatedOrder.paymentResult as PaymentResult,
        },
      })
    } catch (error) {
      console.error(`Failed to send receipt for order ${orderId}`, error)
    }
  })
}
