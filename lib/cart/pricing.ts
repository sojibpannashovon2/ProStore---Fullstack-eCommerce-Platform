import type { CartItem } from "@/types"

import { DEFAULT_SHIPPING_PRICE, DEFAULT_TAX_PERCENTAGE } from "@/constants"
import { round2 } from "@/lib/utils"

export function calcCartPrice(items: CartItem[], discount = 0) {
  const itemsPrice = round2(
    items.reduce((total, item) => total + Number(item.price) * item.qty, 0),
  )
  const discountPrice = round2(Math.min(itemsPrice, Math.max(0, discount)))
  const taxablePrice = round2(itemsPrice - discountPrice)
  const shippingPrice = round2(
    taxablePrice > 100 ? 0 : DEFAULT_SHIPPING_PRICE,
  )
  const taxPrice = round2(DEFAULT_TAX_PERCENTAGE * taxablePrice)
  const totalPrice = round2(taxablePrice + taxPrice + shippingPrice)

  return {
    itemsPrice: itemsPrice.toFixed(2),
    discountPrice: discountPrice.toFixed(2),
    shippingPrice: shippingPrice.toFixed(2),
    taxPrice: taxPrice.toFixed(2),
    totalPrice: totalPrice.toFixed(2),
  }
}
