"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useActionState } from "react"

import { useFormStatus } from "react-dom"

import { signUpUser } from "@/lib/actions/auth.actions"
import { showSuccessToast } from "@/components/ui/sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TranslatedText } from "@/components/shared/translated-text"
import { translateMessage } from "@/lib/i18n/translations"
import { useLocale } from "@/providers/locale-provider"

const SignUpForm = () => {
  const [data, action] = useActionState(signUpUser, {
    success: false,
    message: "",
  })

  const searchParams = useSearchParams()
  const { locale } = useLocale()
  const callbackUrl = searchParams.get("callbackUrl") || "/"
  const signInHref = `/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`

  const SignUpButton = () => {
    const { pending } = useFormStatus()

    return (
      <Button disabled={pending} className="w-full" variant="default">
        {pending ? <TranslatedText text="Submitting..." /> : <TranslatedText text="Sign Up" />}
      </Button>
    )
  }

  return (
    <form action={action}>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email"><TranslatedText text="Name" /></Label>
          <Input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            // defaultValue={signUpDefaultValues.name}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email"><TranslatedText text="Email" /></Label>
          <Input
            id="email"
            name="email"
            type="text"
            autoComplete="email"
            // defaultValue={signUpDefaultValues.email}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password"><TranslatedText text="Password" /></Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="password"
            // defaultValue={signUpDefaultValues.password}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword"><TranslatedText text="Confirm Password" /></Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            autoComplete="confirmPassword"
            // defaultValue={signUpDefaultValues.confirmPassword}
          />
        </div>
        <div>
          <SignUpButton />
        </div>

        {data && !data.success && (
          <div className="text-destructive text-center">
            {translateMessage(locale, data.message)}
          </div>
        )}
        {data && data.success && (
          <SignUpSuccessToast message={data.message} />
        )}

        <div className="text-muted-foreground text-center text-sm">
          <TranslatedText text="Already have an account?" />{" "}
          <Link href={signInHref} target="_self" className="link">
            <TranslatedText text="Sign In" />
          </Link>
        </div>
      </div>
    </form>
  )
}

export default SignUpForm

function SignUpSuccessToast({ message }: { message: string }) {
  const { locale } = useLocale()
  useEffect(() => {
    showSuccessToast(translateMessage(locale, message) || message)
  }, [locale, message])
  return null
}
