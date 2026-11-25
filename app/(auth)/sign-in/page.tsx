import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"

import { auth } from "@/auth"

import { APP_NAME } from "@/constants"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { TranslatedText } from "@/components/shared/translated-text"

import CredentialsSignInForm from "./_components/credentials-signin-form"

export const metadata: Metadata = {
  title: "Sign In",
}

interface SignInPageProps {
  searchParams: Promise<{
    callbackUrl: string
  }>
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { callbackUrl } = await searchParams

  const session = await auth()

  if (session?.user?.id) {
    return redirect(callbackUrl || "/")
  }

  return (
    <div className="mx-auto w-full max-w-md px-3 sm:px-0">
      <Card>
        <CardHeader className="space-y-4">
          <Link href="/" className="flex-center">
            <Image
              src="/images/kinora-logo.png"
              width={450}
              height={150}
              alt={`${APP_NAME} logo`}
              className="h-12 w-auto"
              priority={true}
            />
          </Link>
          <CardTitle className="text-center"><TranslatedText text="Sign In" /></CardTitle>
          <CardDescription className="text-center">
            <TranslatedText text="Sign in to your account" />
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <CredentialsSignInForm />
        </CardContent>
      </Card>
    </div>
  )
}
