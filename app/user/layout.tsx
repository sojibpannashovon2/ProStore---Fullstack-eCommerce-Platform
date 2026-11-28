import Image from "next/image"
import Link from "next/link"

import { APP_NAME, USER_LINKS } from "@/constants"

import { auth } from "@/auth"
import { Menu } from "@/components/shared/header/components/menu"
import { MainNav } from "@/components/shared/nav-main"

export default async function UserLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await auth()
  const isCustomer = session?.user?.role === "customer"
  // Wishlist is customer-only; hide it for admin/seller viewing user pages.
  const links = isCustomer
    ? USER_LINKS
    : USER_LINKS.filter((link) => link.href !== "/user/wishlist")
  return (
    <>
      <div className="flex flex-col">
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
            <MainNav links={links} className="mx-6" />
            <div className="ml-auto flex items-center space-x-4">
              <Menu />
            </div>
          </div>
        </div>

        <div className="container mx-auto flex-1 space-y-4 p-8 pt-6">
          {children}
        </div>
      </div>
    </>
  )
}
