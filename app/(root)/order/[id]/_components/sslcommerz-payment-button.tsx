"use client"

import { useTransition } from "react"

import { useLocale } from "@/providers/locale-provider"
import { Loader2Icon, LockKeyholeIcon } from "lucide-react"
import { toast } from "sonner"

import { createSSLCommerzPaymentSession } from "@/lib/actions/sslcommerz-payment.actions"
import { translateMessage } from "@/lib/i18n/translations"

import { TranslatedText } from "@/components/shared/translated-text"
import { Button } from "@/components/ui/button"

export function SSLCommerzPaymentButton({ orderId }: { orderId: string }) {
  const [isPending, startTransition] = useTransition()
  const { locale } = useLocale()

  const startPayment = () => {
    startTransition(async () => {
      const result = await createSSLCommerzPaymentSession(orderId)
      if (!result.success) {
        toast.error(translateMessage(locale, result.message))
        return
      }

      window.location.assign(result.redirectTo)
    })
  }

  return (
    <Button
      type="button"
      className="w-full"
      disabled={isPending}
      onClick={startPayment}
    >
      {isPending ? (
        <Loader2Icon className="h-4 w-4 animate-spin" />
      ) : (
        <LockKeyholeIcon className="h-4 w-4" />
      )}
      <TranslatedText text="Pay securely with SSLCOMMERZ" />
    </Button>
  )
}
