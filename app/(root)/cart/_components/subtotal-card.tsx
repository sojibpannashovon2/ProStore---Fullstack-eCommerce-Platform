"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import type { FormEvent } from "react"

import { useLocale } from "@/providers/locale-provider"
import { ArrowRightIcon, Loader2Icon } from "lucide-react"

import type { Cart } from "@/types"

import {
  applyCouponToCart,
  removeCouponFromCart,
} from "@/lib/actions/cart.actions"
import { translate } from "@/lib/i18n/translations"

import { CurrencyText } from "@/components/shared/currency-text"
import { TranslatedText } from "@/components/shared/translated-text"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

interface SubtotalCardProps {
  cart: Cart
}

export function SubtotalCard({ cart }: SubtotalCardProps) {
  const { locale } = useLocale()
  const [isPending, startTransition] = useTransition()
  const [couponCode, setCouponCode] = useState("")
  const [message, setMessage] = useState("")
  const router = useRouter()

  function submitCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    startTransition(async () => {
      const result = await applyCouponToCart(couponCode)
      setMessage(translate(locale, result.message))
      if (result.success) {
        setCouponCode("")
        router.refresh()
      }
    })
  }

  function removeCoupon() {
    startTransition(async () => {
      const result = await removeCouponFromCart()
      setMessage(translate(locale, result.message))
      if (result.success) router.refresh()
    })
  }

  return (
    <Card>
      <CardContent className="gap-4 p-4">
        <div className="pb-3 text-xl">
          <TranslatedText
            text={`Subtotal (${cart.items.reduce((a, c) => a + c.qty, 0)}):`}
          />{" "}
          <span className="font-bold">
            <CurrencyText value={cart.itemsPrice} />
          </span>
        </div>
        <form className="space-y-2" onSubmit={submitCoupon}>
          <label htmlFor="coupon-code" className="text-sm font-medium">
            <TranslatedText text="Coupon code" />
          </label>
          <div className="flex gap-2">
            <Input
              id="coupon-code"
              value={couponCode}
              onChange={(event) => setCouponCode(event.target.value)}
              placeholder={translate(locale, "Enter coupon code")}
              maxLength={40}
              disabled={isPending || !!cart.couponCode}
            />
            {cart.couponCode ? (
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={removeCoupon}
              >
                <TranslatedText text="Remove" />
              </Button>
            ) : (
              <Button type="submit" disabled={isPending || !couponCode.trim()}>
                <TranslatedText text="Apply" />
              </Button>
            )}
          </div>
          {cart.couponCode && (
            <p className="text-muted-foreground text-sm">{cart.couponCode}</p>
          )}
          {message && (
            <p className="text-sm" role="status">
              {message}
            </p>
          )}
        </form>
        <div className="space-y-1 border-t pt-3 text-sm">
          {Number(cart.discountPrice) > 0 && (
            <div className="flex justify-between">
              <TranslatedText text="Discount" />
              <span className="text-green-700">
                -<CurrencyText value={cart.discountPrice} />
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <TranslatedText text="Shipping" />
            <CurrencyText value={cart.shippingPrice} />
          </div>
          <div className="flex justify-between">
            <TranslatedText text="Tax" />
            <CurrencyText value={cart.taxPrice} />
          </div>
          <div className="flex justify-between font-bold">
            <TranslatedText text="Total" />
            <CurrencyText value={cart.totalPrice} />
          </div>
        </div>
        <Button
          className="w-full"
          disabled={isPending}
          onClick={() =>
            startTransition(() => {
              router.push("/shipping-address")
            })
          }
        >
          {isPending ? (
            <Loader2Icon className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowRightIcon className="h-4 w-4" />
          )}{" "}
          <TranslatedText text="Proceed to Checkout" />
        </Button>
      </CardContent>
    </Card>
  )
}
