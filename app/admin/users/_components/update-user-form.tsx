"use client"

import { useRouter } from "next/navigation"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import type { UpdateUser } from "@/types"

import { updateUser } from "@/lib/actions/users.actions"
import { updateUserSchema } from "@/lib/validators"

import { ASSIGNABLE_USER_ROLES } from "@/constants"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TranslatedText } from "@/components/shared/translated-text"
import { translate } from "@/lib/i18n/translations"
import { translateMessage } from "@/lib/i18n/translations"
import { useLocale } from "@/providers/locale-provider"

interface UpdateUserFormProps {
  user: UpdateUser
}

export function UpdateUserForm({ user }: UpdateUserFormProps) {
  const router = useRouter()
  const { locale } = useLocale()

  const form = useForm<UpdateUser>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: user,
  })

  const onSubmit = async (values: UpdateUser) => {
    const res = await updateUser({
      ...values,
      id: user.id,
    })

    if (!res.success) {
      toast.error(translateMessage(locale, res.message))
    } else {
      toast.success(translateMessage(locale, res.message))
      router.push("/admin/users")
    }
  }

  return (
    <Form {...form}>
      <form
        method="POST"
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
      >
        {/* Email */}
        <div>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel><TranslatedText text="Email" /></FormLabel>
                <FormControl>
                  <Input
                    disabled={true}
                    placeholder={translate(locale, "Enter user email")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {/* Name */}
        <div>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel><TranslatedText text="Name" /></FormLabel>
                <FormControl>
                  <Input placeholder={translate(locale, "Enter user name")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {/* Role */}
        <div>
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel><TranslatedText text="Role" /></FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={translate(locale, "Select a role")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ASSIGNABLE_USER_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        <TranslatedText text={role.charAt(0).toUpperCase() + role.slice(1)} />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex-between mt-6">
          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting
              ? <TranslatedText text="Submitting..." />
              : <TranslatedText text="Update User" />}
          </Button>
        </div>
      </form>
    </Form>
  )
}
