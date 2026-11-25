"use server"

import type { PaymentResult } from "@/types"

import { prisma } from "@/db/prisma"

import { getOrderById } from "@/lib/actions/order.actions"
import { paypal } from "@/lib/paypal"
import { markOrderAsPaid } from "@/lib/orders/mark-order-paid"
import { formatError } from "@/lib/utils"
import { z } from "zod"

// Create new paypal order
export async function createPayPalOrder(orderId: string) {
  try {
    const id = z.string().uuid().parse(orderId)
    const order = await getOrderById(id)
    if (!order) throw new Error("Order not found")
    if (order.paymentMethod !== "PayPal") {
      throw new Error("This order does not use PayPal")
    }
    if (order.isPaid) throw new Error("Order is already paid")

    const paypalOrder = await paypal.createOrder(Number(order.totalPrice))

    await prisma.order.update({
      where: { id },
      data: {
        paymentResult: {
          id: paypalOrder.id,
          email_address: "",
          status: "",
          pricePaid: "0",
        },
      },
    })

    return {
      success: true,
      message: "Item order created successfully",
      data: paypalOrder.id,
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// Approve paypal order and update order to paid
export async function approvePayPalOrder(
  orderId: string,
  data: { orderID: string }, // paymentResult id
) {
  try {
    const id = z.string().uuid().parse(orderId)
    const orderID = z.string().min(1).parse(data?.orderID)
    const order = await getOrderById(id)
    if (!order) throw new Error("Order not found")
    if (order.paymentMethod !== "PayPal") {
      throw new Error("This order does not use PayPal")
    }
    if (order.isPaid) throw new Error("Order is already paid")

    const captureData = await paypal.capturePayment(orderID)
    const pricePaid =
      captureData?.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value

    if (
      !captureData ||
      captureData.id !== (order.paymentResult as PaymentResult)?.id ||
      captureData.status !== "COMPLETED" ||
      typeof pricePaid !== "string" ||
      Math.round(Number(pricePaid) * 100) !==
        Math.round(Number(order.totalPrice) * 100)
    ) {
      throw new Error("Error in PayPal payment")
    }

    // Update order to paid
    await markOrderAsPaid({
      orderId: id,
      paymentResult: {
        id: captureData.id,
        status: captureData.status,
        email_address: captureData.payer.email_address ?? order.user.email,
        pricePaid,
      },
    })

    return {
      success: true,
      message: "Your order has been paid",
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}
