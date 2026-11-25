"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRightIcon, Loader2Icon } from "lucide-react"
import { SubmitHandler, useForm } from "react-hook-form"
import { toast } from "sonner"

import type { PaymentMethod } from "@/types"

import { updateUserPaymentMethod } from "@/lib/actions/users.actions"
import { paymentMethodSchema } from "@/lib/validators"

import { DEFAULT_PAYMENT_METHOD, PAYMENT_METHODS } from "@/constants"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { TranslatedText } from "@/components/shared/translated-text"
import { translateMessage } from "@/lib/i18n/translations"
import { useLocale } from "@/providers/locale-provider"

interface PaymentMethodFormProps {
  preferredPaymentMethod: string | null
}
export function PaymentMethodForm({
  preferredPaymentMethod,
}: PaymentMethodFormProps) {
  const router = useRouter()
  const { locale } = useLocale()
  const [isPending, startTransition] = useTransition()

  const form = useForm<PaymentMethod>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      type: preferredPaymentMethod || DEFAULT_PAYMENT_METHOD,
    },
  })

  const onSubmit: SubmitHandler<PaymentMethod> = (values) => {
    startTransition(async () => {
      const res = await updateUserPaymentMethod(values)
      if (!res.success) {
        toast.error(translateMessage(locale, res.message))
        return
      }

      router.push("/place-order")
    })
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="h2-bold mt-4">
        <TranslatedText text="Payment Method" />
      </h1>
      <p className="text-muted-foreground text-sm">
        <TranslatedText text="Choose how you would like to pay" />
      </p>
      <Form {...form}>
        <form
          method="post"
          className="space-y-4"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div className="flex flex-col gap-5 md:flex-row">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      className="flex flex-col space-y-2"
                    >
                      {PAYMENT_METHODS.map((paymentMethod) => (
                        <FormItem
                          key={paymentMethod}
                          className="flex items-center space-y-0 space-x-3"
                        >
                          <FormControl>
                            <RadioGroupItem
                              value={paymentMethod}
                              checked={field.value === paymentMethod}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            <span className="flex flex-col">
                              <span><TranslatedText text={paymentMethod} /></span>
                              <span className="text-muted-foreground text-xs">
                                <TranslatedText
                                  text={
                                    ["PayPal", "Stripe"].includes(paymentMethod)
                                      ? "Charged in USD"
                                      : "Charged in BDT"
                                  }
                                />
                              </span>
                            </span>
                          </FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          {/* Submit button */}
          <div className="flex gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <Loader2Icon className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRightIcon className="h-4 w-4" />
              )}{" "}
              <TranslatedText text="Continue" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
