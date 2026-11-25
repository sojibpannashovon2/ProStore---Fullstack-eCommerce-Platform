"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useActionState } from "react"

import { useFormStatus } from "react-dom"

import { signInWithCredentials } from "@/lib/actions/auth.actions"

import { signInDefaultValues } from "@/constants"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TranslatedText } from "@/components/shared/translated-text"
import { translateMessage } from "@/lib/i18n/translations"
import { useLocale } from "@/providers/locale-provider"

const CredentialsSignInForm = () => {
  const [data, action] = useActionState(signInWithCredentials, {
    success: false,
    message: "",
  })

  const searchParams = useSearchParams()
  const { locale } = useLocale()
  const callbackUrl = searchParams.get("callbackUrl") || "/"
  const signUpHref = `/sign-up?callbackUrl=${encodeURIComponent(callbackUrl)}`

  const SignInButton = () => {
    const { pending } = useFormStatus()

    return (
      <Button disabled={pending} className="w-full" variant="default">
        {pending ? <TranslatedText text="Signing In..." /> : <TranslatedText text="Sign In" />}
      </Button>
    )
  }

  return (
    <form action={action}>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email"><TranslatedText text="Email" /></Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue={signInDefaultValues.email}
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
            defaultValue={signInDefaultValues.password}
          />
        </div>
        <div>
          <SignInButton />
        </div>

        {data && !data.success && (
          <div className="text-destructive text-center">
            {translateMessage(locale, data.message)}
          </div>
        )}

        <div className="text-muted-foreground text-center text-sm">
          <TranslatedText text="Don't have an account?" />{" "}
          <Link href={signUpHref} target="_self" className="link">
            <TranslatedText text="Sign Up" />
          </Link>
        </div>
      </div>
    </form>
  )
}

export default CredentialsSignInForm
