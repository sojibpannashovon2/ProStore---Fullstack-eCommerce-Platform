import Image from "next/image"
import Link from "next/link"

import { APP_NAME, SELLER_LINKS } from "@/constants"
import { requireSeller } from "@/lib/auth-guard"

import { Menu } from "@/components/shared/header/components/menu"
import { MainNav } from "@/components/shared/nav-main"

export default async function SellerLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  await requireSeller()

  return (
    <div className="flex min-h-screen flex-col">
      <div className="container mx-auto border-b">
        <div className="flex h-16 items-center px-4">
          <Link href="/" className="w-36">
            <Image
              src="/images/kinora-logo.png"
              height={150}
              width={450}
              alt={APP_NAME}
              className="h-10 w-auto"
            />
          </Link>
          <MainNav links={SELLER_LINKS} className="mx-6" />
          <div className="ml-auto">
            <Menu />
          </div>
        </div>
      </div>
      <main className="container mx-auto flex-1 space-y-4 px-6 py-6">
        {children}
      </main>
    </div>
  )
}
