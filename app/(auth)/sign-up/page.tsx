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

import SignUpForm from "./_components/sign-up-form"

export const metadata: Metadata = {
  title: "Sign Up",
}

interface SignUpPageProps {
  searchParams: Promise<{
    callbackUrl: string
  }>
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const { callbackUrl } = await searchParams

  const session = await auth()

  if (session) {
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
          <CardTitle className="text-center"><TranslatedText text="Create Account" /></CardTitle>
          <CardDescription className="text-center">
            <TranslatedText text="Enter your information below to sign up" />
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SignUpForm />
        </CardContent>
      </Card>
    </div>
  )
}
