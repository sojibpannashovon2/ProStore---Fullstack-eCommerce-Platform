"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useSession } from "next-auth/react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { UpdateUserProfile } from "@/types"

import { updateProfile } from "@/lib/actions/users.actions"
import { updateProfileSchema } from "@/lib/validators"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { translate } from "@/lib/i18n/translations"
import { translateMessage } from "@/lib/i18n/translations"
import { useLocale } from "@/providers/locale-provider"

export function ProfileForm() {
  const { data: session, update } = useSession()
  const { locale } = useLocale()

  const form = useForm<UpdateUserProfile>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: session?.user?.name ?? "",
      email: session?.user?.email ?? "",
    },
  })

  const onSubmit = async (values: UpdateUserProfile) => {
    const res = await updateProfile(values)

    if (!res.success) {
      toast.error(translateMessage(locale, res.message))
      return
    }

    const newSession = {
      ...session,
      user: {
        ...session?.user,
        name: values.name,
      },
    }
    await update(newSession)
    toast.success(translateMessage(locale, res.message))
  }

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-5"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className="flex flex-col gap-5">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormControl>
                  <Input
                    disabled
                    placeholder={translate(locale, "Email")}
                    className="input-field"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormControl>
                  <Input
                    placeholder={translate(locale, "Name")}
                    className="input-field"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button
          type="submit"
          size="lg"
          className="button col-span-2 w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting
            ? translate(locale, "Submitting...")
            : translate(locale, "Update Profile")}
        </Button>
      </form>
    </Form>
  )
}
