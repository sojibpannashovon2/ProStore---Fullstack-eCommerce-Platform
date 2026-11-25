"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRightIcon, Loader2Icon } from "lucide-react"
import { SubmitHandler, useForm } from "react-hook-form"
import { toast } from "sonner"

import type { ShippingAddress } from "@/types"

import { updateUserAddress } from "@/lib/actions/users.actions"
import { shippingAddressSchema } from "@/lib/validators"

import { shippingAddressDefaultValues } from "@/constants"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { TranslatedText } from "@/components/shared/translated-text"
import { translate } from "@/lib/i18n/translations"
import { translateMessage } from "@/lib/i18n/translations"
import { useLocale } from "@/providers/locale-provider"

interface ShippingAddressFormProps {
  address: ShippingAddress
}
export function ShippingAddressForm({ address }: ShippingAddressFormProps) {
  const router = useRouter()
  const { locale } = useLocale()
  const [isPending, startTransition] = useTransition()

  const form = useForm<ShippingAddress>({
    resolver: zodResolver(shippingAddressSchema),
    defaultValues: {
      ...(address || shippingAddressDefaultValues),
      phone: address?.phone || "",
    },
  })

  const onSubmit: SubmitHandler<ShippingAddress> = (values) => {
    startTransition(async () => {
      const res = await updateUserAddress(values)
      if (!res.success) {
        toast.error(translateMessage(locale, res.message))
        return
      }

      router.push("/payment-method")
    })
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="h2-bold mt-4">
        <TranslatedText text="Shipping Address" />
      </h1>
      <p className="text-muted-foreground text-sm">
        <TranslatedText text="Please enter an address to ship to" />
      </p>
      <Form {...form}>
        <form
          method="post"
          className="space-y-4"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          {/* Full name */}
          <div className="flex flex-col gap-5 md:flex-row">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel><TranslatedText text="Full Name" /></FormLabel>
                  <FormControl>
                    <Input placeholder={translate(locale, "Enter full name")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          {/* Phone number */}
          <div className="flex flex-col gap-5 md:flex-row">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel><TranslatedText text="Phone Number" /></FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      autoComplete="tel"
                      placeholder={translate(locale, "Enter phone number")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          {/* streetAddress */}
          <div className="flex flex-col gap-5 md:flex-row">
            <FormField
              control={form.control}
              name="streetAddress"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel><TranslatedText text="Address" /></FormLabel>
                  <FormControl>
                    <Input placeholder={translate(locale, "Enter address")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          {/* city */}
          <div className="flex flex-col gap-5 md:flex-row">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel><TranslatedText text="City" /></FormLabel>
                  <FormControl>
                    <Input placeholder={translate(locale, "Enter city")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          {/* Postal code */}
          <div className="flex flex-col gap-5 md:flex-row">
            <FormField
              control={form.control}
              name="postalCode"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel><TranslatedText text="Postal Code" /></FormLabel>
                  <FormControl>
                    <Input placeholder={translate(locale, "Enter postal code")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          {/* country */}
          <div className="flex flex-col gap-5 md:flex-row">
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel><TranslatedText text="Country" /></FormLabel>
                  <FormControl>
                    <Input placeholder={translate(locale, "Enter country")} {...field} />
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
