"use client"

import { FormEvent, useState } from "react"

import {
  LinkAuthenticationElement,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js"

import { formatCurrency } from "@/lib/utils"

import { SERVER_URL } from "@/constants"

import { Button } from "@/components/ui/button"
import { TranslatedText } from "@/components/shared/translated-text"
import { useLocale } from "@/providers/locale-provider"

interface StripePaymentFormProps {
  priceInCents: number
  orderId: string
}

export function StripePaymentForm({
  priceInCents,
  orderId,
}: StripePaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const { locale } = useLocale()

  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [email, setEmail] = useState("")

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (stripe == null || elements == null || email == null) return

    setIsLoading(true)

    stripe
      .confirmPayment({
        elements,
        confirmParams: {
          return_url: `${SERVER_URL}/order/${orderId}/stripe-payment-success`,
        },
      })
      .then(({ error }) => {
        if (
          error?.type === "card_error" ||
          error?.type === "validation_error"
        ) {
          setErrorMessage(error?.message ?? "An unknown error occurred")
        } else if (error) {
          setErrorMessage("An unknown error occurred")
        }
      })
      .finally(() => setIsLoading(false))
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="text-xl"><TranslatedText text="Stripe Checkout" /></div>
      {errorMessage && <div className="text-destructive">{errorMessage}</div>}
      <PaymentElement />
      <div>
        <LinkAuthenticationElement onChange={(e) => setEmail(e.value.email)} />
      </div>
      <Button
        className="w-full"
        size="lg"
        disabled={stripe == null || elements == null || isLoading}
      >
        {isLoading
          ? <TranslatedText text="Purchasing..." />
          : `Purchase ${formatCurrency(priceInCents / 100, locale, "USD")}`}
      </Button>
    </form>
  )
}
