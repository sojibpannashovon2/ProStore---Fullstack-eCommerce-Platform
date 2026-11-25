"use client"

import { useLocale } from "@/providers/locale-provider"
import {
  PayPalButtons,
  PayPalScriptProvider,
  usePayPalScriptReducer,
} from "@paypal/react-paypal-js"
import { toast } from "sonner"

import {
  approvePayPalOrder,
  createPayPalOrder,
} from "@/lib/actions/paypal-payment.actions"
import { translateMessage } from "@/lib/i18n/translations"

import { CurrencyText } from "@/components/shared/currency-text"
import { TranslatedText } from "@/components/shared/translated-text"
import { Card, CardContent } from "@/components/ui/card"

import { MarkAsDeliveredButton } from "./mark-as-delivered-button"
import { MarkAsPaidButton } from "./mark-as-paid-button"
import { SSLCommerzPaymentButton } from "./sslcommerz-payment-button"
import { StripePayment } from "./stripe-payment"

interface PaypalStripeCardProps {
  orderId: string
  itemsPrice: string
  discountPrice: string
  couponCode?: string | null
  shippingPrice: string
  taxPrice: string
  totalPrice: string
  isPaid: boolean
  paymentMethod: string
  isAdmin: boolean
  isDelivered: boolean
  stripeClientSecret: string | null
}

export function PaypalStripeCard({
  orderId,
  itemsPrice,
  discountPrice,
  couponCode,
  shippingPrice,
  taxPrice,
  totalPrice,
  isPaid,
  paymentMethod,
  isAdmin,
  isDelivered,
  stripeClientSecret,
}: PaypalStripeCardProps) {
  const { locale } = useLocale()
  const paymentCurrency = ["PayPal", "Stripe"].includes(paymentMethod)
    ? "USD"
    : "BDT"

  const PrintLoadingState = () => {
    const [{ isPending, isRejected }] = usePayPalScriptReducer()
    let status = ""

    if (isPending) {
      status = "Loading PayPal..."
    } else if (isRejected) {
      status = "Error Loading PayPal"
    }
    return <TranslatedText text={status} />
  }

  const handleCreatePayPalOrder = async () => {
    const res = await createPayPalOrder(orderId)

    if (!res.success) {
      toast.error(translateMessage(locale, res.message))
    }

    return res.data
  }

  const handleApprovePayPalOrder = async (data: { orderID: string }) => {
    const res = await approvePayPalOrder(orderId, data)
    if (res.success) {
      toast.success(translateMessage(locale, res.message))
    } else {
      toast.error(translateMessage(locale, res.message))
    }
  }

  return (
    <Card>
      <CardContent className="gap-4 space-y-4 p-4">
        <div className="flex justify-between">
          <div>
            <TranslatedText text="Items" />
          </div>
          <div>
            <CurrencyText value={itemsPrice} currency={paymentCurrency} />
          </div>
        </div>
        {Number(discountPrice) > 0 && (
          <div className="flex justify-between text-green-700">
            <div>
              <TranslatedText text="Discount" />
              {couponCode ? ` (${couponCode})` : ""}
            </div>
            <div>
              -<CurrencyText value={discountPrice} currency={paymentCurrency} />
            </div>
          </div>
        )}
        <div className="flex justify-between">
          <div>
            <TranslatedText text="Tax" />
          </div>
          <div>
            <CurrencyText value={taxPrice} currency={paymentCurrency} />
          </div>
        </div>
        <div className="flex justify-between">
          <div>
            <TranslatedText text="Shipping" />
          </div>
          <div>
            <CurrencyText value={shippingPrice} currency={paymentCurrency} />
          </div>
        </div>
        <div className="flex justify-between">
          <div>
            <TranslatedText text="Total" />
          </div>
          <div>
            <CurrencyText value={totalPrice} currency={paymentCurrency} />
          </div>
        </div>

        {/* PayPal Payment */}
        {!isPaid && paymentMethod === "PayPal" && (
          <div>
            <PayPalScriptProvider
              options={{ clientId: process.env.PAYPAL_CLIENT_ID || "sb" }}
            >
              <PrintLoadingState />
              <PayPalButtons
                createOrder={handleCreatePayPalOrder}
                onApprove={handleApprovePayPalOrder}
              />
            </PayPalScriptProvider>
          </div>
        )}

        {/* Stripe Payment */}
        {!isPaid && paymentMethod === "Stripe" && stripeClientSecret && (
          <StripePayment
            priceInCents={Number(totalPrice) * 100}
            orderId={orderId}
            clientSecret={stripeClientSecret}
          />
        )}

        {!isPaid && paymentMethod === "SSLCOMMERZ" && (
          <SSLCommerzPaymentButton orderId={orderId} />
        )}

        {/* Cash On Delivery */}
        {isAdmin && !isPaid && paymentMethod === "CashOnDelivery" && (
          <MarkAsPaidButton orderId={orderId} />
        )}
        {isAdmin && isPaid && !isDelivered && (
          <MarkAsDeliveredButton orderId={orderId} />
        )}
      </CardContent>
    </Card>
  )
}
