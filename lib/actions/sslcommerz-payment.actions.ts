"use server"

import { createSSLCommerzSession } from "@/lib/sslcommerz"
import { formatError } from "@/lib/utils"

export async function createSSLCommerzPaymentSession(
  orderId: string,
): Promise<
  { success: true; redirectTo: string } | { success: false; message: string }
> {
  try {
    const redirectTo = await createSSLCommerzSession(orderId)
    return { success: true, redirectTo }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}
