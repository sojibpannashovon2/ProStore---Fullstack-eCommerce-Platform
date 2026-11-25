import Image from "next/image"
import Link from "next/link"

import { ADMIN_LINKS, APP_NAME } from "@/constants"
import { requireAdmin } from "@/lib/auth-guard"

import { Menu } from "@/components/shared/header/components/menu"
import { MainNav } from "@/components/shared/nav-main"

import AdminSearch from "./_components/admin-search"

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const actor = await requireAdmin()
  const adminLinks =
    actor.role === "super_admin"
      ? ADMIN_LINKS
      : ADMIN_LINKS.filter((link) => link.href !== "/admin/permissions")

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
            <MainNav links={adminLinks} className="mx-6" />
            <div className="ml-auto flex items-center space-x-4">
              <AdminSearch />
              <Menu />
            </div>
          </div>
        </div>

        <div className="container mx-auto flex-1 space-y-4 px-6 pt-6 pb-8">
          {children}
        </div>
      </div>
    </>
  )
}
