import { randomUUID } from "crypto"
import { z } from "zod"

import type { ShippingAddress } from "@/types"

import { prisma } from "@/db/prisma"

import { assertRole, isAdminRole } from "@/lib/auth-guard"
import { convertUsdToBdt } from "@/lib/currency"
import { markOrderAsPaid } from "@/lib/orders/mark-order-paid"

import { SERVER_URL } from "@/constants"

function getGatewayConfig() {
  const storeId = process.env.SSLCOMMERZ_STORE_ID
  const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD

  if (!storeId || !storePassword) {
    throw new Error(
      "Configure SSLCOMMERZ_STORE_ID and SSLCOMMERZ_STORE_PASSWORD first",
    )
  }

  const baseUrl =
    process.env.SSLCOMMERZ_SANDBOX === "false"
      ? "https://securepay.sslcommerz.com"
      : "https://sandbox.sslcommerz.com"

  return { storeId, storePassword, baseUrl }
}

function formatBdtAmount(amount: number) {
  return amount.toFixed(2)
}

export async function createSSLCommerzSession(orderId: string) {
  const actor = await assertRole("admin", "seller", "customer")
  const id = z.string().uuid().parse(orderId)

  const order = await prisma.order.findUnique({
    where: { id },
    include: { user: true, orderitems: true },
  })

  if (!order) throw new Error("Order not found")
  if (order.userId !== actor.id && !isAdminRole(actor.role)) {
    throw new Error("You are not authorized to pay for this order")
  }
  if (order.paymentMethod !== "SSLCOMMERZ") {
    throw new Error("This order does not use SSLCOMMERZ")
  }
  if (order.isPaid) throw new Error("Order is already paid")

  const amount = convertUsdToBdt(Number(order.totalPrice))
  if (amount < 10 || amount > 500000) {
    throw new Error(
      "SSLCOMMERZ payments must be between BDT 10 and BDT 500,000",
    )
  }

  const { storeId, storePassword, baseUrl } = getGatewayConfig()
  const transactionId = randomUUID().replace(/-/g, "").slice(0, 30)
  const shippingAddress = order.shippingAddress as ShippingAddress
  const phone = shippingAddress.phone?.trim()
  if (!phone || !/^[+()\d\s-]{7,20}$/.test(phone)) {
    throw new Error("Add a valid phone number to your shipping address")
  }

  const callbackUrl = new URL("/api/payments/sslcommerz/success", SERVER_URL)
  callbackUrl.searchParams.set("orderId", order.id)
  const ipnUrl = new URL("/api/payments/sslcommerz/ipn", SERVER_URL)
  ipnUrl.searchParams.set("orderId", order.id)

  await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentResult: {
        id: transactionId,
        status: "PENDING",
        email_address: order.user.email,
        pricePaid: formatBdtAmount(amount),
      },
    },
  })

  const paymentData = new URLSearchParams({
    store_id: storeId,
    store_passwd: storePassword,
    total_amount: formatBdtAmount(amount),
    currency: "BDT",
    tran_id: transactionId,
    success_url: callbackUrl.toString(),
    fail_url: `${SERVER_URL}/order/${order.id}?payment=failed`,
    cancel_url: `${SERVER_URL}/order/${order.id}?payment=cancelled`,
    ipn_url: ipnUrl.toString(),
    shipping_method: "YES",
    product_name:
      order.orderitems
        .map((item) => item.name)
        .join(", ")
        .slice(0, 255) || "Online order",
    product_category: "E-commerce",
    product_profile: "general",
    cus_name: order.user.name,
    cus_email: order.user.email,
    cus_add1: shippingAddress.streetAddress,
    cus_city: shippingAddress.city,
    cus_postcode: shippingAddress.postalCode,
    cus_country: shippingAddress.country,
    cus_phone: phone,
    ship_name: shippingAddress.fullName,
    ship_add1: shippingAddress.streetAddress,
    ship_city: shippingAddress.city,
    ship_postcode: shippingAddress.postalCode,
    ship_country: shippingAddress.country,
    num_of_item: String(
      order.orderitems.reduce((count, item) => count + item.qty, 0),
    ),
  })

  const response = await fetch(`${baseUrl}/gwprocess/v4/api.php`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: paymentData,
  })

  const result: unknown = await response.json()
  if (
    !response.ok ||
    !result ||
    typeof result !== "object" ||
    !("status" in result) ||
    result.status !== "SUCCESS" ||
    !("GatewayPageURL" in result) ||
    typeof result.GatewayPageURL !== "string"
  ) {
    throw new Error("SSLCOMMERZ could not start the payment session")
  }

  return result.GatewayPageURL
}

interface ValidatedTransaction {
  status?: unknown
  tran_id?: unknown
  amount?: unknown
  currency?: unknown
  val_id?: unknown
  bank_tran_id?: unknown
  card_type?: unknown
  risk_level?: unknown
}

async function validateTransaction(validationId: string) {
  const { storeId, storePassword, baseUrl } = getGatewayConfig()
  const url = new URL("/validator/api/validationserverAPI.php", baseUrl)
  url.searchParams.set("val_id", validationId)
  url.searchParams.set("store_id", storeId)
  url.searchParams.set("store_passwd", storePassword)
  url.searchParams.set("format", "json")

  const response = await fetch(url, { cache: "no-store" })
  if (!response.ok) {
    throw new Error("SSLCOMMERZ transaction validation failed")
  }

  return (await response.json()) as ValidatedTransaction
}

export async function confirmSSLCommerzPayment(
  orderId: string,
  validationId: string,
) {
  const id = z.string().uuid().parse(orderId)
  const validatedId = z.string().min(1).max(128).parse(validationId)
  const order = await prisma.order.findUnique({ where: { id } })
  if (!order) throw new Error("Order not found")
  if (order.paymentMethod !== "SSLCOMMERZ") {
    throw new Error("This order does not use SSLCOMMERZ")
  }
  if (order.isPaid) return

  const pendingPayment = order.paymentResult as {
    id?: unknown
    status?: unknown
    pricePaid?: unknown
  } | null
  if (
    typeof pendingPayment?.id !== "string" ||
    pendingPayment.status !== "PENDING" ||
    typeof pendingPayment.pricePaid !== "string"
  ) {
    throw new Error("No pending SSLCOMMERZ transaction exists")
  }

  const transaction = await validateTransaction(validatedId)
  if (
    !["VALID", "VALIDATED"].includes(String(transaction.status)) ||
    transaction.tran_id !== pendingPayment.id ||
    transaction.currency !== "BDT" ||
    typeof transaction.val_id !== "string" ||
    !transaction.val_id ||
    !Number.isFinite(Number(transaction.amount)) ||
    Math.round(Number(transaction.amount) * 100) !==
      Math.round(Number(pendingPayment.pricePaid) * 100) ||
    String(transaction.risk_level) !== "0"
  ) {
    throw new Error("SSLCOMMERZ transaction details did not match the order")
  }

  const orderUser = await prisma.user.findUnique({
    where: { id: order.userId },
    select: { email: true },
  })

  await markOrderAsPaid({
    orderId: id,
    paymentResult: {
      id: String(transaction.val_id),
      status: String(transaction.status),
      email_address: orderUser?.email ?? "",
      pricePaid: String(transaction.amount),
    },
  })
}
