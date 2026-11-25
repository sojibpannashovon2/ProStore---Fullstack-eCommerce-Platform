"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"

import { CheckIcon, Loader2Icon } from "lucide-react"

import { createOrder } from "@/lib/actions/order.actions"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CurrencyText } from "@/components/shared/currency-text"
import { TranslatedText } from "@/components/shared/translated-text"

interface PlaceOrderCardProps {
  itemsPrice: string
  taxPrice: string
  shippingPrice: string
  totalPrice: string
  paymentMethod: string
}

export function PlaceOrderCard({
  itemsPrice,
  taxPrice,
  shippingPrice,
  totalPrice,
  paymentMethod,
}: PlaceOrderCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const paymentCurrency = ["PayPal", "Stripe"].includes(paymentMethod)
    ? "USD"
    : "BDT"

  const handleSubmit = () => {
    startTransition(async () => {
      const res = await createOrder()

      if (res.redirectTo) {
        router.push(res.redirectTo)
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle><TranslatedText text="Price" /></CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        <div className="flex justify-between">
          <div><TranslatedText text="Items" /></div>
          <div><CurrencyText value={itemsPrice} currency={paymentCurrency} /></div>
        </div>
        <div className="flex justify-between">
          <div><TranslatedText text="Tax" /></div>
          <div><CurrencyText value={taxPrice} currency={paymentCurrency} /></div>
        </div>
        <div className="flex justify-between">
          <div><TranslatedText text="Shipping" /></div>
          <div><CurrencyText value={shippingPrice} currency={paymentCurrency} /></div>
        </div>
        <div className="flex justify-between">
          <div><TranslatedText text="Total" /></div>
          <div><CurrencyText value={totalPrice} currency={paymentCurrency} /></div>
        </div>
        <Button disabled={isPending} onClick={handleSubmit} className="w-full">
          {isPending ? (
            <Loader2Icon className="h-4 w-4 animate-spin" />
          ) : (
            <CheckIcon className="h-4 w-4" />
          )}{" "}
          <TranslatedText text="Place Order" />
        </Button>
      </CardContent>
    </Card>
  )
}
