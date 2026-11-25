import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { getMySellerApplication } from "@/lib/actions/seller-application.actions"
import { getCurrentUser } from "@/lib/auth-guard"

import { SellerApplicationForm } from "./_components/seller-application-form"

export const metadata: Metadata = {
  title: "Seller Application",
  description: "Apply to open a verified seller store.",
  robots: { index: false, follow: false },
}

export default async function SellerApplicationPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in?callbackUrl=%2Fseller-application")
  if (user.role === "seller") redirect("/seller/products")
  if (user.role !== "customer") redirect("/unauthorized")

  const application = await getMySellerApplication()
  return (
    <section className="container mx-auto px-4 py-8">
      <SellerApplicationForm initialApplication={application} />
    </section>
  )
}
