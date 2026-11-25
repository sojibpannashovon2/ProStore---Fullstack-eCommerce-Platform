"use client"

import { useTransition } from "react"

import { toast } from "sonner"

import { updateOrderToPaidCOD } from "@/lib/actions/order.actions"

import { Button } from "@/components/ui/button"
import { TranslatedText } from "@/components/shared/translated-text"
import { translateMessage } from "@/lib/i18n/translations"
import { useLocale } from "@/providers/locale-provider"

interface MarkAsPaidButtonProps {
  orderId: string
}

export function MarkAsPaidButton({ orderId }: MarkAsPaidButtonProps) {
  const [isPending, startTransition] = useTransition()
  const { locale } = useLocale()

  return (
    <Button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const res = await updateOrderToPaidCOD(orderId)

          if (res.success) {
            toast.success(translateMessage(locale, res.message))
          } else {
            toast.error(translateMessage(locale, res.message))
          }
        })
      }
    >
      {isPending
        ? <TranslatedText text="processing..." />
        : <TranslatedText text="Mark As Paid" />}
    </Button>
  )
}
