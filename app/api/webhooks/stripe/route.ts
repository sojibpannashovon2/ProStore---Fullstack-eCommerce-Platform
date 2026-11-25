import { NextRequest } from "next/server"

import Stripe from "stripe"
import { z } from "zod"

import { prisma } from "@/db/prisma"
import { apiError, apiSuccess } from "@/lib/api-response"
import { markOrderAsPaid } from "@/lib/orders/mark-order-paid"

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    console.error("Stripe webhook is not configured")
    return apiError("WEBHOOK_NOT_CONFIGURED", "Webhook is unavailable.", 500)
  }

  const signature = req.headers.get("stripe-signature")
  if (!signature) {
    return apiError("MISSING_SIGNATURE", "Stripe signature is required.", 400)
  }

  let event: Stripe.Event
  try {
    event = Stripe.webhooks.constructEvent(await req.text(), signature, secret)
  } catch (error) {
    console.error("Stripe webhook signature verification failed", error)
    return apiError("INVALID_SIGNATURE", "Invalid webhook signature.", 400)
  }

  if (event.type !== "charge.succeeded") {
    return apiSuccess({ message: "Event ignored" })
  }

  const charge = event.data.object
  const parsedOrderId = z.string().uuid().safeParse(charge.metadata?.orderId)
  if (!parsedOrderId.success) {
    return apiError("INVALID_ORDER_ID", "A valid order ID is required.", 400)
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: parsedOrderId.data },
      select: { paymentMethod: true, totalPrice: true },
    })

    if (!order) {
      return apiError("ORDER_NOT_FOUND", "Order not found.", 404)
    }
    if (
      order.paymentMethod !== "Stripe" ||
      charge.currency.toLowerCase() !== "usd" ||
      charge.amount !== Math.round(Number(order.totalPrice) * 100)
    ) {
      return apiError(
        "PAYMENT_MISMATCH",
        "Payment details do not match the order.",
        400,
      )
    }

    await markOrderAsPaid({
      orderId: parsedOrderId.data,
      paymentResult: {
        id: charge.id,
        status: "COMPLETED",
        email_address: charge.billing_details.email ?? "",
        pricePaid: (charge.amount / 100).toFixed(2),
      },
    })

    return apiSuccess({ message: "Payment recorded" })
  } catch (error) {
    console.error("Failed to process Stripe payment webhook", error)
    return apiError(
      "WEBHOOK_PROCESSING_FAILED",
      "The payment could not be recorded.",
      500,
    )
  }
}
