import { NextRequest, NextResponse } from "next/server"

import { confirmSSLCommerzPayment } from "@/lib/sslcommerz"

const ORDER_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function POST(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get("orderId")
  const formData = await request.formData()
  const validationId = formData.get("val_id")

  if (
    !orderId ||
    !ORDER_ID_PATTERN.test(orderId) ||
    typeof validationId !== "string" ||
    !validationId
  ) {
    return NextResponse.json(
      { message: "Invalid SSLCOMMERZ notification" },
      { status: 400 },
    )
  }

  await confirmSSLCommerzPayment(orderId, validationId)
  return NextResponse.json({ success: true })
}
